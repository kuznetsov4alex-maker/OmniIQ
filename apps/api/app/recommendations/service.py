import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.recommendations.analyzer import analyze_gaps
from app.recommendations.generator import generate_recommendations
from app.recommendations.models import Recommendation
from app.recommendations.schemas import (
    GenerateRequest,
    GenerateResponse,
    RecommendationListResponse,
    RecommendationResponse,
    RecommendationSummary,
    UpdateStatusRequest,
)
from app.signals.models import Signal
from app.signals.scorer import compute_visibility_score


class RecommendationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def generate(
        self,
        company_id: uuid.UUID,
        company_name: str,
        company_domain: str | None,
        request: GenerateRequest,
    ) -> GenerateResponse:
        # Check for recent recommendations (avoid re-generating every request)
        if not request.force_regenerate:
            since = datetime.now(timezone.utc) - timedelta(hours=24)
            recent = await self.db.execute(
                select(func.count()).where(
                    Recommendation.company_id == company_id,
                    Recommendation.created_at >= since,
                    Recommendation.status == "pending",
                )
            )
            if recent.scalar_one() >= request.max_recommendations:
                return GenerateResponse(
                    company_id=company_id,
                    generated=0,
                    message="Recent recommendations already exist. Use force_regenerate=true to override.",
                )

        # Get signals for context
        result = await self.db.execute(
            select(Signal)
            .where(Signal.company_id == company_id)
            .where(Signal.collected_at >= datetime.now(timezone.utc) - timedelta(days=30))
        )
        signals = list(result.scalars().all())

        # Compute visibility score
        vis_score = compute_visibility_score(company_id, signals)

        # Analyze gaps
        gaps = analyze_gaps(signals)

        if not gaps:
            return GenerateResponse(
                company_id=company_id,
                generated=0,
                message="No gaps found — collect signals first with POST /signals/collect",
            )

        # Generate recommendations
        rec_data_list = await generate_recommendations(
            company_name=company_name,
            company_domain=company_domain,
            gaps=gaps,
            visibility_score=vis_score.total_score,
            max_recs=request.max_recommendations,
        )

        # Store in DB
        for rd in rec_data_list:
            rec = Recommendation(
                company_id=company_id,
                title=rd.title,
                description=rd.description,
                reasoning=rd.reasoning,
                action_steps=rd.action_steps,
                impact_score=rd.impact_score,
                confidence=rd.confidence,
                priority_score=rd.priority_score,
                category=rd.category,
                effort=rd.effort,
                status="pending",
                signals_used=rd.signals_used,
            )
            self.db.add(rec)

        await self.db.flush()

        return GenerateResponse(
            company_id=company_id,
            generated=len(rec_data_list),
            message=f"Generated {len(rec_data_list)} recommendations. Review and approve to begin execution.",
        )

    async def list_recommendations(
        self,
        company_id: uuid.UUID,
        status: str | None = None,
        limit: int = 20,
    ) -> tuple[list[Recommendation], int]:
        query = (
            select(Recommendation)
            .where(Recommendation.company_id == company_id)
            .order_by(Recommendation.priority_score.desc())
        )
        count_q = select(func.count()).where(Recommendation.company_id == company_id)

        if status:
            query = query.where(Recommendation.status == status)
            count_q = count_q.where(Recommendation.status == status)

        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(query.limit(limit))
        return list(result.scalars().all()), total

    async def update_status(
        self,
        company_id: uuid.UUID,
        recommendation_id: uuid.UUID,
        request: UpdateStatusRequest,
    ) -> Recommendation | None:
        result = await self.db.execute(
            select(Recommendation).where(
                Recommendation.id == recommendation_id,
                Recommendation.company_id == company_id,
            )
        )
        rec = result.scalar_one_or_none()
        if not rec:
            return None
        rec.status = request.status
        await self.db.flush()
        await self.db.refresh(rec)
        return rec

    async def get_summary(
        self, company_id: uuid.UUID
    ) -> RecommendationSummary:
        # Get signals for score
        signals_result = await self.db.execute(
            select(Signal)
            .where(Signal.company_id == company_id)
            .where(Signal.collected_at >= datetime.now(timezone.utc) - timedelta(days=30))
        )
        signals = list(signals_result.scalars().all())
        vis = compute_visibility_score(company_id, signals)

        # Get recommendations
        recs, total = await self.list_recommendations(company_id, limit=100)
        pending = [r for r in recs if r.status == "pending"]
        top = recs[0] if recs else None

        # Biggest gap (lowest category score)
        if vis.categories:
            weakest = min(vis.categories, key=lambda c: c.score)
            biggest_gap = f"{weakest.type.upper()} (score: {weakest.score:.0f}/100)"
        else:
            biggest_gap = "No signals collected yet"

        # Estimated score gain if top-3 recs are implemented
        top3 = sorted(recs, key=lambda r: r.priority_score, reverse=True)[:3]
        estimated_gain = min(
            sum(r.impact_score * r.confidence for r in top3) * 2,
            100 - vis.total_score,
        )

        return RecommendationSummary(
            company_id=company_id,
            visibility_score=vis.total_score,
            grade=vis.grade,
            total_recommendations=total,
            pending_count=len(pending),
            top_recommendation=RecommendationResponse.model_validate(top) if top else None,
            biggest_gap=biggest_gap,
            estimated_score_gain=round(estimated_gain, 1),
        )
