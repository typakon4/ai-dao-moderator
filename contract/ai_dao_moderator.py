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

    def __init__(self, constitution: str) -> None:
        self.constitution = constitution

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

Respond with JSON only, no other text:
{{"approved": true, "score": 85, "reason": "one or two sentence explanation"}}

Where:
- approved: boolean
- score: integer 0-100
- reason: string"""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            inner,
            "Two evaluations are equivalent when they reach the same approval "
            "decision and assign scores within 10 points of each other.",
        )
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

Respond with JSON only, no other text:
{{"weight": 7, "reason": "one sentence explanation"}}

Where weight is an integer 1-10."""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            inner,
            "Two argument scores are equivalent when they are within 2 points "
            "of each other and agree on the overall quality assessment.",
        )
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
        )

    @gl.public.write
    def vote(self, pid: str, voter: str, support: bool, argument: str) -> None:
        if pid not in self.proposals:
            raise Exception(f"Proposal '{pid}' not found")
        if not self.proposals[pid].approved:
            raise Exception(f"Proposal '{pid}' was rejected and is not open for voting")
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
            "passed": yes_weight > no_weight,
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
        }
