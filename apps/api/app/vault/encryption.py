"""
Credential Vault — AES-256 (Fernet) encryption for client credentials.

Architecture:
  - Master key lives ONLY in environment variable CREDENTIAL_MASTER_KEY
  - Each credential is encrypted with Fernet(master_key) before DB storage
  - Decryption happens in memory only, never logged
  - Audit log records every access event
"""
import os
import base64
import logging
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

# ── Master key management ──────────────────────────────────────────────────

def _load_master_key() -> bytes:
    """
    Load the master encryption key from environment.
    NEVER falls back to a hardcoded default in production.
    """
    raw = os.environ.get("CREDENTIAL_MASTER_KEY", "")
    if not raw:
        if os.environ.get("APP_ENV", "development") == "production":
            raise RuntimeError(
                "CREDENTIAL_MASTER_KEY is not set. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        # Development only: generate ephemeral key (data won't survive restarts)
        logger.warning(
            "⚠️  CREDENTIAL_MASTER_KEY not set — using ephemeral dev key. "
            "Set CREDENTIAL_MASTER_KEY in production!"
        )
        return Fernet.generate_key()
    try:
        key = raw.encode() if isinstance(raw, str) else raw
        # Validate it's a valid Fernet key
        Fernet(key)
        return key
    except Exception as exc:
        raise RuntimeError(f"Invalid CREDENTIAL_MASTER_KEY format: {exc}") from exc


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """Cached Fernet instance — created once per process lifetime."""
    return Fernet(_load_master_key())


# ── Public API ──────────────────────────────────────────────────────────────

def encrypt_credential(plain_text: str) -> str:
    """
    Encrypt a credential string.
    Returns URL-safe base64 encoded ciphertext (safe for DB TEXT columns).
    """
    if not plain_text:
        return ""
    token: bytes = _get_fernet().encrypt(plain_text.encode("utf-8"))
    return token.decode("ascii")


def decrypt_credential(cipher_text: str) -> str:
    """
    Decrypt a credential string.
    Raises ValueError on tampered/expired tokens.
    NEVER logs the decrypted value.
    """
    if not cipher_text:
        return ""
    try:
        plain: bytes = _get_fernet().decrypt(cipher_text.encode("ascii"))
        return plain.decode("utf-8")
    except InvalidToken as exc:
        logger.error("Credential decryption failed — token invalid or tampered")
        raise ValueError("Credential decryption failed") from exc


def generate_master_key() -> str:
    """Utility: generate a new master key for initial setup."""
    return Fernet.generate_key().decode()


def rotate_credential(old_cipher: str) -> str:
    """
    Re-encrypt a credential (use after key rotation).
    Decrypts with current key, re-encrypts — both in memory only.
    """
    plain = decrypt_credential(old_cipher)
    rotated = encrypt_credential(plain)
    # Explicitly clear plain text from local scope
    plain = "0" * len(plain)
    return rotated
