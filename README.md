# AI DAO Moderator

> On-chain governance where AI filters noise and rewards quality thinking.

[![Built for GenLayer Bradbury Hackathon](https://img.shields.io/badge/GenLayer-Bradbury%20Hackathon-6c3bea?style=flat-square)](https://dorahacks.io/hackathon/genlayer-bradbury)
[![Track: AI Governance](https://img.shields.io/badge/Track-AI%20Governance-00d4aa?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## The Problem

DAOs are broken:
- **Whales dominate** — 1 token = 1 vote ignores argument quality
- **Spam proposals** waste community attention and clog governance
- **Low-quality votes** pollute outcomes regardless of reasoning

## The Solution

**AI DAO Moderator** uses GenLayer Intelligent Contracts to add two AI-powered governance layers:

1. **AI Gatekeeper** — evaluates every proposal before voting. Checks constitutional alignment, feasibility, and legitimacy. Spam and off-mission proposals never reach voting.

2. **AI Argument Scorer** — weights each vote by argument quality (1–10). A well-reasoned argument from a small holder beats a lazy "yes" from a whale.

## How It Works

```
Member → submit_proposal(pid, title, body)
              ↓
         AI checks: constitutional alignment + feasibility + legitimacy
              ↓
      approved → open for voting     rejected → blocked with reason
              ↓
Member → vote(pid, support, argument)
              ↓
         AI scores argument quality 1-10 → score becomes vote weight
              ↓
         get_result(pid) → weighted yes/no + pass/fail verdict
```

## Tech Stack

| Layer | Technology |
|---|---|
| Intelligent Contract | GenLayer (Python) |
| AI Consensus | `gl.eq_principle_prompt_comparative` |
| AI Calls | `gl.nondet.exec_prompt` with JSON response format |
| Frontend | Next.js + TypeScript |
| On-chain Storage | `TreeMap` (GenLayer native) |

## Contract API

### Write Methods
| Method | Description |
|---|---|
| `submit_proposal(pid, title, body)` | Submit proposal — AI evaluates and stores approved/score/reason |
| `vote(pid, support, argument)` | Cast vote — AI scores argument quality, weight = score |
| `finalize_votes(pid, min_yes_weight)` | Finalize and record result on-chain |

### Read Methods
| Method | Returns |
|---|---|
| `get_proposal(pid)` | Proposal data + AI verdict + score |
| `get_result(pid)` | Weighted yes/no counts + vote_passed |
| `get_all_proposals()` | All proposals with statuses |

## Why GenLayer?

GenLayer's `eq_principle_prompt_comparative` consensus mechanism makes AI judgment **deterministic and trustless** — multiple validators run the same AI call independently, and the result is only accepted when they agree. This means AI governance decisions are tamper-resistant and fully on-chain.

## Project Structure

```
ai-dao-moderator/
├── contract/
│   ├── ai_dao_moderator.py    # Core Intelligent Contract
│   └── genlayer_config.py     # GenLayer config
├── frontend/                  # Next.js dApp
│   ├── app/
│   ├── components/            # ProposalCard, VoteModal, etc.
│   └── lib/
│       ├── contracts/         # Contract ABI + types
│       └── genlayer/          # Wallet + client
├── docs/
│   ├── architecture.md        # System design
│   └── demo-script.md         # Demo walkthrough
└── test/
    └── test_ai_dao_moderator.py
```

## Quick Start

### Deploy Contract

1. Open [studio.genlayer.com](https://studio.genlayer.com)
2. Upload `contract/ai_dao_moderator.py`
3. Deploy with your DAO constitution as constructor argument

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

---

Built with ❤️ for the **GenLayer Bradbury Hackathon** · Track: AI Governance
