from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

DEV_USER_ID = "dev-user-00000000-0000-0000-0000-000000000001"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_dev_user_id: str | None = Header(default=None),
) -> str:
    """
    Validate Supabase JWT and return user_id (sub claim).

    Dev mode: if APP_DEBUG=true and JWT_SECRET is the default dev secret,
    accepts X-Dev-User-Id header or returns a fixed dev user ID.
    This allows local development without a Supabase project.
    """
    # ── Dev mode bypass ───────────────────────────────────────
    if settings.app_debug and settings.jwt_secret in (
        "", "dev-secret-change-in-production"
    ):
        return x_dev_user_id or DEV_USER_ID

    # ── Production: validate JWT ──────────────────────────────
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        ) from e
