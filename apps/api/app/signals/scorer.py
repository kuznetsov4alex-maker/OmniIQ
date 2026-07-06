"""
Visibility Scorer — computes OmniIQ Visibility Score from raw signals.

Score breakdown (0–100):
  SEO    → 35%  (technical foundation)
  AI     → 35%  (AI-era presence — highest weight, our core differentiator)
  Entity → 20%  (knowledge graph presence)
  Reputation → 10% (reviews, social)

Grade:
  A  ≥ 80  → Strong visibility
  B  ≥ 60  → Good, some gaps
  C  ≥ 40  → Weak, significant gaps
  D  ≥ 20  → Poor
  F  <  20  → Critical issues
"""

from datetime import datetime, timezone

from app.signals.models import Signal
from app.signals.schemas import SignalCategory, VisibilityScore

WEIGHTS: dict[str, float] = {
    "seo": 0.35,
    "ai": 0.35,
    "entity": 0.20,
    "reputation": 0.10,
}


def _grade(score: float) -> str:
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    if score >= 40:
        return "C"
    if score >= 20:
        return "D"
    return "F"


def compute_visibility_score(
    company_id, signals: list[Signal]
) -> VisibilityScore:
    """Compute the OmniIQ Visibility Score from a list of signals."""
    # Group by type
    by_type: dict[str, list[Signal]] = {}
    for signal in signals:
        by_type.setdefault(signal.type, []).append(signal)

    categories: list[SignalCategory] = []
    weighted_total = 0.0
    total_weight_used = 0.0

    for sig_type, weight in WEIGHTS.items():
        type_signals = by_type.get(sig_type, [])
        if not type_signals:
            # No signals collected yet — score this category as 0
            categories.append(SignalCategory(
                type=sig_type,  # type: ignore[arg-type]
                score=0.0,
                signal_count=0,
                weight=weight,
            ))
            continue

        # Average of normalised values → 0-100 scale
        avg = sum(s.value for s in type_signals) / len(type_signals)
        category_score = round(avg * 100, 1)
        categories.append(SignalCategory(
            type=sig_type,  # type: ignore[arg-type]
            score=category_score,
            signal_count=len(type_signals),
            weight=weight,
        ))
        weighted_total += category_score * weight
        total_weight_used += weight

    # If some categories have no data, normalise by weight actually used
    if total_weight_used > 0:
        total_score = round(weighted_total / total_weight_used, 1)
    else:
        total_score = 0.0

    return VisibilityScore(
        company_id=company_id,
        total_score=total_score,
        categories=categories,
        grade=_grade(total_score),
        computed_at=datetime.now(timezone.utc),
        signal_count=len(signals),
    )
