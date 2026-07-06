import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.knowledge.routes import verify_company_access
from app.recommendations.schemas import (
    GenerateRequest,
    GenerateResponse,
    RecommendationListResponse,
    RecommendationResponse,
    RecommendationSummary,
    UpdateStatusRequest,
)
from app.recommendations.service import RecommendationService

router = APIRouter(
    prefix="/companies/{company_id}/recommendations",
    tags=["recommendations"],
)


def get_rec_service(db: AsyncSession = Depends(get_db)) -> RecommendationService:
    return RecommendationService(db)


@router.post(
    "/generate",
    response_model=GenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run Decision Engine — generate prioritised recommendations",
)
async def generate_recommendations(
    company_id: uuid.UUID,
    request: GenerateRequest = GenerateRequest(),
    company=Depends(verify_company_access),
    rec_service: RecommendationService = Depends(get_rec_service),
) -> GenerateResponse:
    return await rec_service.generate(
        company_id=company_id,
        company_name=company.name,
        company_domain=company.domain,
        request=request,
    )


@router.get(
    "/",
    response_model=RecommendationListResponse,
    summary="List recommendations (sorted by priority score)",
)
async def list_recommendations(
    company_id: uuid.UUID,
    status: Annotated[str | None, Query(description="Filter by status")] = None,
    limit: int = Query(default=20, ge=1, le=100),
    company=Depends(verify_company_access),
    rec_service: RecommendationService = Depends(get_rec_service),
) -> RecommendationListResponse:
    recs, total = await rec_service.list_recommendations(
        company_id=company_id,
        status=status,
        limit=limit,
    )
    return RecommendationListResponse(
        items=[RecommendationResponse.model_validate(r) for r in recs],
        total=total,
    )


@router.get(
    "/summary",
    response_model=RecommendationSummary,
    summary="Executive summary — score, grade, top action",
)
async def get_summary(
    company_id: uuid.UUID,
    company=Depends(verify_company_access),
    rec_service: RecommendationService = Depends(get_rec_service),
) -> RecommendationSummary:
    return await rec_service.get_summary(company_id=company_id)


@router.patch(
    "/{recommendation_id}",
    response_model=RecommendationResponse,
    summary="Approve or reject a recommendation",
)
async def update_recommendation_status(
    company_id: uuid.UUID,
    recommendation_id: uuid.UUID,
    request: UpdateStatusRequest,
    company=Depends(verify_company_access),
    rec_service: RecommendationService = Depends(get_rec_service),
) -> RecommendationResponse:
    rec = await rec_service.update_status(
        company_id=company_id,
        recommendation_id=recommendation_id,
        request=request,
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return RecommendationResponse.model_validate(rec)
