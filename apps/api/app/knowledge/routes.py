import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.companies.service import CompanyService
from app.database import get_db
from app.knowledge.schemas import (
    EntityListResponse,
    EntityResponse,
    IngestRequest,
    IngestResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
)
from app.knowledge.service import KnowledgeService

router = APIRouter(prefix="/companies/{company_id}/knowledge", tags=["knowledge"])


def get_knowledge_service(db: AsyncSession = Depends(get_db)) -> KnowledgeService:
    return KnowledgeService(db)


def get_company_service(db: AsyncSession = Depends(get_db)) -> CompanyService:
    return CompanyService(db)


async def verify_company_access(
    company_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    company_service: CompanyService = Depends(get_company_service),
):
    """Verify the user owns this company — used as dependency."""
    company = await company_service.get_by_id(user_id=user_id, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest content into Company Brain",
)
async def ingest(
    company_id: uuid.UUID,
    data: IngestRequest,
    company=Depends(verify_company_access),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> IngestResponse:
    return await knowledge_service.ingest(
        company_id=company_id,
        company_name=company.name,
        data=data,
    )


@router.get(
    "/entities",
    response_model=EntityListResponse,
    summary="List extracted entities for a company",
)
async def list_entities(
    company_id: uuid.UUID,
    company=Depends(verify_company_access),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> EntityListResponse:
    entities, total = await knowledge_service.list_entities(company_id=company_id)
    return EntityListResponse(
        items=[EntityResponse.model_validate(e) for e in entities],
        total=total,
    )


@router.post(
    "/search",
    response_model=KnowledgeSearchResponse,
    summary="Semantic search over company knowledge",
)
async def search_knowledge(
    company_id: uuid.UUID,
    request: KnowledgeSearchRequest,
    company=Depends(verify_company_access),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> KnowledgeSearchResponse:
    return await knowledge_service.search(
        company_id=company_id,
        request=request,
    )
