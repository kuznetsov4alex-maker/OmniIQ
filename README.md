# OmniIQ

**The Company Brain for Autonomous Digital Visibility.**

OmniIQ is not an SEO tool. It's not a Knowledge Graph platform. It's the system
that understands how the world sees your business — and knows what to do about it.

> *Yext knows who you are. OmniIQ knows what you should do.*

---

## What OmniIQ Does

```
Your Business Knowledge
        ↓
   Company Brain ──→ Signal Collection (SEO · AI · Entity · Reputation)
        ↓                        ↓
   Gap Analysis ←── Visibility Audit
        ↓
   Decision Engine (ranked by impact × confidence)
        ↓
   Human Approval
        ↓
   Execution Engine
        ↓
   Outcome Measurement
        ↓
   Learning → improves next recommendations
```

## The Core Pipeline (5 Engines)

| Engine | Role |
|---|---|
| **Knowledge Engine** | Canonical Company Brain — verified facts, entities, relationships |
| **Signal Engine** | Collects SEO, AI mention, entity, and reputation signals |
| **Decision Engine** | Ranks actions by expected impact × confidence |
| **Execution Engine** | Safe automation with human approval workflow |
| **Learning Engine** | Measures outcomes, improves future recommendations |

## AI Agents

```
Planner → Research → Knowledge → Decision → Execution → Review
```

## Monorepo Structure

```
apps/
  web/          Next.js 14 dashboard
  api/          FastAPI backend
packages/
  types/        Shared TypeScript types
  ui/           Shared React components
services/
  knowledge/    Knowledge Engine
  signal/       Signal Engine
  ingestion/    Data ingestion pipeline
docs/           Product, architecture, AI, data, API docs
adr/            Architecture Decision Records
rfc/            Request for Comments
```

## Tech Stack

- **Backend:** Python 3.12 + FastAPI
- **Frontend:** Next.js 14 + TypeScript
- **Database:** PostgreSQL 16 + pgvector
- **Auth:** Supabase Auth
- **Queue:** Redis + Celery
- **LLM:** OpenAI GPT-4o
- **Monorepo:** pnpm + Turborepo

## Status

🔴 Sprint 1 — Foundation (in progress)

## Key Documents

- [Vision](docs/00-company/VISION.md)
- [Mission](docs/00-company/MISSION.md)
- [Manifesto](docs/00-company/MANIFESTO.md)
- [Principles](docs/00-company/PRINCIPLES.md)
- [PRD](docs/01-product/PRD.md)
- [System Architecture](docs/02-architecture/SYSTEM.md)
- [AI Bible](docs/03-ai/AI_BIBLE.md)
- [ADR-004: Tech Stack](adr/ADR-004-tech-stack.md)
- [ADR-005: Competitive Positioning](adr/ADR-005-competitive-positioning.md)
