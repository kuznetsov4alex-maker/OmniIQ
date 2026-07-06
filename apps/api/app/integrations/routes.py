import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.companies.models import Company
from app.database import get_db
from app.integrations.models import CompanyIntegration
from app.integrations.schemas import (
    IntegrationCreate,
    IntegrationListResponse,
    IntegrationResponse,
    IntegrationUpdate,
)

router = APIRouter(
    prefix="/companies/{company_id}/integrations",
    tags=["integrations"],
)

# ── Task keys unlocked per integration type ────────────────────
UNLOCKED_TASKS: dict[str, list[str]] = {
    "ftp": [
        "deploy_robots_txt",
        "deploy_sitemap",
        "deploy_schema_org",
        "deploy_meta_tags",
        "yandex_webmaster_verify",
        "https_redirect",
    ],
    "yandex_oauth": [
        "yandex_position_tracking",
        "yandex_sitemap_submit",
        "indexnow_ping",
    ],
    "wordpress": [
        "publish_articles",
        "update_meta_tags",
        "create_faq_pages",
    ],
    "vk": [
        "update_vk_profile",
        "publish_vk_posts",
    ],
}


# ── Helpers ────────────────────────────────────────────────────
async def _get_company_or_404(
    company_id: uuid.UUID,
    db: AsyncSession,
) -> Company:
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


async def _get_integration_or_404(
    integration_id: uuid.UUID,
    company_id: uuid.UUID,
    db: AsyncSession,
) -> CompanyIntegration:
    result = await db.execute(
        select(CompanyIntegration).where(
            CompanyIntegration.id == integration_id,
            CompanyIntegration.company_id == company_id,
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


# ── Routes ─────────────────────────────────────────────────────
@router.get("/status")
async def get_integrations_status(
    company_id: uuid.UUID,
    _user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await _get_company_or_404(company_id, db)

    result = await db.execute(
        select(CompanyIntegration).where(
            CompanyIntegration.company_id == company_id
        )
    )
    integrations = list(result.scalars().all())

    connected = [i for i in integrations if i.status == "connected"]
    integration_types = {t: False for t in UNLOCKED_TASKS}
    for i in connected:
        if i.type in integration_types:
            integration_types[i.type] = True

    return {
        "total": len(integrations),
        "connected": len(connected),
        "integration_types": integration_types,
    }


@router.get("/", response_model=IntegrationListResponse)
async def list_integrations(
    company_id: uuid.UUID,
    _user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IntegrationListResponse:
    await _get_company_or_404(company_id, db)

    count_result = await db.execute(
        select(func.count()).select_from(CompanyIntegration).where(
            CompanyIntegration.company_id == company_id
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(CompanyIntegration)
        .where(CompanyIntegration.company_id == company_id)
        .order_by(CompanyIntegration.created_at.desc())
    )
    items = list(result.scalars().all())

    return IntegrationListResponse(
        items=[IntegrationResponse.model_validate(i) for i in items],
        total=total,
    )


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    company_id: uuid.UUID,
    data: IntegrationCreate,
    _user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IntegrationResponse:
    await _get_company_or_404(company_id, db)

    now = datetime.now(tz=timezone.utc)
    has_credentials = data.credentials is not None

    integration = CompanyIntegration(
        company_id=company_id,
        type=data.type,
        label=data.label,
        credentials=data.credentials,
        unlocked_tasks=UNLOCKED_TASKS.get(data.type, []),
        status="connected" if has_credentials else "disconnected",
        connected_at=now if has_credentials else None,
    )

    db.add(integration)
    await db.flush()
    await db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    company_id: uuid.UUID,
    integration_id: uuid.UUID,
    data: IntegrationUpdate,
    _user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IntegrationResponse:
    await _get_company_or_404(company_id, db)
    integration = await _get_integration_or_404(integration_id, company_id, db)

    if data.status is not None:
        integration.status = data.status
    if data.credentials is not None:
        integration.credentials = data.credentials
        integration.status = "connected"
        integration.connected_at = datetime.now(tz=timezone.utc)
    if data.label is not None:
        integration.label = data.label

    await db.flush()
    await db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_integration(
    company_id: uuid.UUID,
    integration_id: uuid.UUID,
    _user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_company_or_404(company_id, db)
    integration = await _get_integration_or_404(integration_id, company_id, db)

    # Soft-disconnect: keep the row, clear secrets
    integration.status = "disconnected"
    integration.credentials = None
    integration.connected_at = None

    await db.flush()
