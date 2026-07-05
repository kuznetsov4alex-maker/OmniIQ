import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.companies.models import Company
from app.companies.schemas import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: str, data: CompanyCreate) -> Company:
        company = Company(user_id=user_id, **data.model_dump(exclude_none=True))
        self.db.add(company)
        await self.db.flush()
        await self.db.refresh(company)
        return company

    async def get_by_id(self, user_id: str, company_id: uuid.UUID) -> Company | None:
        result = await self.db.execute(
            select(Company).where(
                Company.id == company_id,
                Company.user_id == user_id,  # tenant isolation
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[Company], int]:
        # total count
        count_result = await self.db.execute(
            select(func.count()).where(Company.user_id == user_id)
        )
        total = count_result.scalar_one()

        # paginated items
        result = await self.db.execute(
            select(Company)
            .where(Company.user_id == user_id)
            .order_by(Company.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def update(
        self, user_id: str, company_id: uuid.UUID, data: CompanyUpdate
    ) -> Company | None:
        company = await self.get_by_id(user_id, company_id)
        if not company:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(company, field, value)
        await self.db.flush()
        await self.db.refresh(company)
        return company

    async def delete(self, user_id: str, company_id: uuid.UUID) -> bool:
        company = await self.get_by_id(user_id, company_id)
        if not company:
            return False
        await self.db.delete(company)
        return True
