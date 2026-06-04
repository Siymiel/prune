"""SQLAlchemy ORM models — one class per database table.

Table hierarchy:
  tenants
    └── users
    └── workflows
          └── workflow_channels
          └── conversations
                └── messages
                └── runs
                      └── trace_steps
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from prune_api.db.base import Base


class Tenant(Base):
    """Root multi-tenant entity. Every other row belongs to a tenant."""

    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, server_default="free")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users: Mapped[list[User]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    workflows: Mapped[list[Workflow]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """A person belonging to a tenant. auth_id links to Supabase Auth."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    auth_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default="member")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tenant: Mapped[Tenant] = relationship(back_populates="users")
    workflows: Mapped[list[Workflow]] = relationship(back_populates="created_by_user")


class Workflow(Base):
    """A saved workflow graph. graph is the full node/edge JSON from the builder."""

    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_slug: Mapped[str | None] = mapped_column(String(100), nullable=True)
    graph: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship(back_populates="workflows")
    created_by_user: Mapped[User | None] = relationship(back_populates="workflows")
    channels: Mapped[list[WorkflowChannel]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan"
    )
    conversations: Mapped[list[Conversation]] = relationship(back_populates="workflow")
    runs: Mapped[list[Run]] = relationship(back_populates="workflow")
    schedules: Mapped[list[WorkflowSchedule]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan"
    )


class WorkflowChannel(Base):
    """A deployed channel for a workflow (WhatsApp number, API key, web widget, etc.)."""

    __tablename__ = "workflow_channels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    # whatsapp | api | web | batch
    channel_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # channel-specific config: phone_number_id, api_key_hash, subdomain, etc.
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workflow: Mapped[Workflow] = relationship(back_populates="channels")


class Conversation(Base):
    """A session between a contact and a workflow, on a specific channel."""

    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflows.id", ondelete="SET NULL"), nullable=True
    )
    # whatsapp | web | api | batch
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Extra channel-specific data (WhatsApp message ID, browser session, etc.)
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workflow: Mapped[Workflow | None] = relationship(back_populates="conversations")
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
    runs: Mapped[list[Run]] = relationship(back_populates="conversation")


class Message(Base):
    """A single turn in a conversation (user or assistant)."""

    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    # user | assistant | system
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Attachments, external message IDs (e.g. WhatsApp wamid), etc.
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class Run(Base):
    """One execution of a workflow graph.

    Lifecycle: pending → running → (waiting | done | error)
    wait_token links to an external callback (M-Pesa CheckoutRequestID, etc.)
    so the webhook can resume the run from resume_node.
    """

    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflows.id", ondelete="SET NULL"), nullable=True
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    # pending | running | waiting | done | error
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    # Mutable shared state accumulated across node executions
    state: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    # Token used by a webhook to resume this run (e.g. CheckoutRequestID)
    wait_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    wait_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Node ID to resume execution from after a wait
    resume_node: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workflow: Mapped[Workflow | None] = relationship(back_populates="runs")
    conversation: Mapped[Conversation | None] = relationship(back_populates="runs")
    trace_steps: Mapped[list[TraceStep]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="TraceStep.created_at",
    )


class KnowledgeBase(Base):
    """A named collection of documents whose chunks are stored in Pinecone."""

    __tablename__ = "knowledge_bases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documents: Mapped[list[KnowledgeDocument]] = relationship(
        back_populates="knowledge_base", cascade="all, delete-orphan"
    )


class KnowledgeDocument(Base):
    """A single file uploaded to a knowledge base.

    status lifecycle: processing → ready | error
    chunk_count is updated once ingestion completes.
    """

    __tablename__ = "knowledge_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_base_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="processing")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    knowledge_base: Mapped[KnowledgeBase] = relationship(back_populates="documents")


class WorkflowSchedule(Base):
    """A cron-based trigger that fires a workflow on a repeating schedule."""

    __tablename__ = "workflow_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    # Standard 5-field cron expression, e.g. "0 9 * * 1"
    cron: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    # Default inputs merged into the run state on each trigger
    inputs: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Pre-computed to allow efficient DB polling by the scheduler loop
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workflow: Mapped[Workflow] = relationship(back_populates="schedules")


class TraceStep(Base):
    """One node execution event within a run — the observable audit trail."""

    __tablename__ = "trace_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("runs.id", ondelete="CASCADE"), nullable=False
    )
    node_id: Mapped[str] = mapped_column(String(255), nullable=False)
    node_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # ok | wait | error
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    input: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    output: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    run: Mapped[Run] = relationship(back_populates="trace_steps")


class Environment(Base):
    """A named environment (e.g. Development, Staging, Production) belonging to a tenant."""

    __tablename__ = "environments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    variables: Mapped[list[EnvironmentVariable]] = relationship(
        back_populates="environment", cascade="all, delete-orphan"
    )


class EnvironmentVariable(Base):
    """A key/value pair stored inside an environment."""

    __tablename__ = "environment_variables"
    __table_args__ = (UniqueConstraint("environment_id", "key", name="uq_env_var_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    environment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("environments.id", ondelete="CASCADE"), nullable=False
    )
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    # Stored in plain text for now; encrypt at the application layer when needed
    value: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    environment: Mapped[Environment] = relationship(back_populates="variables")
