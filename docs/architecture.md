# Architecture — AI DAO Moderator

## Overview

GenLayer Intelligent Contract выполняется на сети валидаторов, каждый из которых прогоняет LLM-вызовы независимо. Консенсус достигается через `eq_principle_prompt_comparative` — валидаторы сравнивают результаты и принимают большинством.

## Flow

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                │
│  [Submit Proposal]  [Vote + Argument]  [Results]    │
└────────────────────┬────────────────────────────────┘
                     │ HTTP → GenLayer RPC
┌────────────────────▼────────────────────────────────┐
│            AIDAOModerator.py (Intelligent Contract) │
│                                                     │
│  submit_proposal()                                  │
│    └─► gl.eq_principle_prompt_comparative()         │
│          └─► LLM: "Does this fit the constitution?" │
│          └─► consensus across validators            │
│          └─► store: approved/score/reason           │
│                                                     │
│  vote()                                             │
│    └─► gl.eq_principle_prompt_comparative()         │
│          └─► LLM: "Rate this argument 1-10"         │
│          └─► consensus across validators            │
│          └─► weight = score, added to votes_for/against │
│                                                     │
│  get_result() / get_proposal()  ← read-only views   │
└─────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Why `eq_principle_prompt_comparative`?
GenLayer валидаторы сравнивают LLM-ответы между собой. Этот метод даёт детерминированный консенсус даже при разных моделях у разных валидаторов. Оптимален для субъективных оценок.

### Why argument-weighted voting?
Стандартное токен-голосование = plutocracy. Здесь вес голоса = качество аргумента. Маленький холдер с сильным аргументом может переломить голосование.

### Why TreeMap over dict?
GenLayer требует сериализуемые on-chain структуры. TreeMap — нативный тип GenLayer с детерминированной сортировкой.

## AI Prompts

### Proposal Gatekeeper
```
DAO: {dao_name}
Constitution: {constitution}

Proposal:
Title: {title}
Body: {body}

Evaluate:
- Aligned with DAO goals?
- Feasible and clear?
- Not spam or duplicate?

Respond with JSON: {"approved": true/false, "score": 1-10, "reason": "..."}
```
Principle: "Approve only if proposal is relevant, constructive, and aligned with DAO constitution"

### Argument Scorer
```
Proposal: {title}
Vote: FOR/AGAINST
Argument: {argument}

Rate argument quality 1-10.
```
Principle: "Score based on logical coherence, evidence quality, and relevance"

## State Schema

```python
proposals: TreeMap[str, dict] = {
    pid: {
        "title": str,
        "body": str,
        "approved": bool,
        "ai_score": int,       # 1-10
        "ai_reason": str,
        "votes_for": int,      # weighted sum
        "votes_against": int,  # weighted sum
        "voters": TreeMap[str, {"support": bool, "weight": int}]
    }
}
constitution: str
dao_name: str
```