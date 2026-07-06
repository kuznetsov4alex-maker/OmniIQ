"""
Vault service layer — CRUD + audit logging + decryption for Autopilot.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.vault.encryption import encrypt_credential, decrypt_credential
from app.vault.models import ClientCredential, CredentialAuditLog, AuditAction
from app.vault.schemas import CredentialCreate, DecryptedCredential


# ── Audit helper ───────────────────────────────────────────────────────────

async def _audit(
    db: AsyncSession,
    *,
    action: AuditAction,
    company_id: UUID,
    credential_id: Optional[UUID] = None,
    actor: str = "system",
    details: Optional[str] = None,
    request: Optional[Request] = None,
) -> None:
    log = CredentialAuditLog(
        credential_id=credential_id,
        company_id=company_id,
        action=action,
        actor=actor,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
        details=details,
    )
    db.add(log)
    # Flush immediately so audit is committed even if outer txn rolls back partially
    await db.flush()


# ── Create ─────────────────────────────────────────────────────────────────

async def create_credential(
    db: AsyncSession,
    company_id: UUID,
    data: CredentialCreate,
    request: Optional[Request] = None,
) -> ClientCredential:
    cred = ClientCredential(
        company_id=company_id,
        credential_type=data.credential_type,
        label=data.label,
        host=data.host,
        username=data.username,
        scope=data.scope,
        consent_given=data.consent_given,
        consent_text=data.consent_text,
        consent_given_at=datetime.now(timezone.utc),
        # Encrypt sensitive fields
        password_enc=encrypt_credential(data.password) if data.password else None,
        access_token_enc=encrypt_credential(data.access_token) if data.access_token else None,
        refresh_token_enc=encrypt_credential(data.refresh_token) if data.refresh_token else None,
        api_key_enc=encrypt_credential(data.api_key) if data.api_key else None,
    )
    db.add(cred)
    await db.flush()

    await _audit(
        db, action=AuditAction.created,
        company_id=company_id, credential_id=cred.id,
        actor=f"user:{request.client.host}" if request and request.client else "api",
        details=f"Добавлен доступ: {data.credential_type} — {data.label}",
        request=request,
    )
    await db.commit()
    await db.refresh(cred)
    return cred


# ── List ───────────────────────────────────────────────────────────────────

async def list_credentials(
    db: AsyncSession,
    company_id: UUID,
    include_inactive: bool = False,
) -> list[ClientCredential]:
    q = select(ClientCredential).where(ClientCredential.company_id == company_id)
    if not include_inactive:
        q = q.where(ClientCredential.is_active.is_(True))
    q = q.order_by(ClientCredential.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


# ── Revoke (soft delete) ───────────────────────────────────────────────────

async def revoke_credential(
    db: AsyncSession,
    company_id: UUID,
    credential_id: UUID,
    request: Optional[Request] = None,
) -> bool:
    result = await db.execute(
        select(ClientCredential).where(
            ClientCredential.id == credential_id,
            ClientCredential.company_id == company_id,
            ClientCredential.is_active.is_(True),
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        return False

    # Wipe encrypted values from DB (GDPR right to erasure)
    cred.is_active = False
    cred.password_enc = None
    cred.access_token_enc = None
    cred.refresh_token_enc = None
    cred.api_key_enc = None

    await _audit(
        db, action=AuditAction.revoked,
        company_id=company_id, credential_id=credential_id,
        actor="user",
        details=f"Доступ отозван клиентом: {cred.label}",
        request=request,
    )
    await db.commit()
    return True


# ── Hard delete (GDPR erasure request) ────────────────────────────────────

async def delete_credential(
    db: AsyncSession,
    company_id: UUID,
    credential_id: UUID,
    request: Optional[Request] = None,
) -> bool:
    """Audit log preserved, credential row deleted."""
    result = await db.execute(
        select(ClientCredential).where(
            ClientCredential.id == credential_id,
            ClientCredential.company_id == company_id,
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        return False

    label = cred.label
    await _audit(
        db, action=AuditAction.deleted,
        company_id=company_id, credential_id=credential_id,
        actor="user",
        details=f"Доступ удалён (GDPR/запрос клиента): {label}",
        request=request,
    )
    await db.delete(cred)
    await db.commit()
    return True


# ── Decrypt for Autopilot (internal use ONLY) ─────────────────────────────

async def get_decrypted(
    db: AsyncSession,
    company_id: UUID,
    credential_id: UUID,
    actor: str = "system:autopilot",
    task_name: Optional[str] = None,
) -> Optional[DecryptedCredential]:
    """
    Decrypt a credential for use by Autopilot/integrations.
    Every call is logged in the audit trail.
    Returns None if not found / inactive.
    """
    result = await db.execute(
        select(ClientCredential).where(
            ClientCredential.id == credential_id,
            ClientCredential.company_id == company_id,
            ClientCredential.is_active.is_(True),
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        return None

    # Log the access BEFORE decryption
    await _audit(
        db, action=AuditAction.accessed,
        company_id=company_id, credential_id=credential_id,
        actor=actor,
        details=f"Расшифровка для задачи: {task_name or 'не указана'}",
    )
    await db.commit()

    return DecryptedCredential(
        credential_type=cred.credential_type,
        host=cred.host,
        username=cred.username,
        password=decrypt_credential(cred.password_enc) if cred.password_enc else None,
        access_token=decrypt_credential(cred.access_token_enc) if cred.access_token_enc else None,
        refresh_token=decrypt_credential(cred.refresh_token_enc) if cred.refresh_token_enc else None,
        api_key=decrypt_credential(cred.api_key_enc) if cred.api_key_enc else None,
    )


# ── Audit log retrieval (for client UI) ───────────────────────────────────

async def get_audit_log(
    db: AsyncSession,
    company_id: UUID,
    limit: int = 50,
) -> list[CredentialAuditLog]:
    q = (
        select(CredentialAuditLog)
        .where(CredentialAuditLog.company_id == company_id)
        .order_by(CredentialAuditLog.performed_at.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    return list(result.scalars().all())
