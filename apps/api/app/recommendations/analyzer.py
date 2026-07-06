"""
Gap Analyzer — rule-based detection of visibility gaps from signals.

Fast, deterministic, explainable. Runs before LLM generation to give
the Decision Engine concrete facts to work with.

Each Gap has:
  - category: which signal type
  - metric: what specific thing is missing/broken
  - severity: critical | high | medium | low
  - detail: human-readable description
  - signal_refs: which signals evidence this gap
"""

from dataclasses import dataclass, field


@dataclass
class Gap:
    category: str
    metric: str
    severity: str  # critical | high | medium | low
    detail: str
    signal_refs: list[str] = field(default_factory=list)
    current_value: float = 0.0
    target_value: float = 1.0


def analyze_gaps(signals: list) -> list[Gap]:
    """
    Detect gaps from signal list.
    Returns gaps sorted by severity (critical first).
    """
    gaps: list[Gap] = []

    # Build lookup: {type/channel/metric: value}
    signal_map: dict[str, float] = {}
    for s in signals:
        key = f"{s.type}/{s.channel}/{s.metric}"
        signal_map[key] = s.value

    # ── SEO Gaps ──────────────────────────────────────────────
    if "seo/google_search/ssl_present" in signal_map:
        if signal_map["seo/google_search/ssl_present"] < 1.0:
            gaps.append(Gap(
                category="seo", metric="ssl_present", severity="critical",
                detail="Website does not use HTTPS. Search engines penalise non-SSL sites.",
                signal_refs=["seo/google_search/ssl_present"],
                current_value=signal_map["seo/google_search/ssl_present"],
            ))

    if "seo/google_search/domain_reachable" in signal_map:
        if signal_map["seo/google_search/domain_reachable"] < 1.0:
            gaps.append(Gap(
                category="seo", metric="domain_reachable", severity="critical",
                detail="Website is not reachable. Cannot be indexed by search engines.",
                signal_refs=["seo/google_search/domain_reachable"],
                current_value=signal_map["seo/google_search/domain_reachable"],
            ))

    if "seo/google_search/robots_txt" in signal_map:
        if signal_map["seo/google_search/robots_txt"] < 1.0:
            gaps.append(Gap(
                category="seo", metric="robots_txt", severity="medium",
                detail="No robots.txt found. Search engine crawlers have no guidance.",
                signal_refs=["seo/google_search/robots_txt"],
                current_value=signal_map["seo/google_search/robots_txt"],
            ))

    if "seo/google_search/sitemap_xml" in signal_map:
        if signal_map["seo/google_search/sitemap_xml"] < 1.0:
            gaps.append(Gap(
                category="seo", metric="sitemap_xml", severity="high",
                detail="No sitemap.xml found. Search engines may miss important pages.",
                signal_refs=["seo/google_search/sitemap_xml"],
                current_value=signal_map["seo/google_search/sitemap_xml"],
            ))

    if "seo/google_search/response_time" in signal_map:
        rt = signal_map["seo/google_search/response_time"]
        if rt < 0.5:
            gaps.append(Gap(
                category="seo", metric="response_time", severity="high",
                detail=f"Website responds slowly (score {rt:.2f}/1.0). Page speed is a ranking factor.",
                signal_refs=["seo/google_search/response_time"],
                current_value=rt,
            ))

    # ── Entity Gaps ───────────────────────────────────────────
    if "entity/wikidata/wikidata_entity" in signal_map:
        if signal_map["entity/wikidata/wikidata_entity"] < 1.0:
            gaps.append(Gap(
                category="entity", metric="wikidata_entity", severity="high",
                detail="Company not found in Wikidata. AI systems use Wikidata as a primary fact source.",
                signal_refs=["entity/wikidata/wikidata_entity"],
                current_value=0.0,
            ))

    if "entity/wikipedia/wikipedia_page" in signal_map:
        if signal_map["entity/wikipedia/wikipedia_page"] < 1.0:
            gaps.append(Gap(
                category="entity", metric="wikipedia_page", severity="medium",
                detail="No Wikipedia page found. Wikipedia is a top training source for LLMs.",
                signal_refs=["entity/wikipedia/wikipedia_page"],
                current_value=0.0,
            ))

    # ── AI Visibility Gaps ────────────────────────────────────
    ai_signals = [s for s in signals if s.type == "ai"]
    if not ai_signals:
        gaps.append(Gap(
            category="ai", metric="ai_visibility_unknown", severity="high",
            detail="No AI visibility signals collected yet. Unknown if AI mentions your company.",
            signal_refs=[],
            current_value=0.0,
        ))
    else:
        avg_ai = sum(s.value for s in ai_signals) / len(ai_signals)
        if avg_ai < 0.5:
            gaps.append(Gap(
                category="ai", metric="ai_low_visibility", severity="critical",
                detail=f"Low AI visibility score ({avg_ai:.0%}). Company is rarely or inaccurately mentioned by AI.",
                signal_refs=[f"ai/{s.channel}/{s.metric}" for s in ai_signals],
                current_value=avg_ai,
            ))

    # Sort: critical first, then high, medium, low
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    gaps.sort(key=lambda g: severity_order.get(g.severity, 99))

    return gaps
