import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.companies.service import CompanyService
from app.database import get_db
from app.knowledge.routes import verify_company_access
from app.signals.schemas import (
    CollectRequest,
    CollectResponse,
    ManualSignalCreate,
    SignalListResponse,
    SignalResponse,
    VisibilityScore,
)
from app.signals.service import SignalService

router = APIRouter(prefix="/companies/{company_id}/signals", tags=["signals"])


def get_signal_service(db: AsyncSession = Depends(get_db)) -> SignalService:
    return SignalService(db)


@router.post(
    "/collect",
    response_model=CollectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger automated signal collection",
)
async def collect_signals(
    company_id: uuid.UUID,
    request: CollectRequest = CollectRequest(),
    company=Depends(verify_company_access),
    signal_service: SignalService = Depends(get_signal_service),
) -> CollectResponse:
    return await signal_service.collect(
        company_id=company_id,
        company_name=company.name,
        domain=company.domain,
        request=request,
    )


@router.post(
    "/ai",
    response_model=SignalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Manually submit an AI visibility observation",
)
async def add_ai_signal(
    company_id: uuid.UUID,
    data: ManualSignalCreate,
    company=Depends(verify_company_access),
    signal_service: SignalService = Depends(get_signal_service),
) -> SignalResponse:
    return await signal_service.add_manual_ai_signal(
        company_id=company_id,
        data=data,
    )


@router.get(
    "/",
    response_model=SignalListResponse,
    summary="List collected signals",
)
async def list_signals(
    company_id: uuid.UUID,
    type: Annotated[str | None, Query(description="Filter by signal type")] = None,
    limit: int = Query(default=50, ge=1, le=200),
    company=Depends(verify_company_access),
    signal_service: SignalService = Depends(get_signal_service),
) -> SignalListResponse:
    signals, total = await signal_service.list_signals(
        company_id=company_id,
        signal_type=type,
        limit=limit,
    )
    return SignalListResponse(
        items=[SignalResponse.model_validate(s) for s in signals],
        total=total,
    )


@router.get(
    "/score",
    response_model=VisibilityScore,
    summary="Get OmniIQ Visibility Score",
)
async def get_visibility_score(
    company_id: uuid.UUID,
    company=Depends(verify_company_access),
    signal_service: SignalService = Depends(get_signal_service),
) -> VisibilityScore:
    return await signal_service.get_visibility_score(company_id=company_id)
