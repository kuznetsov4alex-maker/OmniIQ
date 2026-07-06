import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.recommendations.analyzer import Gap, analyze_gaps
from app.recommendations.generator import RecommendationData, _fallback_recommendations
from app.signals.models import Signal


# ── Unit: Gap Analyzer ─────────────────────────────────────────

def make_signal(sig_type, channel, metric, value):
    s = Signal()
    s.id = uuid.uuid4()
    s.company_id = uuid.uuid4()
    s.type = sig_type
    s.channel = channel
    s.metric = metric
    s.value = value
    s.source = "test"
    s.raw_data = {}
    s.collected_at = datetime.now(timezone.utc)
    return s


def test_gap_analyzer_detects_ssl_missing():
    signals = [make_signal("seo", "google_search", "ssl_present", 0.0)]
    gaps = analyze_gaps(signals)
    assert any(g.metric == "ssl_present" and g.severity == "critical" for g in gaps)


def test_gap_analyzer_detects_sitemap_missing():
    signals = [make_signal("seo", "google_search", "sitemap_xml", 0.0)]
    gaps = analyze_gaps(signals)
    assert any(g.metric == "sitemap_xml" for g in gaps)


def test_gap_analyzer_no_gaps_when_all_good():
    signals = [
        make_signal("seo", "google_search", "ssl_present", 1.0),
        make_signal("seo", "google_search", "domain_reachable", 1.0),
        make_signal("seo", "google_search", "robots_txt", 1.0),
        make_signal("seo", "google_search", "sitemap_xml", 1.0),
        make_signal("entity", "wikidata", "wikidata_entity", 1.0),
        make_signal("entity", "wikipedia", "wikipedia_page", 1.0),
        make_signal("ai", "chatgpt", "mentioned", 1.0),
    ]
    gaps = analyze_gaps(signals)
    assert len(gaps) == 0


def test_gaps_sorted_by_severity():
    signals = [
        make_signal("seo", "google_search", "ssl_present", 0.0),      # critical
        make_signal("seo", "google_search", "sitemap_xml", 0.0),      # high
        make_signal("seo", "google_search", "robots_txt", 0.0),       # medium
    ]
    gaps = analyze_gaps(signals)
    severities = [g.severity for g in gaps]
    assert severities.index("critical") < severities.index("high")


# ── Unit: Fallback Recommendations ────────────────────────────

def test_fallback_recs_for_ssl_gap():
    gaps = [Gap("seo", "ssl_present", "critical", "No SSL", current_value=0.0)]
    recs = _fallback_recommendations(gaps)
    assert len(recs) == 1
    assert recs[0].category == "seo"
    assert recs[0].priority_score > 0


def test_recommendation_priority_score():
    rec = RecommendationData(
        title="Test", description="Test", reasoning="Test",
        action_steps=[], impact_score=8.0, confidence=0.9,
        category="seo", effort="low", signals_used=[],
    )
    assert rec.priority_score == 7.2


# ── Integration: Recommendation API ───────────────────────────

@pytest.mark.asyncio
async def test_generate_no_signals(client: AsyncClient, auth_headers: dict):
    """Generate with no signals → no gaps → 0 generated."""
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "NoSignalCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    response = await client.post(
        f"/api/v1/companies/{company_id}/recommendations/generate",
        json={},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["generated"] == 0


@pytest.mark.asyncio
async def test_generate_with_signals(client: AsyncClient, auth_headers: dict):
    """Generate with AI signal gap → gets fallback recommendations."""
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "GapCorp", "domain": "gapcorp.com"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    # Add an AI signal with low visibility
    await client.post(
        f"/api/v1/companies/{company_id}/signals/ai",
        json={"channel": "chatgpt", "metric": "mentioned", "value": 0.0},
        headers=auth_headers,
    )

    response = await client.post(
        f"/api/v1/companies/{company_id}/recommendations/generate",
        json={"force_regenerate": True},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["generated"] >= 1


@pytest.mark.asyncio
async def test_approve_recommendation(client: AsyncClient, auth_headers: dict):
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "ApproveCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    # Add gap signal and generate
    await client.post(
        f"/api/v1/companies/{company_id}/signals/ai",
        json={"channel": "perplexity", "metric": "mentioned", "value": 0.0},
        headers=auth_headers,
    )
    await client.post(
        f"/api/v1/companies/{company_id}/recommendations/generate",
        json={"force_regenerate": True},
        headers=auth_headers,
    )

    # List and approve first
    list_resp = await client.get(
        f"/api/v1/companies/{company_id}/recommendations/",
        headers=auth_headers,
    )
    items = list_resp.json()["items"]
    if not items:
        return  # no recs generated, skip

    rec_id = items[0]["id"]
    patch_resp = await client.patch(
        f"/api/v1/companies/{company_id}/recommendations/{rec_id}",
        json={"status": "approved"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_get_summary(client: AsyncClient, auth_headers: dict):
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "SummaryCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    response = await client.get(
        f"/api/v1/companies/{company_id}/recommendations/summary",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "visibility_score" in data
    assert "grade" in data
    assert "biggest_gap" in data
    assert "estimated_score_gain" in data
