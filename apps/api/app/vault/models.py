"""
Vault models: ClientCredential + AuditLog
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Enum as SAEnum,
    ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ── Enums ──────────────────────────────────────────────────────────────────

class CredentialType(str, enum.Enum):
    ftp        = "ftp"
    sftp       = "sftp"
    oauth_yandex  = "oauth_yandex"
    oauth_google  = "oauth_google"
    api_key    = "api_key"
    ssh        = "ssh"
    other      = "other"


class AuditAction(str, enum.Enum):
    created   = "created"   # credential saved
    accessed  = "accessed"  # credential decrypted for use
    updated   = "updated"   # credential value changed
    deleted   = "deleted"   # credential removed
    rotated   = "rotated"   # re-encrypted after key rotation
    revoked   = "revoked"   # client revoked access


# ── ClientCredential ───────────────────────────────────────────────────────

class ClientCredential(Base):
    """
    Encrypted credential for a client's external service.
    Plain-text values are NEVER stored — only ciphertext from Fernet.
    """
    __tablename__ = "client_credentials"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    # Credential metadata (not sensitive — stored plain)
    credential_type = Column(SAEnum(CredentialType), nullable=False)
    label           = Column(String(120), nullable=False)   # e.g. "FTP основной сайт"
    host            = Column(String(255), nullable=True)    # e.g. "ftp.mysite.ru"
    username        = Column(String(255), nullable=True)    # plain — not sensitive
    scope           = Column(String(255), nullable=True)    # OAuth scope or permission note

    # Encrypted sensitive fields (Fernet ciphertext)
    password_enc        = Column(Text, nullable=True)   # FTP/SFTP/SSH password
    access_token_enc    = Column(Text, nullable=True)   # OAuth access token
    refresh_token_enc   = Column(Text, nullable=True)   # OAuth refresh token
    api_key_enc         = Column(Text, nullable=True)   # Generic API key

    # Consent — client must explicitly agree before we store
    consent_given    = Column(Boolean, nullable=False, default=False)
    consent_text     = Column(Text, nullable=True)  # snapshot of consent text shown
    consent_given_at = Column(DateTime(timezone=True), nullable=True)

    # Lifecycle
    is_active  = Column(Boolean, nullable=False, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # for OAuth tokens
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    audit_logs = relationship("CredentialAuditLog", back_populates="credential",
                              cascade="all, delete-orphan", lazy="dynamic")

    __table_args__ = (
        Index("ix_cred_company", "company_id"),
        Index("ix_cred_active", "is_active"),
    )

    def __repr__(self):
        return f"<ClientCredential {self.credential_type}:{self.label} company={self.company_id}>"


# ── AuditLog ───────────────────────────────────────────────────────────────

class CredentialAuditLog(Base):
    """
    Immutable audit trail — every access/mutation is recorded.
    Rows are NEVER deleted (even if the credential is deleted).
    """
    __tablename__ = "credential_audit_logs"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credential_id = Column(UUID(as_uuid=True), ForeignKey("client_credentials.id", ondelete="SET NULL"),
                           nullable=True)
    company_id    = Column(UUID(as_uuid=True), nullable=False)  # denormalized for queries after deletion

    action        = Column(SAEnum(AuditAction), nullable=False)
    actor         = Column(String(120), nullable=True)    # "system:autopilot", "user:uuid", "api:v1"
    ip_address    = Column(String(45), nullable=True)     # IPv4 or IPv6
    user_agent    = Column(String(512), nullable=True)
    details       = Column(Text, nullable=True)           # human-readable context (no secrets!)

    performed_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           nullable=False)

    # Relationship
    credential = relationship("ClientCredential", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_company", "company_id"),
        Index("ix_audit_credential", "credential_id"),
        Index("ix_audit_time", "performed_at"),
    )
