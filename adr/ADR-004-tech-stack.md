# ADR-004: Tech Stack

**Status:** Accepted  
**Date:** 2026-07-05

## Context

We need to select the foundational technology stack before writing any code.
Key constraints: AI-heavy workloads, multi-tenant SaaS, fast iteration, small team.

## Decision

| Layer | Choice | Rationale |
|---|---|---|
| **Backend** | Python 3.12 + FastAPI | Best AI/ML ecosystem. OpenAI, LangChain, LlamaIndex all native. Async. |
| **Frontend** | Next.js 14 + TypeScript | App Router, SSR, excellent DX, same language as shared types. |
| **Primary DB** | PostgreSQL 16 | Mature, reliable, pgvector for embeddings, RLS for multi-tenancy. |
| **Vector Search** | pgvector (MVP) | Avoid premature optimization. Migrate to Pinecone if needed post-PMF. |
| **Auth** | Supabase Auth | Free to 50k MAU, JWT, OAuth providers, integrates with Postgres RLS. |
| **Queue** | Redis + Celery | Signal collection and agent runs are async. Redis also used for caching. |
| **LLM** | OpenAI GPT-4o | Best quality/cost ratio for reasoning tasks. |
| **Embeddings** | text-embedding-3-large | 3072 dimensions, high quality for knowledge graph search. |
| **Monorepo** | pnpm + Turborepo | Fast, cache-aware builds across apps/packages/services. |
| **Containers** | Docker + docker-compose | Dev environment parity. |
| **CI/CD** | GitHub Actions | Free for public repos, integrates with existing tooling. |
| **Deployment (MVP)** | Railway | Fast to ship. Migrate to AWS ECS after Series A. |
| **Observability** | Prometheus + Grafana | Open source standard. Structured JSON logging. |

## Monorepo Structure

```
Atlas/
├── apps/
│   ├── web/          # Next.js dashboard
│   └── api/          # FastAPI backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared React components
├── services/
│   ├── knowledge/    # Knowledge Engine (Python)
│   ├── signal/       # Signal Engine (Python)
│   └── ingestion/    # Data ingestion pipeline (Python)
├── docs/
├── adr/
└── rfc/
```

## Consequences

- Python backend means we use separate type definitions for frontend (packages/types)
- pgvector is sufficient for < 10M embeddings; revisit at scale
- Supabase Auth ties us to their platform — acceptable risk at MVP stage
- Railway deployment limits some infrastructure control — acceptable for speed
