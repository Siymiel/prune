"""FastAPI dependency for Supabase JWT verification and user provisioning.

Flow:
  1. Extract Bearer token from Authorization header
  2. Verify signature with SUPABASE_JWT_SECRET (HS256)
  3. Look up User by auth_id (Supabase sub claim)
  4. On first login, auto-create Tenant + User
  5. Return CurrentUser for injection into route handlers
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Annotated

import jwt
from jwt import PyJWKClient
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.settings import settings
from prune_api.db.base import get_session
from prune_api.db.models import Tenant, User

# Lazily initialised — reused across requests to cache fetched JWKS keys.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        )
    return _jwks_client


@dataclass
class CurrentUser:
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    auth_id: str
    email: str
    role: str


def _slug_from_email(email: str) -> str:
    prefix = email.split("@")[0]
    slug = re.sub(r"[^a-z0-9-]", "-", prefix.lower()).strip("-")
    return slug or "tenant"


async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_session),
) -> CurrentUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be 'Bearer <token>'",
        )

    token = authorization[7:].strip()

    try:
        alg = jwt.get_unverified_header(token).get("alg", "HS256")

        if alg == "HS256":
            # Symmetric — verify with the shared JWT secret.
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth not configured — set SUPABASE_JWT_SECRET",
                )
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Asymmetric (ES256, RS256, …) — fetch public key from Supabase JWKS.
            if not settings.supabase_url:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth not configured — set SUPABASE_URL",
                )
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    auth_id: str = payload["sub"]
    email: str = payload.get("email", "")

    row = await session.execute(select(User).where(User.auth_id == auth_id))
    user = row.scalar_one_or_none()

    if user is None:
        user = await _provision_user(session, auth_id, email)

    return CurrentUser(
        user_id=user.id,
        tenant_id=user.tenant_id,
        auth_id=auth_id,
        email=email,
        role=user.role,
    )


async def _provision_user(session: AsyncSession, auth_id: str, email: str) -> User:
    """Create a new Tenant + User for a first-time login."""
    base_slug = _slug_from_email(email)

    slug_row = await session.execute(select(Tenant).where(Tenant.slug == base_slug))
    slug = base_slug if slug_row.scalar_one_or_none() is None else f"{base_slug}-{auth_id[:8]}"

    tenant = Tenant(name=slug, slug=slug, plan="free")
    session.add(tenant)
    await session.flush()

    user = User(
        tenant_id=tenant.id,
        auth_id=auth_id,
        email=email,
        name=email.split("@")[0] if email else None,
        role="owner",
    )
    session.add(user)
    await session.flush()

    return user
