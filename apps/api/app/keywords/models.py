import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    cluster: Mapped[str | None] = mapped_column(String(100), nullable=True)
    intent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)
    yandex_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_mentioned: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    article_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    article_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    article_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    article_meta: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Keyword id={self.id} query={self.query!r}>"
