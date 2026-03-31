# AI DAO Moderator — GenLayer Bradbury Hackathon

> On-chain governance where AI filters noise and rewards quality thinking.

## Problem

DAOs are broken:
- **Whales dominate** — token-weighted voting ignores argument quality
- **Spam proposals** waste community attention
- **Low-quality votes** pollute governance outcomes

## Solution

AI DAO Moderator — a GenLayer Intelligent Contract with two AI layers:

1. **AI Gatekeeper** — filters proposals before they reach voting. Checks alignment with DAO constitution, feasibility, and spam.
2. **AI Argument Scorer** — weighs each vote by argument quality (1–10). A well-reasoned argument from a small holder beats a lazy vote from a whale.

## How It Works

```
Member → submit_proposal() → AI checks constitution → approved / rejected
                                                              ↓
Member → vote(argument) → AI scores argument 1-10 → weight added to result
                                                              ↓
                                              get_result() → weighted pass/fail
```

## Tech Stack

| Layer | Tool |
|---|---|
| Intelligent Contract | GenLayer (Python) |
| AI Consensus | `gl.eq_principle_prompt_comparative` |
| Frontend | Next.js |
| Storage | TreeMap (on-chain) |

## Contract Interface

- `submit_proposal(pid, title, body)` — submit + AI gate
- `vote(pid, voter, support, argument)` — vote + AI weight
- `get_result(pid)` → weighted votes + pass/fail
- `get_proposal(pid)` → proposal data + AI verdict

## Track

**AI Governance** — GenLayer Bradbury Hackathon (deadline: April 3, 2026)

## Project Structure

```
hackathon-genlayer/
├── README.md
├── contract/
│   └── ai_dao_moderator.py
├── frontend/
├── docs/
│   ├── architecture.md
│   └── demo-script.md
└── logs/
    └── 2026-03-31.md
```