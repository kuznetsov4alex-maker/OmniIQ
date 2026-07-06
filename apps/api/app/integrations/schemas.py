import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


# ── Type literals ──────────────────────────────────────────────
IntegrationType = Literal["ftp", "yandex_oauth", "wordpress", "vk"]
IntegrationStatus = Literal["connected", "disconnected", "error"]


# ── Credential shapes (for documentation / validation) ─────────
class FTPCredentials(BaseModel):
    host: str
    port: int = 21
    username: str
    password: str
    root_path: str = "/"


class WordPressCredentials(BaseModel):
    site_url: str
    username: str
    app_password: str


class VKCredentials(BaseModel):
    access_token: str
    group_id: str


# ── Request schemas ────────────────────────────────────────────
class IntegrationCreate(BaseModel):
    type: IntegrationType
    label: str | None = None
    credentials: dict | None = None


class IntegrationUpdate(BaseModel):
    status: IntegrationStatus | None = None
    credentials: dict | None = None
    label: str | None = None


# ── Response schemas ───────────────────────────────────────────
class IntegrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    type: str
    status: str
    label: str | None
    unlocked_tasks: list
    connected_at: datetime | None
    created_at: datetime
    # credentials intentionally excluded — never expose secrets


class IntegrationListResponse(BaseModel):
    items: list[IntegrationResponse]
    total: int
