from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.companies.routes import router as companies_router
from app.config import settings

app = FastAPI(
    title="Atlas API",
    description="Company Brain for Autonomous Digital Visibility",
    version="0.1.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
app.include_router(companies_router, prefix="/api/v1")


# ── Health ─────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}
