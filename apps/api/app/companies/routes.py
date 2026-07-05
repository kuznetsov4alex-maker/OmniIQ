import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.companies.schemas import (
    CompanyCreate,
    CompanyListResponse,
    CompanyResponse,
    CompanyUpdate,
)
from app.companies.service import CompanyService
from app.database import get_db

router = APIRouter(prefix="/companies", tags=["companies"])


def get_service(db: AsyncSession = Depends(get_db)) -> CompanyService:
    return CompanyService(db)


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    user_id: str = Depends(get_current_user),
    service: CompanyService = Depends(get_service),
) -> CompanyResponse:
    company = await service.create(user_id=user_id, data=data)
    return CompanyResponse.model_validate(company)


@router.get("/", response_model=CompanyListResponse)
async def list_companies(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(get_current_user),
    service: CompanyService = Depends(get_service),
) -> CompanyListResponse:
    companies, total = await service.list_by_user(
        user_id=user_id, limit=limit, offset=offset
    )
    return CompanyListResponse(
        items=[CompanyResponse.model_validate(c) for c in companies],
        total=total,
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: CompanyService = Depends(get_service),
) -> CompanyResponse:
    company = await service.get_by_id(user_id=user_id, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: uuid.UUID,
    data: CompanyUpdate,
    user_id: str = Depends(get_current_user),
    service: CompanyService = Depends(get_service),
) -> CompanyResponse:
    company = await service.update(user_id=user_id, company_id=company_id, data=data)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: CompanyService = Depends(get_service),
) -> None:
    deleted = await service.delete(user_id=user_id, company_id=company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")
