"""Auth router — user identity and tenant info."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from prune_api.core.auth import CurrentUser, get_current_user

router = APIRouter()


class MeResponse(BaseModel):
    user_id: str
    tenant_id: str
    email: str
    role: str


@router.get("/auth/me", response_model=MeResponse)
async def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> MeResponse:
    """Return the current user's identity and tenant. Auto-provisions on first call."""
    return MeResponse(
        user_id=str(current_user.user_id),
        tenant_id=str(current_user.tenant_id),
        email=current_user.email,
        role=current_user.role,
    )
