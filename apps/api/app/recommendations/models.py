import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    action_steps: Mapped[list] = mapped_column(ARRAY(Text), default=list, nullable=False)

    # Scoring
    impact_score: Mapped[float] = mapped_column(Float, nullable=False)   # 1-10
    confidence: Mapped[float] = mapped_column(Float, nullable=False)     # 0-1
    priority_score: Mapped[float] = mapped_column(Float, nullable=False) # impact * confidence

    # Classification
    category: Mapped[str] = mapped_column(
        String(50), nullable=False  # seo | ai | entity | reputation
    )
    effort: Mapped[str] = mapped_column(
        String(20), nullable=False  # low | medium | high
    )

    # Workflow
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending"
        # pending | approved | rejected | executing | done | failed
    )
    signals_used: Mapped[list] = mapped_column(ARRAY(Text), default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Recommendation [{self.category}] {self.title[:40]!r} score={self.priority_score:.1f}>"
