import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.signals.collectors.ai import AICollector
from app.signals.collectors.entity import EntityCollector
from app.signals.collectors.seo import SEOCollector
from app.signals.collectors.social import SocialCollector
from app.signals.models import Signal
from app.signals.schemas import (
    CollectRequest,
    CollectResponse,
    ManualSignalCreate,
    SignalResponse,
    VisibilityScore,
)
from app.signals.scorer import compute_visibility_score

COLLECTORS = {
    "seo": SEOCollector(),
    "entity": EntityCollector(),
    "ai": AICollector(),
    "social": SocialCollector(),
}


class SignalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def collect(
        self,
        company_id: uuid.UUID,
        company_name: str,
        domain: str | None,
        request: CollectRequest,
    ) -> CollectResponse:
        total_collected = 0
        types_run: list[str] = []

        for sig_type in request.types:
            collector = COLLECTORS.get(sig_type)
            if not collector:
                continue

            signal_data_list = await collector.collect(
                company_id=company_id,
                domain=domain,
                company_name=company_name,
            )

            for sd in signal_data_list:
                signal = Signal(
                    company_id=company_id,
                    type=sd.type,
                    channel=sd.channel,
                    metric=sd.metric,
                    value=sd.value,
                    source=sd.source,
                    raw_data=sd.raw_data,
                )
                self.db.add(signal)
                total_collected += 1

            types_run.append(sig_type)

        await self.db.flush()
        return CollectResponse(
            company_id=company_id,
            signals_collected=total_collected,
            types_run=types_run,
            message=f"Collected {total_collected} signals across {len(types_run)} categories.",
        )

    async def add_manual_ai_signal(
        self,
        company_id: uuid.UUID,
        data: ManualSignalCreate,
    ) -> SignalResponse:
        signal = Signal(
            company_id=company_id,
            type="ai",
            channel=data.channel,
            metric=data.metric,
            value=data.value,
            source="manual",
            raw_data={"note": data.note} if data.note else {},
        )
        self.db.add(signal)
        await self.db.flush()
        await self.db.refresh(signal)
        return SignalResponse.model_validate(signal)

    async def list_signals(
        self,
        company_id: uuid.UUID,
        signal_type: str | None = None,
        limit: int = 50,
    ) -> tuple[list[Signal], int]:
        query = select(Signal).where(Signal.company_id == company_id)
        if signal_type:
            query = query.where(Signal.type == signal_type)

        count_q = select(func.count()).where(Signal.company_id == company_id)
        if signal_type:
            count_q = count_q.where(Signal.type == signal_type)

        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            query.order_by(Signal.collected_at.desc()).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_visibility_score(
        self, company_id: uuid.UUID
    ) -> VisibilityScore:
        # Use signals from last 30 days for scoring
        since = datetime.now(timezone.utc) - timedelta(days=30)
        result = await self.db.execute(
            select(Signal)
            .where(Signal.company_id == company_id)
            .where(Signal.collected_at >= since)
        )
        signals = list(result.scalars().all())
        return compute_visibility_score(company_id, signals)
