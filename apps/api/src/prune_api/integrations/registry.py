"""Integration Trigger Registry — backend mirror of apps/web/lib/trigger-registry.ts.

Each entry defines:
  - provider id and metadata
  - supported event types
  - the output field schema injected into state.event.*

The workflow engine only consumes NormalizedEvent (see normalizer.py); all
provider-specific payload parsing stays in the webhook router.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


AuthType = Literal["oauth", "api_key", "webhook", "service_account"]


@dataclass(frozen=True)
class TriggerEventDef:
    id: str
    label: str
    description: str
    output_fields: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class TriggerProviderDef:
    id: str
    name: str
    category: str
    auth_type: AuthType
    events: list[TriggerEventDef] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

PROVIDERS: list[TriggerProviderDef] = [
    # ── Communication ────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="slack", name="Slack", category="communication", auth_type="oauth",
        events=[
            TriggerEventDef("message_received",    "Message Received",     "New message in a channel or DM",        ["channel", "user", "text", "timestamp", "thread_ts"]),
            TriggerEventDef("member_joined_channel","Member Joined Channel","A user joins a Slack channel",          ["channel", "user", "inviter", "timestamp"]),
            TriggerEventDef("file_shared",          "File Shared",          "A file is shared in a channel",         ["channel", "user", "file_id", "filename", "filetype", "permalink"]),
            TriggerEventDef("reaction_added",       "Reaction Added",       "Emoji reaction added to a message",     ["channel", "user", "reaction", "message_ts"]),
        ],
    ),
    TriggerProviderDef(
        id="microsoft-teams", name="Microsoft Teams", category="communication", auth_type="oauth",
        events=[
            TriggerEventDef("message_sent",     "Message Sent",      "New message in a team channel",  ["team", "channel", "user", "body", "timestamp"]),
            TriggerEventDef("member_joined_team","Member Joined Team","User added to a team",            ["team", "user", "added_by", "timestamp"]),
            TriggerEventDef("meeting_started",  "Meeting Started",   "Online meeting begins",           ["meeting_id", "subject", "organizer", "start_time", "join_url"]),
            TriggerEventDef("channel_created",  "Channel Created",   "New channel inside a team",       ["team", "channel", "created_by", "timestamp"]),
        ],
    ),
    TriggerProviderDef(
        id="gmail", name="Gmail", category="communication", auth_type="oauth",
        events=[
            TriggerEventDef("email_received", "Email Received", "New email arrives in inbox",    ["from", "to", "subject", "body", "message_id", "received_at"]),
            TriggerEventDef("email_sent",     "Email Sent",     "Email sent from the account",   ["to", "subject", "body", "message_id", "sent_at"]),
            TriggerEventDef("label_applied",  "Label Applied",  "Label applied to an email",     ["label", "from", "subject", "message_id", "applied_at"]),
        ],
    ),
    TriggerProviderDef(
        id="whatsapp", name="WhatsApp", category="communication", auth_type="webhook",
        events=[
            TriggerEventDef("message_received", "Message Received", "WhatsApp message from a contact", ["from", "body", "message_id", "timestamp", "type"]),
        ],
    ),
    TriggerProviderDef(
        id="telegram", name="Telegram", category="communication", auth_type="api_key",
        events=[
            TriggerEventDef("message_received", "Message Received", "Message sent to the bot",    ["chat_id", "user", "text", "message_id", "date"]),
            TriggerEventDef("callback_query",   "Button Clicked",   "Inline keyboard button tap", ["chat_id", "user", "data", "message_id"]),
        ],
    ),

    # ── CRM ──────────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="salesforce", name="Salesforce", category="crm", auth_type="oauth",
        events=[
            TriggerEventDef("lead_created",     "Lead Created",     "New lead added",                ["id", "name", "email", "company", "phone", "source", "created_at"]),
            TriggerEventDef("opportunity_won",  "Opportunity Won",  "Opportunity closed-won",        ["id", "name", "account", "amount", "close_date", "owner"]),
            TriggerEventDef("contact_created",  "Contact Created",  "New contact added",             ["id", "first_name", "last_name", "email", "phone", "account"]),
            TriggerEventDef("case_created",     "Case Created",     "New support case opened",       ["id", "subject", "description", "contact", "priority", "status"]),
        ],
    ),
    TriggerProviderDef(
        id="hubspot", name="HubSpot", category="crm", auth_type="oauth",
        events=[
            TriggerEventDef("contact_created", "Contact Created",   "New contact added",             ["id", "email", "firstname", "lastname", "phone", "company"]),
            TriggerEventDef("deal_won",        "Deal Closed Won",   "Deal pipeline closed-won",      ["id", "dealname", "amount", "close_date", "owner", "pipeline"]),
            TriggerEventDef("form_submitted",  "Form Submitted",    "HubSpot form submitted",        ["form_id", "form_name", "contact_email", "fields", "page_url", "submitted_at"]),
            TriggerEventDef("email_opened",    "Email Opened",      "Marketing email opened",        ["contact_email", "email_subject", "opened_at", "campaign_id"]),
        ],
    ),
    TriggerProviderDef(
        id="pipedrive", name="Pipedrive", category="crm", auth_type="api_key",
        events=[
            TriggerEventDef("deal_created",   "Deal Created",   "New deal in pipeline", ["id", "title", "value", "currency", "status", "owner", "stage"]),
            TriggerEventDef("deal_won",       "Deal Won",       "Deal marked as won",   ["id", "title", "value", "currency", "owner", "closed_at"]),
            TriggerEventDef("person_created", "Person Created", "New contact created",  ["id", "name", "email", "phone", "org_name", "owner"]),
        ],
    ),

    # ── Storage ───────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="google-drive", name="Google Drive", category="storage", auth_type="oauth",
        events=[
            TriggerEventDef("file_created",  "File Created",  "New file created or uploaded", ["file_id", "filename", "mime_type", "owner", "folder", "created_at", "web_url"]),
            TriggerEventDef("file_modified", "File Modified", "Existing file updated",        ["file_id", "filename", "mime_type", "modified_by", "modified_at", "web_url"]),
            TriggerEventDef("file_shared",   "File Shared",   "File shared with new user",    ["file_id", "filename", "shared_with", "role", "shared_at"]),
            TriggerEventDef("folder_created","Folder Created","New folder created",           ["folder_id", "folder_name", "parent_folder", "owner", "created_at"]),
        ],
    ),
    TriggerProviderDef(
        id="dropbox", name="Dropbox", category="storage", auth_type="oauth",
        events=[
            TriggerEventDef("file_created",  "File Created",  "New file added to a folder",   ["path", "filename", "size", "modified", "rev", "shared_url"]),
            TriggerEventDef("file_modified", "File Modified", "Existing file modified",        ["path", "filename", "size", "modified", "rev"]),
        ],
    ),
    TriggerProviderDef(
        id="onedrive", name="OneDrive", category="storage", auth_type="oauth",
        events=[
            TriggerEventDef("file_created",  "File Created",  "New file uploaded",             ["file_id", "filename", "size", "created_by", "parent_folder", "web_url"]),
            TriggerEventDef("file_modified", "File Modified", "File edited or updated",        ["file_id", "filename", "modified_by", "modified_at", "web_url"]),
        ],
    ),

    # ── Development ───────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="github", name="GitHub", category="development", auth_type="webhook",
        events=[
            TriggerEventDef("push",                  "Push",                  "Code pushed to a branch",    ["repository", "branch", "pusher", "commit_sha", "commit_message", "commits_count", "compare_url"]),
            TriggerEventDef("pull_request_opened",   "Pull Request Opened",   "New PR created",             ["repository", "pr_number", "title", "author", "base_branch", "head_branch", "pr_url"]),
            TriggerEventDef("pull_request_merged",   "Pull Request Merged",   "PR merged",                  ["repository", "pr_number", "title", "author", "merged_by", "base_branch", "merged_at"]),
            TriggerEventDef("issue_created",         "Issue Created",         "New issue opened",           ["repository", "issue_number", "title", "body", "author", "labels", "issue_url"]),
            TriggerEventDef("issue_closed",          "Issue Closed",          "Issue closed",               ["repository", "issue_number", "title", "closed_by", "closed_at"]),
            TriggerEventDef("release_published",     "Release Published",     "New release published",      ["repository", "tag_name", "release_name", "body", "author", "published_at", "release_url"]),
        ],
    ),
    TriggerProviderDef(
        id="gitlab", name="GitLab", category="development", auth_type="webhook",
        events=[
            TriggerEventDef("push",                  "Push",                  "Code pushed to branch",       ["project", "branch", "user", "commit_sha", "commit_message"]),
            TriggerEventDef("merge_request_opened",  "Merge Request Opened",  "New MR created",              ["project", "mr_id", "title", "author", "source_branch", "target_branch", "url"]),
            TriggerEventDef("pipeline_succeeded",    "Pipeline Succeeded",    "CI pipeline succeeds",        ["project", "pipeline_id", "branch", "triggered_by", "duration_s", "web_url"]),
            TriggerEventDef("pipeline_failed",       "Pipeline Failed",       "CI pipeline fails",           ["project", "pipeline_id", "branch", "triggered_by", "error", "web_url"]),
        ],
    ),

    # ── Payments ──────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="stripe", name="Stripe", category="payments", auth_type="webhook",
        events=[
            TriggerEventDef("payment_succeeded",     "Payment Succeeded",     "Charge captured",             ["payment_intent_id", "amount", "currency", "customer_email", "customer_id", "description", "receipt_url"]),
            TriggerEventDef("payment_failed",        "Payment Failed",        "Charge attempt failed",       ["payment_intent_id", "amount", "currency", "customer_email", "error_code", "error_message"]),
            TriggerEventDef("subscription_created",  "Subscription Created",  "New subscription starts",     ["subscription_id", "customer_email", "plan_id", "plan_name", "amount", "currency", "interval", "started_at"]),
            TriggerEventDef("subscription_cancelled","Subscription Cancelled","Subscription cancelled",      ["subscription_id", "customer_email", "plan_name", "cancelled_at", "cancel_reason"]),
            TriggerEventDef("refund_created",        "Refund Created",        "Refund issued",               ["refund_id", "charge_id", "amount", "currency", "reason", "customer_email"]),
        ],
    ),
    TriggerProviderDef(
        id="mpesa", name="M-Pesa", category="payments", auth_type="webhook",
        events=[
            TriggerEventDef("payment_received", "Payment Received", "STK push payment confirmed", ["receipt", "amount", "phone", "transaction_date", "result_code", "success"]),
            TriggerEventDef("payment_failed",   "Payment Failed",   "STK push payment rejected",  ["result_code", "result_desc", "phone", "amount"]),
        ],
    ),

    # ── Databases ─────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="airtable", name="Airtable", category="database", auth_type="api_key",
        events=[
            TriggerEventDef("record_created", "Record Created", "New record in a table", ["record_id", "table", "fields", "created_time"]),
            TriggerEventDef("record_updated", "Record Updated", "Existing record changed",["record_id", "table", "fields", "changed_fields", "updated_time"]),
            TriggerEventDef("record_deleted", "Record Deleted", "Record deleted",         ["record_id", "table", "deleted_at"]),
        ],
    ),
    TriggerProviderDef(
        id="google-sheets", name="Google Sheets", category="database", auth_type="oauth",
        events=[
            TriggerEventDef("row_created",  "Row Created",  "New row appended",   ["spreadsheet_id", "sheet_name", "row_number", "values", "appended_at"]),
            TriggerEventDef("cell_updated", "Cell Updated", "Cell value changes", ["spreadsheet_id", "sheet_name", "range", "old_value", "new_value", "updated_at"]),
        ],
    ),
    TriggerProviderDef(
        id="postgresql", name="PostgreSQL", category="database", auth_type="service_account",
        events=[
            TriggerEventDef("record_inserted", "Row Inserted", "New row inserted",       ["table", "schema", "row", "timestamp"]),
            TriggerEventDef("record_updated",  "Row Updated",  "Existing row modified",  ["table", "schema", "old_row", "new_row", "timestamp"]),
            TriggerEventDef("record_deleted",  "Row Deleted",  "Row removed",            ["table", "schema", "old_row", "timestamp"]),
        ],
    ),
    TriggerProviderDef(
        id="mongodb", name="MongoDB", category="database", auth_type="api_key",
        events=[
            TriggerEventDef("document_created", "Document Created", "New document inserted",  ["database", "collection", "document_id", "document", "timestamp"]),
            TriggerEventDef("document_updated", "Document Updated", "Document modified",      ["database", "collection", "document_id", "update", "timestamp"]),
            TriggerEventDef("document_deleted", "Document Deleted", "Document removed",       ["database", "collection", "document_id", "timestamp"]),
        ],
    ),

    # ── Forms ─────────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="typeform", name="Typeform", category="forms", auth_type="webhook",
        events=[
            TriggerEventDef("form_submitted", "Form Submitted", "Respondent completes a form", ["form_id", "form_name", "response_id", "answers", "submitted_at", "respondent_email"]),
        ],
    ),
    TriggerProviderDef(
        id="google-forms", name="Google Forms", category="forms", auth_type="oauth",
        events=[
            TriggerEventDef("form_submitted", "Form Submitted", "Response submitted to Google Form", ["form_id", "form_title", "response_id", "answers", "submitted_at"]),
        ],
    ),
    TriggerProviderDef(
        id="framer", name="Framer", category="forms", auth_type="webhook",
        events=[
            TriggerEventDef("form_submitted", "Form Submitted", "Framer project form submitted", ["form_id", "fields", "page_url", "submitted_at"]),
        ],
    ),

    # ── Project Management ────────────────────────────────────────────────────
    TriggerProviderDef(
        id="jira", name="Jira", category="project", auth_type="oauth",
        events=[
            TriggerEventDef("issue_created", "Issue Created", "New Jira issue",        ["issue_key", "summary", "description", "issue_type", "priority", "assignee", "project", "created_at"]),
            TriggerEventDef("issue_updated", "Issue Updated", "Issue status changes",  ["issue_key", "summary", "old_status", "new_status", "changed_by", "updated_at"]),
            TriggerEventDef("sprint_started","Sprint Started","Sprint becomes active", ["sprint_id", "sprint_name", "board", "start_date", "end_date", "goal"]),
        ],
    ),
    TriggerProviderDef(
        id="asana", name="Asana", category="project", auth_type="oauth",
        events=[
            TriggerEventDef("task_created",    "Task Created",    "New task in project",         ["task_id", "name", "notes", "project", "assignee", "due_date", "created_at"]),
            TriggerEventDef("task_completed",  "Task Completed",  "Task marked complete",        ["task_id", "name", "project", "completed_by", "completed_at"]),
            TriggerEventDef("project_created", "Project Created", "New project in workspace",    ["project_id", "name", "owner", "team", "created_at"]),
        ],
    ),
    TriggerProviderDef(
        id="linear", name="Linear", category="project", auth_type="webhook",
        events=[
            TriggerEventDef("issue_created", "Issue Created", "New Linear issue",       ["id", "title", "description", "team", "state", "priority", "assignee", "created_at"]),
            TriggerEventDef("issue_updated", "Issue Updated", "Issue state changes",    ["id", "title", "old_state", "new_state", "updated_by", "updated_at"]),
        ],
    ),
    TriggerProviderDef(
        id="trello", name="Trello", category="project", auth_type="api_key",
        events=[
            TriggerEventDef("card_created", "Card Created", "New card on board",        ["card_id", "name", "description", "list", "board", "created_by", "created_at"]),
            TriggerEventDef("card_moved",   "Card Moved",   "Card moved to new list",   ["card_id", "name", "from_list", "to_list", "board", "moved_by"]),
        ],
    ),

    # ── Support ───────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="zendesk", name="Zendesk", category="support", auth_type="api_key",
        events=[
            TriggerEventDef("ticket_created",  "Ticket Created",  "New ticket opened",   ["ticket_id", "subject", "description", "requester_email", "priority", "status", "tags", "created_at"]),
            TriggerEventDef("ticket_updated",  "Ticket Updated",  "Ticket status changes",["ticket_id", "subject", "old_status", "new_status", "updated_by", "updated_at"]),
            TriggerEventDef("ticket_resolved", "Ticket Resolved", "Ticket solved",       ["ticket_id", "subject", "requester_email", "resolved_by", "resolved_at", "satisfaction"]),
        ],
    ),
    TriggerProviderDef(
        id="intercom", name="Intercom", category="support", auth_type="oauth",
        events=[
            TriggerEventDef("conversation_created",  "Conversation Created",  "User starts conversation",    ["conversation_id", "user_email", "body", "source", "created_at"]),
            TriggerEventDef("conversation_assigned", "Conversation Assigned", "Conversation assigned",       ["conversation_id", "assigned_to", "assigned_by", "user_email", "assigned_at"]),
        ],
    ),
    TriggerProviderDef(
        id="docusign", name="DocuSign", category="support", auth_type="oauth",
        events=[
            TriggerEventDef("envelope_signed", "Envelope Signed", "All signers completed", ["envelope_id", "subject", "sender", "signers", "completed_at", "status"]),
            TriggerEventDef("envelope_voided", "Envelope Voided", "Envelope voided",       ["envelope_id", "subject", "sender", "voided_reason", "voided_at"]),
        ],
    ),

    # ── Cloud ─────────────────────────────────────────────────────────────────
    TriggerProviderDef(
        id="aws", name="AWS", category="cloud", auth_type="service_account",
        events=[
            TriggerEventDef("s3_object_created", "S3 Object Created",    "Object uploaded to S3",          ["bucket", "key", "size", "etag", "content_type", "event_time"]),
            TriggerEventDef("sns_notification",  "SNS Notification",     "Message published to SNS topic", ["topic_arn", "message_id", "subject", "message", "timestamp"]),
            TriggerEventDef("eventbridge_event", "EventBridge Event",    "EventBridge rule fires",         ["source", "detail_type", "detail", "region", "account", "timestamp"]),
        ],
    ),
    TriggerProviderDef(
        id="azure", name="Azure", category="cloud", auth_type="service_account",
        events=[
            TriggerEventDef("blob_created",      "Blob Created",      "Blob uploaded to Azure Storage", ["container", "blob_name", "content_type", "length", "url", "created_at"]),
            TriggerEventDef("event_grid_event",  "Event Grid Event",  "Event Grid subscription fires",  ["topic", "event_type", "subject", "data", "event_time"]),
        ],
    ),
]

# Indexed for O(1) lookup
_PROVIDER_INDEX: dict[str, TriggerProviderDef] = {p.id: p for p in PROVIDERS}
_EVENT_INDEX: dict[tuple[str, str], TriggerEventDef] = {
    (p.id, e.id): e
    for p in PROVIDERS
    for e in p.events
}


def get_provider(provider_id: str) -> TriggerProviderDef | None:
    return _PROVIDER_INDEX.get(provider_id)


def get_event(provider_id: str, event_id: str) -> TriggerEventDef | None:
    return _EVENT_INDEX.get((provider_id, event_id))


def list_provider_ids() -> list[str]:
    return list(_PROVIDER_INDEX.keys())


def registry_json() -> list[dict]:
    """Serializable registry for the /v1/integrations/registry endpoint."""
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "auth_type": p.auth_type,
            "events": [
                {
                    "id": e.id,
                    "label": e.label,
                    "description": e.description,
                    "output_fields": e.output_fields,
                }
                for e in p.events
            ],
        }
        for p in PROVIDERS
    ]
