"""Deployments router — publish workflows, manage deployments and versions.

Endpoints:
  POST   /v1/deployments                          — publish a workflow (create version + deployment)
  GET    /v1/deployments                          — list deployments for tenant
  GET    /v1/deployments/{deployment_id}          — get single deployment
  PATCH  /v1/deployments/{deployment_id}          — update status / metadata
  DELETE /v1/deployments/{deployment_id}          — archive deployment
  GET    /v1/workflows/{workflow_id}/versions     — version history for a workflow
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.core.settings import settings
from prune_api.db.base import get_session
from prune_api.db.models import Deployment, Workflow, WorkflowVersion
from prune_api.services.deployment import publish_workflow, unpublish_deployment

router = APIRouter()

_APP_URL = getattr(settings, "app_url", "http://localhost:3000")
_API_URL = getattr(settings, "api_url", "http://localhost:8000")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PublishRequest(BaseModel):
    workflow_id: str
    deployment_type: str = "chat"  # chat | form | api | widget
    slug: str | None = None
    metadata: dict[str, Any] = {}


class DeploymentUpdate(BaseModel):
    status: str | None = None       # active | inactive | archived
    metadata: dict[str, Any] | None = None


class VersionOut(BaseModel):
    id: str
    workflow_id: str
    version_number: int
    created_by: str | None
    created_at: str


class DeploymentOut(BaseModel):
    id: str
    workflow_id: str
    version_id: str
    deployment_type: str
    status: str
    slug: str
    url: str | None
    created_by: str | None
    published_at: str | None
    metadata: dict[str, Any]
    created_at: str
    updated_at: str
    version_number: int | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_uuid(val: str, name: str = "id") -> uuid.UUID:
    try:
        return uuid.UUID(val)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {name}")


def _version_out(v: WorkflowVersion) -> VersionOut:
    return VersionOut(
        id=str(v.id),
        workflow_id=str(v.workflow_id),
        version_number=v.version_number,
        created_by=str(v.created_by) if v.created_by else None,
        created_at=v.created_at.isoformat(),
    )


def _deployment_out(d: Deployment, version_number: int | None = None) -> DeploymentOut:
    return DeploymentOut(
        id=str(d.id),
        workflow_id=str(d.workflow_id),
        version_id=str(d.version_id),
        deployment_type=d.deployment_type,
        status=d.status,
        slug=d.slug,
        url=d.url,
        created_by=str(d.created_by) if d.created_by else None,
        published_at=d.published_at.isoformat() if d.published_at else None,
        metadata=d.metadata_,
        created_at=d.created_at.isoformat(),
        updated_at=d.updated_at.isoformat(),
        version_number=version_number,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/deployments", response_model=DeploymentOut, status_code=201)
async def create_deployment(
    body: PublishRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentOut:
    """Publish a workflow: snapshots its graph + creates a live Deployment."""
    wid = _parse_uuid(body.workflow_id, "workflow_id")

    row = await session.execute(
        select(Workflow).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    workflow = row.scalar_one_or_none()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if body.deployment_type not in ("chat", "form", "api", "widget"):
        raise HTTPException(status_code=400, detail="deployment_type must be one of: chat, form, api, widget")

    version, deployment = await publish_workflow(
        workflow=workflow,
        user_id=current_user.user_id,
        deployment_type=body.deployment_type,
        session=session,
        custom_slug=body.slug,
        app_url=_APP_URL,
        api_url=_API_URL,
        metadata=body.metadata,
    )
    await session.commit()
    return _deployment_out(deployment, version_number=version.version_number)


@router.get("/deployments", response_model=list[DeploymentOut])
async def list_deployments(
    workflow_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[DeploymentOut]:
    """List deployments for the current tenant, optionally filtered by workflow."""
    q = (
        select(Deployment, WorkflowVersion.version_number)
        .join(WorkflowVersion, Deployment.version_id == WorkflowVersion.id)
        .where(Deployment.tenant_id == current_user.tenant_id)
    )
    if workflow_id:
        wid = _parse_uuid(workflow_id, "workflow_id")
        q = q.where(Deployment.workflow_id == wid)
    if status:
        q = q.where(Deployment.status == status)

    q = q.order_by(Deployment.created_at.desc()).limit(limit).offset(offset)
    rows = await session.execute(q)
    return [_deployment_out(d, vn) for d, vn in rows.all()]


@router.get("/deployments/{deployment_id}", response_model=DeploymentOut)
async def get_deployment(
    deployment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentOut:
    did = _parse_uuid(deployment_id, "deployment_id")
    row = await session.execute(
        select(Deployment, WorkflowVersion.version_number)
        .join(WorkflowVersion, Deployment.version_id == WorkflowVersion.id)
        .where(
            Deployment.id == did,
            Deployment.tenant_id == current_user.tenant_id,
        )
    )
    result = row.first()
    if result is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    deployment, version_number = result
    return _deployment_out(deployment, version_number)


@router.patch("/deployments/{deployment_id}", response_model=DeploymentOut)
async def update_deployment(
    deployment_id: str,
    body: DeploymentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentOut:
    """Update a deployment's status or metadata."""
    did = _parse_uuid(deployment_id, "deployment_id")
    row = await session.execute(
        select(Deployment).where(
            Deployment.id == did,
            Deployment.tenant_id == current_user.tenant_id,
        )
    )
    deployment = row.scalar_one_or_none()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if body.status is not None:
        if body.status not in ("active", "inactive", "archived"):
            raise HTTPException(status_code=400, detail="status must be one of: active, inactive, archived")
        deployment.status = body.status
    if body.metadata is not None:
        deployment.metadata_ = body.metadata

    await session.flush()
    await session.refresh(deployment)

    vn = await session.scalar(
        select(WorkflowVersion.version_number).where(WorkflowVersion.id == deployment.version_id)
    )
    await session.commit()
    return _deployment_out(deployment, vn)


@router.delete("/deployments/{deployment_id}", status_code=204)
async def archive_deployment(
    deployment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Archive a deployment (soft delete — sets status to archived)."""
    did = _parse_uuid(deployment_id, "deployment_id")
    row = await session.execute(
        select(Deployment).where(
            Deployment.id == did,
            Deployment.tenant_id == current_user.tenant_id,
        )
    )
    deployment = row.scalar_one_or_none()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")

    deployment.status = "archived"
    await session.commit()


# ---------------------------------------------------------------------------
# Version history
# ---------------------------------------------------------------------------

@router.get("/workflows/{workflow_id}/versions", response_model=list[VersionOut])
async def list_versions(
    workflow_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[VersionOut]:
    """Return all published versions for a workflow in descending order."""
    wid = _parse_uuid(workflow_id, "workflow_id")

    # Verify ownership
    workflow_exists = await session.scalar(
        select(Workflow.id).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    if workflow_exists is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    rows = await session.execute(
        select(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == wid)
        .order_by(WorkflowVersion.version_number.desc())
    )
    return [_version_out(v) for v in rows.scalars().all()]
