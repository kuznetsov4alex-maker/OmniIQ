import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SignalType = Literal["seo", "ai", "entity", "reputation", "social"]


# ── Signal ─────────────────────────────────────────────────────

class SignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    type: SignalType
    channel: str
    metric: str
    value: float
    source: str
    collected_at: datetime


class SignalListResponse(BaseModel):
    items: list[SignalResponse]
    total: int


# ── Collection ─────────────────────────────────────────────────

class CollectRequest(BaseModel):
    types: list[SignalType] = Field(
        default=["seo", "entity", "social"],
        description="Which signal types to collect. AI signals require manual input.",
    )


class CollectResponse(BaseModel):
    company_id: uuid.UUID
    signals_collected: int
    types_run: list[str]
    message: str


# ── Visibility Score ────────────────────────────────────────────

class SignalCategory(BaseModel):
    type: str  # str (not Literal) so scorer handles new types like 'social'
    score: float = Field(..., ge=0, le=100)
    signal_count: int
    weight: float


class VisibilityScore(BaseModel):
    company_id: uuid.UUID
    total_score: float = Field(..., ge=0, le=100)
    categories: list[SignalCategory]
    grade: str  # A / B / C / D / F
    computed_at: datetime
    signal_count: int


# ── Manual AI Signal ───────────────────────────────────────────

class ManualSignalCreate(BaseModel):
    channel: str = Field(..., description="e.g. chatgpt, perplexity, google_ai_overview")
    metric: str = Field(..., description="e.g. mentioned, not_mentioned, accurate")
    value: float = Field(..., ge=0, le=1, description="0.0 = negative, 1.0 = positive")
    note: str | None = None
