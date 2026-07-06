import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RecommendationStatus = Literal["pending", "approved", "rejected", "executing", "done", "failed"]
RecommendationCategory = Literal["seo", "ai", "entity", "reputation"]
EffortLevel = Literal["low", "medium", "high"]


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    description: str
    reasoning: str
    action_steps: list[str]
    impact_score: float
    confidence: float
    priority_score: float
    category: RecommendationCategory
    effort: EffortLevel
    status: RecommendationStatus
    signals_used: list[str]
    created_at: datetime
    updated_at: datetime


class RecommendationListResponse(BaseModel):
    items: list[RecommendationResponse]
    total: int


class UpdateStatusRequest(BaseModel):
    status: RecommendationStatus
    note: str | None = None


class GenerateRequest(BaseModel):
    max_recommendations: int = Field(
        default=5, ge=1, le=10,
        description="Maximum number of recommendations to generate",
    )
    force_regenerate: bool = Field(
        default=False,
        description="Regenerate even if recent recommendations exist",
    )


class GenerateResponse(BaseModel):
    company_id: uuid.UUID
    generated: int
    message: str


class RecommendationSummary(BaseModel):
    company_id: uuid.UUID
    visibility_score: float
    grade: str
    total_recommendations: int
    pending_count: int
    top_recommendation: RecommendationResponse | None
    biggest_gap: str
    estimated_score_gain: float
