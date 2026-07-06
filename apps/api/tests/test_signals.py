import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.signals.scorer import compute_visibility_score
from app.signals.models import Signal
import uuid
from datetime import datetime, timezone


# ── Unit: Visibility Scorer ────────────────────────────────────

def make_signal(sig_type: str, value: float) -> Signal:
    s = Signal()
    s.id = uuid.uuid4()
    s.company_id = uuid.uuid4()
    s.type = sig_type
    s.channel = "test"
    s.metric = "test_metric"
    s.value = value
    s.source = "test"
    s.raw_data = {}
    s.collected_at = datetime.now(timezone.utc)
    return s


def test_visibility_score_perfect():
    company_id = uuid.uuid4()
    signals = [
        make_signal("seo", 1.0),
        make_signal("seo", 1.0),
        make_signal("ai", 1.0),
        make_signal("entity", 1.0),
        make_signal("reputation", 1.0),
    ]
    score = compute_visibility_score(company_id, signals)
    assert score.total_score == 100.0
    assert score.grade == "A"


def test_visibility_score_empty():
    company_id = uuid.uuid4()
    score = compute_visibility_score(company_id, [])
    assert score.total_score == 0.0
    assert score.grade == "F"
    assert score.signal_count == 0


def test_visibility_score_partial():
    company_id = uuid.uuid4()
    signals = [
        make_signal("seo", 0.6),
        make_signal("seo", 0.8),
    ]
    score = compute_visibility_score(company_id, signals)
    # SEO average = 0.7 → 70 * 1.0 (only SEO weight used) = 70
    assert 60 < score.total_score <= 75
    assert score.grade in ("B", "C")


def test_grade_boundaries():
    company_id = uuid.uuid4()
    for value, expected_grade in [(0.9, "A"), (0.7, "B"), (0.5, "C"), (0.3, "D"), (0.1, "F")]:
        signals = [make_signal("seo", value)]
        score = compute_visibility_score(company_id, signals)
        assert score.grade == expected_grade, f"Expected {expected_grade} for value {value}, got {score.grade}"


# ── Integration: Signal API ────────────────────────────────────

@pytest.mark.asyncio
async def test_get_visibility_score_empty(client: AsyncClient, auth_headers: dict):
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "ScoreCorp", "domain": "scorecorp.com"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    response = await client.get(
        f"/api/v1/companies/{company_id}/signals/score",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] == 0.0
    assert data["grade"] == "F"
    assert data["signal_count"] == 0


@pytest.mark.asyncio
async def test_add_manual_ai_signal(client: AsyncClient, auth_headers: dict):
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "AICorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    response = await client.post(
        f"/api/v1/companies/{company_id}/signals/ai",
        json={
            "channel": "chatgpt",
            "metric": "mentioned",
            "value": 1.0,
            "note": "AICorp appeared in response about AI tools",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "ai"
    assert data["channel"] == "chatgpt"
    assert data["value"] == 1.0


@pytest.mark.asyncio
async def test_collect_signals_no_domain(client: AsyncClient, auth_headers: dict):
    """Company without domain — SEO collector returns 0 signals gracefully."""
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "NoDomainCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    with patch(
        "app.signals.collectors.entity.EntityCollector.collect",
        new_callable=AsyncMock,
        return_value=[],
    ):
        response = await client.post(
            f"/api/v1/companies/{company_id}/signals/collect",
            json={"types": ["seo", "entity"]},
            headers=auth_headers,
        )

    assert response.status_code == 201
    data = response.json()
    assert data["signals_collected"] == 0  # no domain, no entity found


@pytest.mark.asyncio
async def test_list_signals(client: AsyncClient, auth_headers: dict):
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "ListCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    # Add a signal manually
    await client.post(
        f"/api/v1/companies/{company_id}/signals/ai",
        json={"channel": "perplexity", "metric": "mentioned", "value": 0.8},
        headers=auth_headers,
    )

    response = await client.get(
        f"/api/v1/companies/{company_id}/signals/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
