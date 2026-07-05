# Sprint 1 — Foundation

**Goal:** Repository works. A developer can clone, run `docker-compose up`, and get
a running API with health check within 10 minutes.

## Completed

- [x] Monorepo structure (apps/, packages/, services/)
- [x] Tech Stack Decision (ADR-004)
- [x] Competitive Positioning (ADR-005)
- [x] Updated positioning docs (VISION, MANIFESTO, MISSION, PRINCIPLES)
- [x] Full PRD with competitive context
- [x] Detailed PERSONAS with budgets and decision makers
- [x] AI Bible with agent rules and memory architecture
- [x] Database domain model (DATABASE.md)
- [x] docker-compose.yml (Postgres+pgvector, Redis, API, Web)
- [x] GitHub Actions CI (lint + test)
- [x] FastAPI app skeleton (main.py, config.py)
- [x] pyproject.toml with all dependencies
- [x] .env.example documented

## In Progress

- [ ] Company domain: models + migrations (Alembic)
- [ ] Auth middleware (Supabase JWT)
- [ ] `POST /companies` + `GET /companies/:id`
- [ ] First test suite

## Next (Sprint 2)

- Knowledge Ingestion API
- Knowledge Agent (v1) — entity extraction + embeddings
- pgvector index setup
- Basic dashboard skeleton (Next.js)
