import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class KeywordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    query: str
    cluster: Optional[str]
    intent: Optional[str]
    difficulty: Optional[str]
    yandex_position: Optional[int]
    ai_mentioned: Optional[bool]
    article_generated: bool
    article_title: Optional[str]
    article_meta: Optional[str]
    created_at: datetime


class KeywordListResponse(BaseModel):
    items: list[KeywordResponse]
    total: int
    clusters: dict[str, int]


class GenerateKeywordsRequest(BaseModel):
    max_keywords: int = Field(default=50, ge=10, le=100)
    force_regenerate: bool = False


class ArticleResponse(BaseModel):
    keyword_id: uuid.UUID
    query: str
    title: str
    content: str
    meta_description: str
    word_count: int
