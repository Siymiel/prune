"""Deployment service — workflow versioning, publishing, and deployment management."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.db.models import Deployment, Workflow, WorkflowVersion


# ---------------------------------------------------------------------------
# Slug utilities
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    """Convert a workflow name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug or "workflow"


async def _unique_slug(base: str, session: AsyncSession) -> str:
    """Return a slug that doesn't collide with any existing deployment."""
    candidate = base[:180]
    suffix = 0
    while True:
        test = candidate if suffix == 0 else f"{candidate}-{suffix}"
        exists = await session.scalar(
            select(Deployment.id).where(Deployment.slug == test)
        )
        if exists is None:
            return test
        suffix += 1


# ---------------------------------------------------------------------------
# Version management
# ---------------------------------------------------------------------------

async def _next_version_number(workflow_id: uuid.UUID, session: AsyncSession) -> int:
    """Return the next version number for a workflow (max existing + 1, starting at 1)."""
    current_max = await session.scalar(
        select(func.max(WorkflowVersion.version_number)).where(
            WorkflowVersion.workflow_id == workflow_id
        )
    )
    return (current_max or 0) + 1


async def create_version(
    workflow: Workflow,
    user_id: uuid.UUID | None,
    session: AsyncSession,
) -> WorkflowVersion:
    """Snapshot the workflow graph into an immutable WorkflowVersion row."""
    version_number = await _next_version_number(workflow.id, session)
    version = WorkflowVersion(
        workflow_id=workflow.id,
        tenant_id=workflow.tenant_id,
        version_number=version_number,
        graph=dict(workflow.graph),  # defensive copy
        created_by=user_id,
    )
    session.add(version)
    await session.flush()
    await session.refresh(version)
    return version


# ---------------------------------------------------------------------------
# Deployment URL helpers
# ---------------------------------------------------------------------------

def build_deployment_url(deployment_type: str, workflow_id: str, app_url: str, api_url: str) -> str:
    """Construct the public-facing URL for a deployment."""
    if deployment_type == "chat":
        return f"{app_url}/chat/{workflow_id}"
    if deployment_type == "form":
        return f"{app_url}/form/{workflow_id}"
    if deployment_type == "api":
        return f"{api_url}/v1/run/{workflow_id}"
    # widget — no direct URL; the consumer uses an embed snippet
    return f"{app_url}/chat/{workflow_id}"


# ---------------------------------------------------------------------------
# Core publish / unpublish operations
# ---------------------------------------------------------------------------

async def publish_workflow(
    workflow: Workflow,
    user_id: uuid.UUID | None,
    deployment_type: str,
    session: AsyncSession,
    custom_slug: str | None = None,
    app_url: str = "http://localhost:3000",
    api_url: str = "http://localhost:8000",
    metadata: dict[str, Any] | None = None,
) -> tuple[WorkflowVersion, Deployment]:
    """Publish a workflow: create an immutable version snapshot + a Deployment record.

    Returns (version, deployment).
    Marks workflow.is_published = True.
    """
    # 1. Create immutable version snapshot
    version = await create_version(workflow, user_id, session)

    # 2. Generate slug
    slug_base = _slugify(custom_slug or workflow.name)
    slug = await _unique_slug(slug_base, session)

    # 3. Build public URL
    url = build_deployment_url(deployment_type, str(workflow.id), app_url, api_url)

    # 4. Create deployment record
    deployment = Deployment(
        workflow_id=workflow.id,
        version_id=version.id,
        tenant_id=workflow.tenant_id,
        deployment_type=deployment_type,
        status="active",
        slug=slug,
        url=url,
        created_by=user_id,
        published_at=datetime.now(UTC),
        metadata_=metadata or {},
    )
    session.add(deployment)

    # 5. Mark workflow as published
    workflow.is_published = True
    workflow.published_at = workflow.published_at or datetime.now(UTC)

    await session.flush()
    await session.refresh(deployment)
    return version, deployment


async def unpublish_deployment(
    deployment: Deployment,
    session: AsyncSession,
) -> Deployment:
    """Deactivate a deployment (status → inactive)."""
    deployment.status = "inactive"
    await session.flush()
    await session.refresh(deployment)
    return deployment
