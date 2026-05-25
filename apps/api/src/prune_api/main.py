"""Prune AI API — workflow engine and channel adapters."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from prune_api.routers import chat, health, webhooks

app = FastAPI(
    title="Prune AI API",
    version="0.1.0",
    description="Workflow engine and channel adapters for Prune AI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router, prefix="/v1")
app.include_router(webhooks.router, prefix="/v1/webhooks")
