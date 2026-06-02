"""Prune AI API — workflow engine and channel adapters."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from prune_api.routers import auth, chat, health, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Lazy import so the engine is only created after settings are loaded.
    from prune_api.db.base import engine

    yield

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
app.include_router(chat.router, prefix="/v1")
app.include_router(webhooks.router, prefix="/v1/webhooks")
