# Demo Script — AI DAO Moderator

> Длительность: 3-5 минут. Цель: показать два AI-слоя в действии.

## Структура видео

### 0:00 — 0:30 | Hook
**Голос/слайд:**
> "DAOs fail because whales dominate and spam proposals waste time.
> What if AI could filter proposals AND weight votes by argument quality — on-chain?"

### 0:30 — 1:30 | Deploy
- Показать контракт в GenLayer Studio
- Задеплоить с конституцией DAO (например: "This DAO funds open-source AI tooling")
- Показать transaction на Bradbury testnet

### 1:30 — 2:30 | Proposal Gate (ключевой момент)
**Сценарий 1 — плохой пропозал:**
- Submit: "Buy me a Lamborghini"
- Показать AI-вердикт: `approved: false`, reason: "Not aligned with DAO goals"

**Сценарий 2 — хороший пропозал:**
- Submit: "Fund development of open-source GenLayer SDK for Python devs"
- Показать AI-вердикт: `approved: true`, score: 8, reason: "Directly aligned..."

### 2:30 — 3:30 | Argument-Weighted Voting
- Voter A: `support: true`, argument: "yes" → weight: 2
- Voter B: `support: true`, argument: "This SDK will lower barrier to entry for 10k+ Python devs and increase GenLayer ecosystem adoption" → weight: 9
- Показать result: `votes_for: 11, votes_against: 0`
- **Акцент:** качество аргумента решает, не размер кошелька

### 3:30 — 4:00 | Outro
> "AI DAO Moderator — governance that rewards thinking, not just holding.
> Built on GenLayer. Deployed on Bradbury testnet."

## Что должно быть открыто во время записи
1. GenLayer Studio (контракт)
2. Frontend (форма сабмита + результаты)
3. Explorer транзакций (опционально)

## Заготовки для конституции DAO
```
This DAO funds open-source AI tooling and developer infrastructure.
Proposals must be specific, actionable, and benefit the broader developer community.
Budget proposals must include estimated costs and success metrics.
```