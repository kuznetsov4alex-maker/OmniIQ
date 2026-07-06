"""
Vault API schemas (Pydantic v2).
IMPORTANT: DecryptedCredential is used only in-process — never serialized to JSON responses.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.vault.models import AuditAction, CredentialType


# ── Input: creating a credential (client submits plain text — TLS only) ───

class CredentialCreate(BaseModel):
    credential_type: CredentialType
    label: str = Field(..., min_length=1, max_length=120)
    host: Optional[str] = None
    username: Optional[str] = None
    scope: Optional[str] = None

    # Plain-text sensitive fields — encrypted before DB insert
    password: Optional[str] = Field(None, min_length=1, max_length=1024)
    access_token: Optional[str] = Field(None, min_length=1, max_length=4096)
    refresh_token: Optional[str] = Field(None, min_length=1, max_length=4096)
    api_key: Optional[str] = Field(None, min_length=1, max_length=4096)

    # Client must explicitly consent
    consent_given: bool = Field(..., description="Client must explicitly check this")
    consent_text: str = Field(..., min_length=10,
                               description="Snapshot of consent text the client saw")

    @field_validator("consent_given")
    @classmethod
    def must_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Consent is required to store credentials")
        return v


# ── Output: safe credential info (no secrets, ever) ───────────────────────

class CredentialOut(BaseModel):
    id: UUID
    company_id: UUID
    credential_type: CredentialType
    label: str
    host: Optional[str]
    username: Optional[str]
    scope: Optional[str]
    is_active: bool
    consent_given: bool
    consent_given_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Flags — tells frontend what fields are populated (never the values)
    has_password: bool
    has_access_token: bool
    has_refresh_token: bool
    has_api_key: bool

    model_config = {"from_attributes": True}


# ── Audit log output ───────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: UUID
    credential_id: Optional[UUID]
    action: AuditAction
    actor: Optional[str]
    details: Optional[str]
    performed_at: datetime

    model_config = {"from_attributes": True}


# ── Internal: decrypted credential (NEVER serialized to JSON) ────────────

class DecryptedCredential(BaseModel):
    """
    Used only in-process by Autopilot/integrations.
    Never returned via API. Never logged.
    """
    credential_type: CredentialType
    host: Optional[str]
    username: Optional[str]
    password: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    api_key: Optional[str] = None

    def clear(self) -> None:
        """Overwrite secrets in memory (best-effort)."""
        self.password = None
        self.access_token = None
        self.refresh_token = None
        self.api_key = None
