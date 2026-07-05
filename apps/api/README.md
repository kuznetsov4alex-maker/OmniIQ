# Atlas API

FastAPI backend — the core of the Atlas platform.

## Stack

- Python 3.12
- FastAPI
- PostgreSQL 16 + pgvector
- Redis + Celery
- Supabase Auth

## Structure

```
api/
├── app/
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Settings (pydantic-settings)
│   ├── database.py       # DB connection (SQLAlchemy async)
│   ├── auth/             # Auth middleware (Supabase JWT)
│   ├── companies/        # Company domain (routes, schemas, models, service)
│   ├── knowledge/        # Knowledge Engine integration
│   ├── signals/          # Signal Engine integration
│   ├── recommendations/  # Decision Engine integration
│   └── actions/          # Execution Engine integration
├── tests/
├── alembic/              # DB migrations
├── Dockerfile
├── pyproject.toml
└── README.md
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```
