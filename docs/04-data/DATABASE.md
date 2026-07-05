# Database

## Domain Models

### Core Entities

```
Company
  id, name, domain, industry, description
  created_at, updated_at

Entity
  id, company_id, type (brand|product|person|location), name
  description, verified, source_urls[]

Signal
  id, company_id, entity_id?, type (seo|ai|entity|reputation)
  channel, value, source, collected_at, raw_data (jsonb)

Recommendation
  id, company_id, title, description
  impact_score, confidence, effort
  status (pending|approved|rejected|executed)
  reasoning, signals_used[]
  created_at

Action
  id, recommendation_id, company_id
  type, payload (jsonb)
  status (pending_approval|approved|executing|done|failed)
  approved_by, executed_at, outcome (jsonb)
```

## Technology Decisions

See ADR-004 for tech stack selection.

## Key Design Decisions

- **Company is the primary aggregate** (ADR-002) — all data is scoped to a company
- **Multi-tenant isolation** — Row Level Security (RLS) on all tables
- **Signal history** — signals are append-only (time series), never updated
- **Action audit trail** — every action is logged with full payload and outcome
