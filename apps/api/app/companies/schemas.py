import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class CompanyCreate(BaseModel):
    name: str
    domain: str | None = None
    industry: str | None = None
    description: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    industry: str | None = None
    description: str | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str | None
    industry: str | None
    description: str | None
    created_at: datetime
    updated_at: datetime


class CompanyListResponse(BaseModel):
    items: list[CompanyResponse]
    total: int
