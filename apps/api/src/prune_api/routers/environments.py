"""Environments router — CRUD for environments and their variables."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Environment, EnvironmentVariable

router = APIRouter()


class EnvironmentCreate(BaseModel):
    name: str
    description: str | None = None


class EnvironmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class EnvironmentOut(BaseModel):
    id: str
    name: str
    description: str | None
    variable_count: int
    created_at: str
    updated_at: str


class VarUpsert(BaseModel):
    key: str
    value: str


class VarOut(BaseModel):
    id: str
    key: str
    value: str
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------

@router.get("/environments", response_model=list[EnvironmentOut])
async def list_environments(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[EnvironmentOut]:
    envs = (await session.execute(
        select(Environment)
        .where(Environment.tenant_id == current_user.tenant_id)
        .order_by(Environment.created_at)
    )).scalars().all()
    return [await _env_out(session, e) for e in envs]


@router.post("/environments", response_model=EnvironmentOut, status_code=201)
async def create_environment(
    body: EnvironmentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> EnvironmentOut:
    env = Environment(
        tenant_id=current_user.tenant_id,
        name=body.name,
        description=body.description,
    )
    session.add(env)
    await session.commit()
    await session.refresh(env)
    return await _env_out(session, env)


@router.patch("/environments/{env_id}", response_model=EnvironmentOut)
async def update_environment(
    env_id: str,
    body: EnvironmentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> EnvironmentOut:
    env = await _get_env(session, env_id, current_user.tenant_id)
    if body.name is not None:
        env.name = body.name
    if body.description is not None:
        env.description = body.description
    await session.commit()
    await session.refresh(env)
    return await _env_out(session, env)


@router.delete("/environments/{env_id}", status_code=204)
async def delete_environment(
    env_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    env = await _get_env(session, env_id, current_user.tenant_id)
    await session.delete(env)
    await session.commit()


# ---------------------------------------------------------------------------
# Variables
# ---------------------------------------------------------------------------

@router.get("/environments/{env_id}/variables", response_model=list[VarOut])
async def list_variables(
    env_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[VarOut]:
    env = await _get_env(session, env_id, current_user.tenant_id)
    vars_ = (await session.execute(
        select(EnvironmentVariable)
        .where(EnvironmentVariable.environment_id == env.id)
        .order_by(EnvironmentVariable.key)
    )).scalars().all()
    return [_var_out(v) for v in vars_]


@router.put("/environments/{env_id}/variables", response_model=VarOut)
async def upsert_variable(
    env_id: str,
    body: VarUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VarOut:
    env = await _get_env(session, env_id, current_user.tenant_id)

    existing = (await session.execute(
        select(EnvironmentVariable).where(
            EnvironmentVariable.environment_id == env.id,
            EnvironmentVariable.key == body.key,
        )
    )).scalar_one_or_none()

    if existing:
        existing.value = body.value
        await session.commit()
        await session.refresh(existing)
        return _var_out(existing)

    var = EnvironmentVariable(
        environment_id=env.id,
        key=body.key,
        value=body.value,
    )
    session.add(var)
    await session.commit()
    await session.refresh(var)
    return _var_out(var)


@router.delete("/environments/{env_id}/variables/{key}", status_code=204)
async def delete_variable(
    env_id: str,
    key: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    env = await _get_env(session, env_id, current_user.tenant_id)
    var = (await session.execute(
        select(EnvironmentVariable).where(
            EnvironmentVariable.environment_id == env.id,
            EnvironmentVariable.key == key,
        )
    )).scalar_one_or_none()
    if var is None:
        raise HTTPException(status_code=404, detail="Variable not found")
    await session.delete(var)
    await session.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_env(
    session: AsyncSession, env_id: str, tenant_id: uuid.UUID
) -> Environment:
    try:
        eid = uuid.UUID(env_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid environment_id")

    env = (await session.execute(
        select(Environment).where(
            Environment.id == eid,
            Environment.tenant_id == tenant_id,
        )
    )).scalar_one_or_none()
    if env is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env


async def _env_out(session: AsyncSession, env: Environment) -> EnvironmentOut:
    from sqlalchemy import func
    count = (await session.execute(
        select(func.count()).select_from(EnvironmentVariable).where(
            EnvironmentVariable.environment_id == env.id
        )
    )).scalar_one()
    return EnvironmentOut(
        id=str(env.id),
        name=env.name,
        description=env.description,
        variable_count=count,
        created_at=env.created_at.isoformat(),
        updated_at=env.updated_at.isoformat(),
    )


def _var_out(v: EnvironmentVariable) -> VarOut:
    return VarOut(
        id=str(v.id),
        key=v.key,
        value=v.value,
        created_at=v.created_at.isoformat(),
        updated_at=v.updated_at.isoformat(),
    )
