import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Signal classification
    type: Mapped[str] = mapped_column(
        String(50), nullable=False  # seo | ai | entity | reputation
    )
    channel: Mapped[str] = mapped_column(
        String(100), nullable=False  # google_search | chatgpt | wikidata | google_maps
    )
    metric: Mapped[str] = mapped_column(
        String(100), nullable=False  # e.g. "ssl_present", "robots_txt", "wikidata_entity"
    )
    # Value: normalised 0.0–1.0 where applicable, raw otherwise
    value: Mapped[float] = mapped_column(Float, nullable=False)
    raw_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_signals_company_type", "company_id", "type"),
        Index("ix_signals_collected_at", "collected_at"),
    )

    def __repr__(self) -> str:
        return f"<Signal {self.type}/{self.channel}/{self.metric}={self.value}>"
