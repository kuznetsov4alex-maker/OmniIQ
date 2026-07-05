import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_company(client: AsyncClient, auth_headers: dict) -> None:
    payload = {
        "name": "Acme Corp",
        "domain": "acme.com",
        "industry": "Technology",
        "description": "Test company",
    }
    response = await client.post("/api/v1/companies/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert data["domain"] == "acme.com"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_company(client: AsyncClient, auth_headers: dict) -> None:
    # create first
    create_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "Beta Inc"},
        headers=auth_headers,
    )
    company_id = create_resp.json()["id"]

    # get by id
    response = await client.get(f"/api/v1/companies/{company_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == company_id


@pytest.mark.asyncio
async def test_get_company_not_found(client: AsyncClient, auth_headers: dict) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/companies/{fake_id}", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_companies(client: AsyncClient, auth_headers: dict) -> None:
    # create two companies
    for name in ["Company A", "Company B"]:
        await client.post("/api/v1/companies/", json={"name": name}, headers=auth_headers)

    response = await client.get("/api/v1/companies/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_update_company(client: AsyncClient, auth_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "Old Name"},
        headers=auth_headers,
    )
    company_id = create_resp.json()["id"]

    response = await client.patch(
        f"/api/v1/companies/{company_id}",
        json={"name": "New Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_company(client: AsyncClient, auth_headers: dict) -> None:
    create_resp = await client.post(
        "/api/v1/companies/",
        json={"name": "To Delete"},
        headers=auth_headers,
    )
    company_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/companies/{company_id}", headers=auth_headers
    )
    assert response.status_code == 204

    # verify it's gone
    get_resp = await client.get(
        f"/api/v1/companies/{company_id}", headers=auth_headers
    )
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/companies/")
    assert response.status_code == 403
