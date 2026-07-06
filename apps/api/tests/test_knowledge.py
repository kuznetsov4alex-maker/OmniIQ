import uuid

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_ingest_content(client: AsyncClient, auth_headers: dict) -> None:
    # Create company first
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "TechCorp", "domain": "techcorp.com"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    # Mock OpenAI calls to avoid real API usage in tests
    mock_entities = [
        {"type": "brand", "name": "TechCorp", "description": "A technology company"},
        {"type": "product", "name": "SuperApp", "description": "Their main product"},
    ]

    with patch(
        "app.knowledge.agent.client.chat.completions.create",
        new_callable=AsyncMock,
    ) as mock_chat, patch(
        "app.knowledge.embedder.client.embeddings.create",
        new_callable=AsyncMock,
    ) as mock_embed:
        # Mock chat completion
        mock_chat.return_value.choices = [
            type("Choice", (), {
                "message": type("Msg", (), {
                    "content": f'{{"entities": {__import__("json").dumps(mock_entities)}}}'
                })()
            })()
        ]
        # Mock embedding
        mock_embed.return_value.data = [
            type("Emb", (), {"embedding": [0.1] * 3072})()
        ]

        response = await client.post(
            f"/api/v1/companies/{company_id}/knowledge/ingest",
            json={
                "content": "TechCorp is a technology company that builds SuperApp, "
                           "a platform for managing digital visibility.",
                "source": "manual",
            },
            headers=auth_headers,
        )

    assert response.status_code == 201
    data = response.json()
    assert data["chunks_created"] >= 1
    assert data["company_id"] == company_id


@pytest.mark.asyncio
async def test_list_entities(client: AsyncClient, auth_headers: dict) -> None:
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "EntityCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    response = await client.get(
        f"/api/v1/companies/{company_id}/knowledge/entities",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_knowledge_search(client: AsyncClient, auth_headers: dict) -> None:
    company_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "SearchCorp"},
        headers=auth_headers,
    )
    company_id = company_resp.json()["id"]

    with patch(
        "app.knowledge.embedder.client.embeddings.create",
        new_callable=AsyncMock,
    ) as mock_embed:
        mock_embed.return_value.data = [
            type("Emb", (), {"embedding": None})()
        ]
        response = await client.post(
            f"/api/v1/companies/{company_id}/knowledge/search",
            json={"query": "technology product"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "results" in data


@pytest.mark.asyncio
async def test_ingest_requires_company_ownership(
    client: AsyncClient, auth_headers: dict
) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        f"/api/v1/companies/{fake_id}/knowledge/ingest",
        json={"content": "Some content about a company."},
        headers=auth_headers,
    )
    assert response.status_code == 404
