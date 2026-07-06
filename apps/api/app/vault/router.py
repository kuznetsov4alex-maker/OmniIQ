"""Vault API routes."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.vault import service
from app.vault.schemas import CredentialCreate, CredentialOut, AuditLogOut
from app.vault.models import ClientCredential

router = APIRouter(prefix="/vault", tags=["vault"])


def _to_out(cred: ClientCredential) -> CredentialOut:
    return CredentialOut(
        id=cred.id,
        company_id=cred.company_id,
        credential_type=cred.credential_type,
        label=cred.label,
        host=cred.host,
        username=cred.username,
        scope=cred.scope,
        is_active=cred.is_active,
        consent_given=cred.consent_given,
        consent_given_at=cred.consent_given_at,
        expires_at=cred.expires_at,
        created_at=cred.created_at,
        updated_at=cred.updated_at,
        has_password=bool(cred.password_enc),
        has_access_token=bool(cred.access_token_enc),
        has_refresh_token=bool(cred.refresh_token_enc),
        has_api_key=bool(cred.api_key_enc),
    )


@router.get("/companies/{company_id}/credentials", response_model=List[CredentialOut])
async def list_credentials(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all active credentials for a company (no secrets returned)."""
    creds = await service.list_credentials(db, company_id)
    return [_to_out(c) for c in creds]


@router.post("/companies/{company_id}/credentials",
             response_model=CredentialOut, status_code=status.HTTP_201_CREATED)
async def add_credential(
    company_id: UUID,
    data: CredentialCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Store a new encrypted credential.
    Requires explicit client consent in request body.
    Plain-text values are encrypted immediately and never stored.
    """
    cred = await service.create_credential(db, company_id, data, request)
    return _to_out(cred)


@router.delete("/companies/{company_id}/credentials/{credential_id}/revoke",
               status_code=status.HTTP_204_NO_CONTENT)
async def revoke_credential(
    company_id: UUID,
    credential_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Revoke a credential: deactivate and wipe encrypted values.
    Audit log entry preserved. Credential row kept (status=inactive).
    """
    ok = await service.revoke_credential(db, company_id, credential_id, request)
    if not ok:
        raise HTTPException(status_code=404, detail="Credential not found")


@router.delete("/companies/{company_id}/credentials/{credential_id}",
               status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    company_id: UUID,
    credential_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Hard delete (GDPR right to erasure).
    Credential row deleted; audit log preserved.
    """
    ok = await service.delete_credential(db, company_id, credential_id, request)
    if not ok:
        raise HTTPException(status_code=404, detail="Credential not found")


@router.get("/companies/{company_id}/audit-log", response_model=List[AuditLogOut])
async def get_audit_log(
    company_id: UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Return audit log entries for client UI — shows exactly what we did with their credentials."""
    logs = await service.get_audit_log(db, company_id, limit=min(limit, 200))
    return logs
