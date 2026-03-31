# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Proposal:
    pid: str
    title: str
    body: str
    approved: bool
    score: u256
    reason: str
    finalized: bool
    vote_passed: bool


@allow_storage
@dataclass
class Vote:
    voter: str
    support: bool
    argument: str
    weight: u256


class AIDAOModerator(gl.Contract):
    constitution: str
    proposals: TreeMap[str, Proposal]
    votes: TreeMap[str, TreeMap[str, Vote]]
    _owner: str

    def __init__(self, constitution: str) -> None:
        self.constitution = constitution
        self._owner = str(gl.message.sender_address)

    def _evaluate_proposal(self, title: str, body: str) -> dict:
        constitution = self.constitution

        def inner() -> str:
            task = f"""You are a strict DAO proposal evaluator.

DAO Constitution:
{constitution}

Evaluate this proposal:
Title: {title}
Body: {body}

A proposal passes only if ALL three criteria are met:
1. Constitutional alignment — furthers the DAO's stated mission
2. Feasibility — technically and practically achievable
3. Legitimacy — genuine proposal, not spam or an attack

Respond with JSON ONLY, no other text:
{{"approved": true, "score": 85, "reason": "one or two sentence explanation"}}

It is mandatory that you respond only using the JSON format above, nothing else."""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_str = gl.eq_principle.strict_eq(inner)
        return json.loads(result_str)

    def _score_argument(self, argument: str, support: bool) -> dict:
        constitution = self.constitution

        def inner() -> str:
            position = "supporting" if support else "opposing"
            task = f"""You are a DAO voting-argument quality evaluator.

DAO Constitution:
{constitution}

A voter is {position} a proposal with this argument:
"{argument}"

Score the argument quality 1-10:
- 1-3: Empty, vague, spam, or no substance
- 4-6: Some reasoning but weakly developed
- 7-9: Well-reasoned, specific, references the constitution or concrete evidence
- 10: Exceptional — comprehensive, data-backed, clearly advances the DAO mission

Respond with JSON ONLY, no other text:
{{"weight": 7, "reason": "one sentence explanation"}}

It is mandatory that you respond only using the JSON format above, nothing else."""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_str = gl.eq_principle.strict_eq(inner)
        return json.loads(result_str)

    @gl.public.write
    def submit_proposal(self, pid: str, title: str, body: str) -> None:
        if pid in self.proposals:
            raise Exception(f"Proposal '{pid}' already exists")

        evaluation = self._evaluate_proposal(title, body)

        self.proposals[pid] = Proposal(
            pid=pid,
            title=title,
            body=body,
            approved=bool(evaluation.get("approved", False)),
            score=u256(max(0, min(100, int(evaluation.get("score", 0))))),
            reason=str(evaluation.get("reason", "")),
            finalized=False,
            vote_passed=False,
        )

    @gl.public.write
    def vote(self, pid: str, support: bool, argument: str) -> None:
        if pid not in self.proposals:
            raise Exception(f"Proposal '{pid}' not found")
        if not self.proposals[pid].approved:
            raise Exception(f"Proposal '{pid}' was rejected and is not open for voting")
        if self.proposals[pid].finalized:
            raise Exception(f"Proposal '{pid}' is already finalized")

        voter = str(gl.message.sender_address)
        if pid in self.votes and voter in self.votes[pid]:
            raise Exception(f"Voter '{voter}' has already voted on proposal '{pid}'")

        scoring = self._score_argument(argument, support)
        weight = max(1, min(10, int(scoring.get("weight", 5))))

        self.votes.get_or_insert_default(pid)[voter] = Vote(
            voter=voter,
            support=support,
            argument=argument,
            weight=u256(weight),
        )

    @gl.public.write
    def finalize_votes(self, pid: str, min_yes_weight: int) -> None:
        if pid not in self.proposals:
            raise Exception(f"Proposal '{pid}' not found")
        p = self.proposals[pid]
        if p.finalized:
            raise Exception(f"Proposal '{pid}' already finalized")
        if not p.approved:
            raise Exception(f"Proposal '{pid}' was rejected by AI moderator")

        yes = 0
        no = 0
        if pid in self.votes:
            for _v, vote in self.votes[pid].items():
                if vote.support:
                    yes += int(vote.weight)
                else:
                    no += int(vote.weight)

        p.finalized = True
        p.vote_passed = yes >= min_yes_weight and yes > no
        self.proposals[pid] = p

    @gl.public.view
    def get_result(self, pid: str) -> dict:
        if pid not in self.proposals:
            raise Exception(f"Proposal '{pid}' not found")

        yes_weight = 0
        no_weight = 0
        total_votes = 0

        if pid in self.votes:
            for _voter, v in self.votes[pid].items():
                w = int(v.weight)
                total_votes += 1
                if v.support:
                    yes_weight += w
                else:
                    no_weight += w

        p = self.proposals[pid]
        return {
            "pid": pid,
            "approved": p.approved,
            "ai_score": int(p.score),
            "yes_weight": yes_weight,
            "no_weight": no_weight,
            "total_votes": total_votes,
            "vote_passed": yes_weight > no_weight,
            "finalized": p.finalized,
            "final_result": p.vote_passed,
        }

    @gl.public.view
    def get_all_proposals(self) -> list:
        return [
            {
                "pid": p.pid,
                "title": p.title,
                "body": p.body,
                "approved": p.approved,
                "score": int(p.score),
                "reason": p.reason,
                "finalized": p.finalized,
                "vote_passed": p.vote_passed,
            }
            for _pid, p in self.proposals.items()
        ]

    @gl.public.view
    def get_proposal(self, pid: str) -> dict:
        if pid not in self.proposals:
            raise Exception(f"Proposal '{pid}' not found")

        p = self.proposals[pid]
        return {
            "pid": p.pid,
            "title": p.title,
            "body": p.body,
            "approved": p.approved,
            "score": int(p.score),
            "reason": p.reason,
            "finalized": p.finalized,
            "vote_passed": p.vote_passed,
        }
