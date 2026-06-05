"""Prune AI API — workflow engine and channel adapters."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from prune_api.routers import (
    auth,
    channels,
    chat,
    conversations,
    deployments,
    environments,
    files,
    health,
    integrations,
    knowledge,
    runs,
    schedules,
    webhooks,
    workflows,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    from prune_api.db.base import engine

    scheduler_task = asyncio.create_task(schedules.scheduler_loop())
    yield
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()


app = FastAPI(
    title="Prune AI API",
    version="0.1.0",
    description="Workflow engine and channel adapters for Prune AI",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/v1")
app.include_router(files.router, prefix="/v1")
app.include_router(chat.router, prefix="/v1")
app.include_router(workflows.router, prefix="/v1")
app.include_router(runs.router, prefix="/v1")
app.include_router(knowledge.router, prefix="/v1")
app.include_router(schedules.router, prefix="/v1")
app.include_router(channels.router, prefix="/v1")
app.include_router(conversations.router, prefix="/v1")
app.include_router(environments.router, prefix="/v1")
app.include_router(webhooks.router, prefix="/v1/webhooks")
app.include_router(integrations.router, prefix="/v1/integrations")
app.include_router(deployments.router, prefix="/v1")
