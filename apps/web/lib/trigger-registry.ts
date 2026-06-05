/**
 * Universal Integration Trigger Registry
 *
 * Single source of truth for every integration provider and the events they
 * can fire.  Both the Trigger Builder UI and the backend routing engine read
 * from equivalent copies of this registry so provider-specific logic stays
 * isolated here and never leaks into the workflow engine.
 */

export type TriggerCategory =
  | 'communication'
  | 'crm'
  | 'storage'
  | 'development'
  | 'payments'
  | 'database'
  | 'forms'
  | 'project'
  | 'support'
  | 'ai'
  | 'cloud';

export interface TriggerFilterDef {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'select';
  options?: string[];
}

export interface TriggerEventDef {
  id: string;
  label: string;
  description: string;
  /** Fields available downstream as {{state.event.<field>}} */
  outputFields: string[];
  filters?: TriggerFilterDef[];
}

export interface TriggerProviderDef {
  id: string;
  name: string;
  category: TriggerCategory;
  description: string;
  /** How this provider authenticates */
  authType: 'oauth' | 'api_key' | 'webhook' | 'service_account';
  /** Maps to an IntegrationId for providers with react-icons entries */
  integrationId?: string;
  /** Fallback: letter badge color class */
  letterBg?: string;
  /** Fallback: letter to display */
  letter?: string;
  events: TriggerEventDef[];
}

export const TRIGGER_CATEGORIES: { id: TriggerCategory; label: string }[] = [
  { id: 'communication', label: 'Communication'   },
  { id: 'crm',           label: 'CRM'              },
  { id: 'storage',       label: 'Storage & Docs'   },
  { id: 'development',   label: 'Development'      },
  { id: 'payments',      label: 'Payments'         },
  { id: 'database',      label: 'Databases'        },
  { id: 'forms',         label: 'Forms & Surveys'  },
  { id: 'project',       label: 'Project Mgmt'     },
  { id: 'support',       label: 'Support'          },
  { id: 'cloud',         label: 'Cloud & DevOps'   },
];

export const TRIGGER_PROVIDERS: TriggerProviderDef[] = [
  // ── Communication ───────────────────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Trigger on Slack messages, channel events, and reactions',
    authType: 'oauth',
    integrationId: 'slack',
    events: [
      {
        id: 'message_received',
        label: 'Message Received',
        description: 'A new message is posted in a channel or DM',
        outputFields: ['channel', 'user', 'text', 'timestamp', 'thread_ts'],
        filters: [
          { key: 'channel', label: 'Channel name', placeholder: '#general', type: 'text' },
          { key: 'contains', label: 'Message contains', placeholder: 'keyword', type: 'text' },
        ],
      },
      {
        id: 'member_joined_channel',
        label: 'Member Joined Channel',
        description: 'A user joins a Slack channel',
        outputFields: ['channel', 'user', 'inviter', 'timestamp'],
        filters: [
          { key: 'channel', label: 'Channel name', placeholder: '#onboarding', type: 'text' },
        ],
      },
      {
        id: 'file_shared',
        label: 'File Shared',
        description: 'A file is shared in a channel',
        outputFields: ['channel', 'user', 'file_id', 'filename', 'filetype', 'permalink'],
      },
      {
        id: 'reaction_added',
        label: 'Reaction Added',
        description: 'An emoji reaction is added to a message',
        outputFields: ['channel', 'user', 'reaction', 'message_ts'],
        filters: [
          { key: 'reaction', label: 'Reaction emoji', placeholder: 'thumbsup', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'communication',
    description: 'Trigger on Teams messages, meetings, and member events',
    authType: 'oauth',
    letterBg: 'bg-purple-600',
    letter: 'T',
    events: [
      {
        id: 'message_sent',
        label: 'Message Sent',
        description: 'A message is posted in a team channel',
        outputFields: ['team', 'channel', 'user', 'body', 'timestamp'],
        filters: [
          { key: 'team', label: 'Team name', placeholder: 'Engineering', type: 'text' },
          { key: 'channel', label: 'Channel name', placeholder: 'general', type: 'text' },
        ],
      },
      {
        id: 'member_joined_team',
        label: 'Member Joined Team',
        description: 'A user is added to a team',
        outputFields: ['team', 'user', 'added_by', 'timestamp'],
      },
      {
        id: 'meeting_started',
        label: 'Meeting Started',
        description: 'An online meeting begins',
        outputFields: ['meeting_id', 'subject', 'organizer', 'start_time', 'join_url'],
      },
      {
        id: 'channel_created',
        label: 'Channel Created',
        description: 'A new channel is created inside a team',
        outputFields: ['team', 'channel', 'created_by', 'timestamp'],
      },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    description: 'Trigger when emails arrive, are sent, or are labelled',
    authType: 'oauth',
    integrationId: 'gmail',
    events: [
      {
        id: 'email_received',
        label: 'Email Received',
        description: 'A new email arrives in the inbox',
        outputFields: ['from', 'to', 'subject', 'body', 'message_id', 'received_at'],
        filters: [
          { key: 'from', label: 'From address contains', placeholder: 'example.com', type: 'text' },
          { key: 'subject', label: 'Subject contains', placeholder: 'Invoice', type: 'text' },
          { key: 'label', label: 'Has label', placeholder: 'INBOX', type: 'text' },
        ],
      },
      {
        id: 'email_sent',
        label: 'Email Sent',
        description: 'An email is sent from the account',
        outputFields: ['to', 'subject', 'body', 'message_id', 'sent_at'],
      },
      {
        id: 'label_applied',
        label: 'Label Applied',
        description: 'A label is applied to an email',
        outputFields: ['label', 'from', 'subject', 'message_id', 'applied_at'],
        filters: [
          { key: 'label', label: 'Label name', placeholder: 'Important', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'communication',
    description: 'Trigger on incoming WhatsApp messages',
    authType: 'webhook',
    integrationId: 'whatsapp',
    events: [
      {
        id: 'message_received',
        label: 'Message Received',
        description: 'A WhatsApp message arrives from a contact',
        outputFields: ['from', 'body', 'message_id', 'timestamp', 'type'],
        filters: [
          { key: 'type', label: 'Message type', type: 'select', options: ['text', 'image', 'audio', 'document', 'any'] },
        ],
      },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'communication',
    description: 'Trigger on Telegram bot messages and commands',
    authType: 'api_key',
    letterBg: 'bg-sky-500',
    letter: 'T',
    events: [
      {
        id: 'message_received',
        label: 'Message Received',
        description: 'A message is sent to your bot',
        outputFields: ['chat_id', 'user', 'text', 'message_id', 'date'],
        filters: [
          { key: 'command', label: 'Starts with command', placeholder: '/start', type: 'text' },
        ],
      },
      {
        id: 'callback_query',
        label: 'Button Clicked',
        description: 'User taps an inline keyboard button',
        outputFields: ['chat_id', 'user', 'data', 'message_id'],
      },
    ],
  },

  // ── CRM ─────────────────────────────────────────────────────────────────────
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Trigger on leads, contacts, and opportunity events',
    authType: 'oauth',
    letterBg: 'bg-blue-500',
    letter: 'S',
    events: [
      {
        id: 'lead_created',
        label: 'Lead Created',
        description: 'A new lead is added to Salesforce',
        outputFields: ['id', 'name', 'email', 'company', 'phone', 'source', 'created_at'],
      },
      {
        id: 'opportunity_won',
        label: 'Opportunity Won',
        description: 'An opportunity stage changes to Closed Won',
        outputFields: ['id', 'name', 'account', 'amount', 'close_date', 'owner'],
      },
      {
        id: 'contact_created',
        label: 'Contact Created',
        description: 'A new contact is added',
        outputFields: ['id', 'first_name', 'last_name', 'email', 'phone', 'account'],
      },
      {
        id: 'case_created',
        label: 'Case Created',
        description: 'A new support case is opened',
        outputFields: ['id', 'subject', 'description', 'contact', 'priority', 'status'],
        filters: [
          { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low', 'Any'] },
        ],
      },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Trigger on contacts, deals, and form submissions',
    authType: 'oauth',
    letterBg: 'bg-orange-500',
    letter: 'H',
    events: [
      {
        id: 'contact_created',
        label: 'Contact Created',
        description: 'A new contact is added to HubSpot',
        outputFields: ['id', 'email', 'firstname', 'lastname', 'phone', 'company'],
      },
      {
        id: 'deal_won',
        label: 'Deal Closed Won',
        description: 'A deal pipeline stage changes to Closed Won',
        outputFields: ['id', 'dealname', 'amount', 'close_date', 'owner', 'pipeline'],
      },
      {
        id: 'form_submitted',
        label: 'Form Submitted',
        description: 'A HubSpot form is submitted',
        outputFields: ['form_id', 'form_name', 'contact_email', 'fields', 'page_url', 'submitted_at'],
        filters: [
          { key: 'form_id', label: 'Form ID', placeholder: 'abc123', type: 'text' },
        ],
      },
      {
        id: 'email_opened',
        label: 'Email Opened',
        description: 'A marketing email is opened by a contact',
        outputFields: ['contact_email', 'email_subject', 'opened_at', 'campaign_id'],
      },
    ],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'crm',
    description: 'Trigger on deals, persons, and activities',
    authType: 'api_key',
    letterBg: 'bg-green-600',
    letter: 'P',
    events: [
      {
        id: 'deal_created',
        label: 'Deal Created',
        description: 'A new deal is added to the pipeline',
        outputFields: ['id', 'title', 'value', 'currency', 'status', 'owner', 'stage'],
      },
      {
        id: 'deal_won',
        label: 'Deal Won',
        description: 'A deal is marked as won',
        outputFields: ['id', 'title', 'value', 'currency', 'owner', 'closed_at'],
      },
      {
        id: 'person_created',
        label: 'Person Created',
        description: 'A new person/contact is created',
        outputFields: ['id', 'name', 'email', 'phone', 'org_name', 'owner'],
      },
    ],
  },

  // ── Storage & Docs ───────────────────────────────────────────────────────────
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'storage',
    description: 'Trigger when files and folders change in Drive',
    authType: 'oauth',
    integrationId: 'google-drive',
    events: [
      {
        id: 'file_created',
        label: 'File Created',
        description: 'A new file is created or uploaded',
        outputFields: ['file_id', 'filename', 'mime_type', 'owner', 'folder', 'created_at', 'web_url'],
        filters: [
          { key: 'folder_id', label: 'Folder ID', placeholder: 'Drive folder ID', type: 'text' },
          { key: 'mime_type', label: 'File type', type: 'select', options: ['Any', 'application/pdf', 'image/*', 'text/*', 'application/vnd.google-apps.spreadsheet'] },
        ],
      },
      {
        id: 'file_modified',
        label: 'File Modified',
        description: 'An existing file is updated',
        outputFields: ['file_id', 'filename', 'mime_type', 'modified_by', 'modified_at', 'web_url'],
        filters: [
          { key: 'folder_id', label: 'Folder ID', placeholder: 'Drive folder ID', type: 'text' },
        ],
      },
      {
        id: 'file_shared',
        label: 'File Shared',
        description: 'A file or folder is shared with a new user',
        outputFields: ['file_id', 'filename', 'shared_with', 'role', 'shared_at'],
      },
      {
        id: 'folder_created',
        label: 'Folder Created',
        description: 'A new folder is created',
        outputFields: ['folder_id', 'folder_name', 'parent_folder', 'owner', 'created_at'],
      },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'storage',
    description: 'Trigger on file changes in Dropbox',
    authType: 'oauth',
    letterBg: 'bg-blue-600',
    letter: 'D',
    events: [
      {
        id: 'file_created',
        label: 'File Created',
        description: 'A new file is added to a folder',
        outputFields: ['path', 'filename', 'size', 'modified', 'rev', 'shared_url'],
        filters: [
          { key: 'path', label: 'Watch path', placeholder: '/reports', type: 'text' },
        ],
      },
      {
        id: 'file_modified',
        label: 'File Modified',
        description: 'An existing file is modified',
        outputFields: ['path', 'filename', 'size', 'modified', 'rev'],
        filters: [
          { key: 'path', label: 'Watch path', placeholder: '/reports', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'storage',
    description: 'Trigger on file changes in OneDrive or SharePoint',
    authType: 'oauth',
    letterBg: 'bg-blue-700',
    letter: 'O',
    events: [
      {
        id: 'file_created',
        label: 'File Created',
        description: 'A new file is uploaded',
        outputFields: ['file_id', 'filename', 'size', 'created_by', 'parent_folder', 'web_url'],
        filters: [
          { key: 'folder', label: 'Watch folder', placeholder: 'Documents', type: 'text' },
        ],
      },
      {
        id: 'file_modified',
        label: 'File Modified',
        description: 'A file is edited or updated',
        outputFields: ['file_id', 'filename', 'modified_by', 'modified_at', 'web_url'],
      },
    ],
  },

  // ── Development ──────────────────────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    description: 'Trigger on pushes, pull requests, issues, and releases',
    authType: 'webhook',
    letterBg: 'bg-gray-900',
    letter: 'G',
    events: [
      {
        id: 'push',
        label: 'Push',
        description: 'Code is pushed to a branch',
        outputFields: ['repository', 'branch', 'pusher', 'commit_sha', 'commit_message', 'commits_count', 'compare_url'],
        filters: [
          { key: 'branch', label: 'Branch name', placeholder: 'main', type: 'text' },
        ],
      },
      {
        id: 'pull_request_opened',
        label: 'Pull Request Opened',
        description: 'A new pull request is created',
        outputFields: ['repository', 'pr_number', 'title', 'author', 'base_branch', 'head_branch', 'pr_url'],
      },
      {
        id: 'pull_request_merged',
        label: 'Pull Request Merged',
        description: 'A pull request is merged',
        outputFields: ['repository', 'pr_number', 'title', 'author', 'merged_by', 'base_branch', 'merged_at'],
      },
      {
        id: 'issue_created',
        label: 'Issue Created',
        description: 'A new issue is opened',
        outputFields: ['repository', 'issue_number', 'title', 'body', 'author', 'labels', 'issue_url'],
        filters: [
          { key: 'label', label: 'Has label', placeholder: 'bug', type: 'text' },
        ],
      },
      {
        id: 'issue_closed',
        label: 'Issue Closed',
        description: 'An issue is closed',
        outputFields: ['repository', 'issue_number', 'title', 'closed_by', 'closed_at'],
      },
      {
        id: 'release_published',
        label: 'Release Published',
        description: 'A release is published',
        outputFields: ['repository', 'tag_name', 'release_name', 'body', 'author', 'published_at', 'release_url'],
      },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'development',
    description: 'Trigger on GitLab push, MR, and pipeline events',
    authType: 'webhook',
    letterBg: 'bg-orange-600',
    letter: 'G',
    events: [
      {
        id: 'push',
        label: 'Push',
        description: 'Code pushed to a branch',
        outputFields: ['project', 'branch', 'user', 'commit_sha', 'commit_message'],
        filters: [
          { key: 'branch', label: 'Branch', placeholder: 'main', type: 'text' },
        ],
      },
      {
        id: 'merge_request_opened',
        label: 'Merge Request Opened',
        description: 'A new merge request is created',
        outputFields: ['project', 'mr_id', 'title', 'author', 'source_branch', 'target_branch', 'url'],
      },
      {
        id: 'pipeline_succeeded',
        label: 'Pipeline Succeeded',
        description: 'A CI/CD pipeline completes successfully',
        outputFields: ['project', 'pipeline_id', 'branch', 'triggered_by', 'duration_s', 'web_url'],
      },
      {
        id: 'pipeline_failed',
        label: 'Pipeline Failed',
        description: 'A CI/CD pipeline fails',
        outputFields: ['project', 'pipeline_id', 'branch', 'triggered_by', 'error', 'web_url'],
      },
    ],
  },

  // ── Payments ─────────────────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Trigger on payments, subscriptions, and refunds',
    authType: 'webhook',
    letterBg: 'bg-violet-600',
    letter: 'S',
    events: [
      {
        id: 'payment_succeeded',
        label: 'Payment Succeeded',
        description: 'A charge is successfully captured',
        outputFields: ['payment_intent_id', 'amount', 'currency', 'customer_email', 'customer_id', 'description', 'receipt_url'],
      },
      {
        id: 'payment_failed',
        label: 'Payment Failed',
        description: 'A charge attempt fails',
        outputFields: ['payment_intent_id', 'amount', 'currency', 'customer_email', 'error_code', 'error_message'],
      },
      {
        id: 'subscription_created',
        label: 'Subscription Created',
        description: 'A new subscription starts',
        outputFields: ['subscription_id', 'customer_email', 'plan_id', 'plan_name', 'amount', 'currency', 'interval', 'started_at'],
      },
      {
        id: 'subscription_cancelled',
        label: 'Subscription Cancelled',
        description: 'A subscription is cancelled',
        outputFields: ['subscription_id', 'customer_email', 'plan_name', 'cancelled_at', 'cancel_reason'],
      },
      {
        id: 'refund_created',
        label: 'Refund Created',
        description: 'A refund is issued',
        outputFields: ['refund_id', 'charge_id', 'amount', 'currency', 'reason', 'customer_email'],
      },
    ],
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    category: 'payments',
    description: 'Trigger on M-Pesa STK push callbacks',
    authType: 'webhook',
    integrationId: 'mpesa',
    events: [
      {
        id: 'payment_received',
        label: 'Payment Received',
        description: 'An STK push payment is confirmed',
        outputFields: ['receipt', 'amount', 'phone', 'transaction_date', 'result_code', 'success'],
      },
      {
        id: 'payment_failed',
        label: 'Payment Failed',
        description: 'An STK push payment is rejected',
        outputFields: ['result_code', 'result_desc', 'phone', 'amount'],
      },
    ],
  },

  // ── Databases ────────────────────────────────────────────────────────────────
  {
    id: 'airtable',
    name: 'Airtable',
    category: 'database',
    description: 'Trigger when records are created or updated in a base',
    authType: 'api_key',
    letterBg: 'bg-amber-400',
    letter: 'A',
    events: [
      {
        id: 'record_created',
        label: 'Record Created',
        description: 'A new row is added to a table',
        outputFields: ['record_id', 'table', 'fields', 'created_time'],
        filters: [
          { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXX', type: 'text' },
          { key: 'table', label: 'Table name', placeholder: 'Leads', type: 'text' },
        ],
      },
      {
        id: 'record_updated',
        label: 'Record Updated',
        description: 'An existing record is modified',
        outputFields: ['record_id', 'table', 'fields', 'changed_fields', 'updated_time'],
        filters: [
          { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXX', type: 'text' },
          { key: 'table', label: 'Table name', placeholder: 'Leads', type: 'text' },
        ],
      },
      {
        id: 'record_deleted',
        label: 'Record Deleted',
        description: 'A record is deleted from a table',
        outputFields: ['record_id', 'table', 'deleted_at'],
      },
    ],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    category: 'database',
    description: 'Trigger when rows are added or changed in a spreadsheet',
    authType: 'oauth',
    letterBg: 'bg-green-500',
    letter: 'S',
    events: [
      {
        id: 'row_created',
        label: 'Row Created',
        description: 'A new row is appended to a sheet',
        outputFields: ['spreadsheet_id', 'sheet_name', 'row_number', 'values', 'appended_at'],
        filters: [
          { key: 'sheet_name', label: 'Sheet name', placeholder: 'Sheet1', type: 'text' },
        ],
      },
      {
        id: 'cell_updated',
        label: 'Cell Updated',
        description: 'A cell value changes',
        outputFields: ['spreadsheet_id', 'sheet_name', 'range', 'old_value', 'new_value', 'updated_at'],
      },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    description: 'Trigger on database row inserts, updates, and deletes',
    authType: 'service_account',
    letterBg: 'bg-blue-800',
    letter: 'P',
    events: [
      {
        id: 'record_inserted',
        label: 'Row Inserted',
        description: 'A new row is inserted into a table',
        outputFields: ['table', 'schema', 'row', 'timestamp'],
        filters: [
          { key: 'table', label: 'Table name', placeholder: 'users', type: 'text' },
          { key: 'schema', label: 'Schema', placeholder: 'public', type: 'text' },
        ],
      },
      {
        id: 'record_updated',
        label: 'Row Updated',
        description: 'An existing row is modified',
        outputFields: ['table', 'schema', 'old_row', 'new_row', 'timestamp'],
        filters: [
          { key: 'table', label: 'Table name', placeholder: 'orders', type: 'text' },
        ],
      },
      {
        id: 'record_deleted',
        label: 'Row Deleted',
        description: 'A row is removed from a table',
        outputFields: ['table', 'schema', 'old_row', 'timestamp'],
        filters: [
          { key: 'table', label: 'Table name', placeholder: 'sessions', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    description: 'Trigger on document create, update, and delete events',
    authType: 'api_key',
    letterBg: 'bg-green-700',
    letter: 'M',
    events: [
      {
        id: 'document_created',
        label: 'Document Created',
        description: 'A new document is inserted into a collection',
        outputFields: ['database', 'collection', 'document_id', 'document', 'timestamp'],
        filters: [
          { key: 'collection', label: 'Collection', placeholder: 'orders', type: 'text' },
        ],
      },
      {
        id: 'document_updated',
        label: 'Document Updated',
        description: 'An existing document is modified',
        outputFields: ['database', 'collection', 'document_id', 'update', 'timestamp'],
        filters: [
          { key: 'collection', label: 'Collection', placeholder: 'orders', type: 'text' },
        ],
      },
      {
        id: 'document_deleted',
        label: 'Document Deleted',
        description: 'A document is removed from a collection',
        outputFields: ['database', 'collection', 'document_id', 'timestamp'],
      },
    ],
  },

  // ── Forms & Surveys ──────────────────────────────────────────────────────────
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'forms',
    description: 'Trigger when a form response is submitted',
    authType: 'webhook',
    letterBg: 'bg-orange-500',
    letter: 'T',
    events: [
      {
        id: 'form_submitted',
        label: 'Form Submitted',
        description: 'A respondent completes and submits a form',
        outputFields: ['form_id', 'form_name', 'response_id', 'answers', 'submitted_at', 'respondent_email'],
        filters: [
          { key: 'form_id', label: 'Form ID', placeholder: 'abc123', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'google-forms',
    name: 'Google Forms',
    category: 'forms',
    description: 'Trigger when a Google Form receives a response',
    authType: 'oauth',
    integrationId: 'google',
    events: [
      {
        id: 'form_submitted',
        label: 'Form Submitted',
        description: 'A response is submitted to a Google Form',
        outputFields: ['form_id', 'form_title', 'response_id', 'answers', 'submitted_at'],
        filters: [
          { key: 'form_id', label: 'Form ID', placeholder: 'Google Form ID', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'forms',
    description: 'Trigger on Framer form submissions',
    authType: 'webhook',
    letterBg: 'bg-blue-600',
    letter: 'F',
    events: [
      {
        id: 'form_submitted',
        label: 'Form Submitted',
        description: 'A form on a Framer project is submitted',
        outputFields: ['form_id', 'fields', 'page_url', 'submitted_at'],
      },
    ],
  },

  // ── Project Management ───────────────────────────────────────────────────────
  {
    id: 'jira',
    name: 'Jira',
    category: 'project',
    description: 'Trigger on issue, sprint, and project events',
    authType: 'oauth',
    letterBg: 'bg-blue-600',
    letter: 'J',
    events: [
      {
        id: 'issue_created',
        label: 'Issue Created',
        description: 'A new Jira issue is created',
        outputFields: ['issue_key', 'summary', 'description', 'issue_type', 'priority', 'assignee', 'project', 'created_at'],
        filters: [
          { key: 'project', label: 'Project key', placeholder: 'ENG', type: 'text' },
          { key: 'issue_type', label: 'Issue type', type: 'select', options: ['Any', 'Bug', 'Story', 'Task', 'Epic'] },
        ],
      },
      {
        id: 'issue_updated',
        label: 'Issue Updated',
        description: 'A Jira issue status or field changes',
        outputFields: ['issue_key', 'summary', 'old_status', 'new_status', 'changed_by', 'updated_at'],
      },
      {
        id: 'sprint_started',
        label: 'Sprint Started',
        description: 'A sprint becomes active',
        outputFields: ['sprint_id', 'sprint_name', 'board', 'start_date', 'end_date', 'goal'],
      },
    ],
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'project',
    description: 'Trigger on task and project events',
    authType: 'oauth',
    letterBg: 'bg-red-400',
    letter: 'A',
    events: [
      {
        id: 'task_created',
        label: 'Task Created',
        description: 'A new task is added to a project',
        outputFields: ['task_id', 'name', 'notes', 'project', 'assignee', 'due_date', 'created_at'],
        filters: [
          { key: 'project', label: 'Project name', placeholder: 'Marketing', type: 'text' },
        ],
      },
      {
        id: 'task_completed',
        label: 'Task Completed',
        description: 'A task is marked as complete',
        outputFields: ['task_id', 'name', 'project', 'completed_by', 'completed_at'],
      },
      {
        id: 'project_created',
        label: 'Project Created',
        description: 'A new project is created in a workspace',
        outputFields: ['project_id', 'name', 'owner', 'team', 'created_at'],
      },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'project',
    description: 'Trigger on Linear issue and cycle events',
    authType: 'webhook',
    letterBg: 'bg-violet-700',
    letter: 'L',
    events: [
      {
        id: 'issue_created',
        label: 'Issue Created',
        description: 'A new issue is created in a team',
        outputFields: ['id', 'title', 'description', 'team', 'state', 'priority', 'assignee', 'created_at'],
        filters: [
          { key: 'team', label: 'Team name', placeholder: 'Engineering', type: 'text' },
        ],
      },
      {
        id: 'issue_updated',
        label: 'Issue Updated',
        description: 'An issue status or field changes',
        outputFields: ['id', 'title', 'old_state', 'new_state', 'updated_by', 'updated_at'],
      },
    ],
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'project',
    description: 'Trigger on card, list, and board events',
    authType: 'api_key',
    letterBg: 'bg-blue-500',
    letter: 'T',
    events: [
      {
        id: 'card_created',
        label: 'Card Created',
        description: 'A new card is added to a board',
        outputFields: ['card_id', 'name', 'description', 'list', 'board', 'created_by', 'created_at'],
        filters: [
          { key: 'board', label: 'Board name', placeholder: 'Roadmap', type: 'text' },
        ],
      },
      {
        id: 'card_moved',
        label: 'Card Moved',
        description: 'A card is moved from one list to another',
        outputFields: ['card_id', 'name', 'from_list', 'to_list', 'board', 'moved_by'],
        filters: [
          { key: 'to_list', label: 'Moved to list', placeholder: 'Done', type: 'text' },
        ],
      },
    ],
  },

  // ── Support ──────────────────────────────────────────────────────────────────
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'support',
    description: 'Trigger on ticket create, update, and resolve events',
    authType: 'api_key',
    letterBg: 'bg-green-600',
    letter: 'Z',
    events: [
      {
        id: 'ticket_created',
        label: 'Ticket Created',
        description: 'A new support ticket is opened',
        outputFields: ['ticket_id', 'subject', 'description', 'requester_email', 'priority', 'status', 'tags', 'created_at'],
        filters: [
          { key: 'priority', label: 'Priority', type: 'select', options: ['Any', 'urgent', 'high', 'normal', 'low'] },
        ],
      },
      {
        id: 'ticket_updated',
        label: 'Ticket Updated',
        description: 'A ticket status or assignee changes',
        outputFields: ['ticket_id', 'subject', 'old_status', 'new_status', 'updated_by', 'updated_at'],
      },
      {
        id: 'ticket_resolved',
        label: 'Ticket Resolved',
        description: 'A ticket is marked as solved',
        outputFields: ['ticket_id', 'subject', 'requester_email', 'resolved_by', 'resolved_at', 'satisfaction'],
      },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'support',
    description: 'Trigger on conversation and contact events',
    authType: 'oauth',
    letterBg: 'bg-blue-500',
    letter: 'I',
    events: [
      {
        id: 'conversation_created',
        label: 'Conversation Created',
        description: 'A user starts a new conversation',
        outputFields: ['conversation_id', 'user_email', 'body', 'source', 'created_at'],
      },
      {
        id: 'conversation_assigned',
        label: 'Conversation Assigned',
        description: 'A conversation is assigned to a teammate',
        outputFields: ['conversation_id', 'assigned_to', 'assigned_by', 'user_email', 'assigned_at'],
      },
    ],
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    category: 'support',
    description: 'Trigger when envelopes are signed or voided',
    authType: 'oauth',
    letterBg: 'bg-indigo-700',
    letter: 'D',
    events: [
      {
        id: 'envelope_signed',
        label: 'Envelope Signed',
        description: 'All signers have completed signing',
        outputFields: ['envelope_id', 'subject', 'sender', 'signers', 'completed_at', 'status'],
        filters: [
          { key: 'template_id', label: 'Template ID', placeholder: 'DocuSign template ID', type: 'text' },
        ],
      },
      {
        id: 'envelope_voided',
        label: 'Envelope Voided',
        description: 'An envelope is voided or declined',
        outputFields: ['envelope_id', 'subject', 'sender', 'voided_reason', 'voided_at'],
      },
    ],
  },

  // ── Cloud & DevOps ───────────────────────────────────────────────────────────
  {
    id: 'aws',
    name: 'AWS',
    category: 'cloud',
    description: 'Trigger on S3, SNS, EventBridge, and Lambda events',
    authType: 'service_account',
    letterBg: 'bg-amber-500',
    letter: 'A',
    events: [
      {
        id: 's3_object_created',
        label: 'S3 Object Created',
        description: 'An object is uploaded to an S3 bucket',
        outputFields: ['bucket', 'key', 'size', 'etag', 'content_type', 'event_time'],
        filters: [
          { key: 'bucket', label: 'Bucket name', placeholder: 'my-bucket', type: 'text' },
          { key: 'prefix', label: 'Key prefix', placeholder: 'uploads/', type: 'text' },
        ],
      },
      {
        id: 'sns_notification',
        label: 'SNS Notification',
        description: 'A message is published to an SNS topic',
        outputFields: ['topic_arn', 'message_id', 'subject', 'message', 'timestamp'],
        filters: [
          { key: 'topic_arn', label: 'Topic ARN', placeholder: 'arn:aws:sns:...', type: 'text' },
        ],
      },
      {
        id: 'eventbridge_event',
        label: 'EventBridge Event',
        description: 'A matching EventBridge rule fires',
        outputFields: ['source', 'detail_type', 'detail', 'region', 'account', 'timestamp'],
        filters: [
          { key: 'source', label: 'Event source', placeholder: 'aws.ec2', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'cloud',
    description: 'Trigger on Azure Blob, Event Grid, and Service Bus events',
    authType: 'service_account',
    letterBg: 'bg-blue-600',
    letter: 'A',
    events: [
      {
        id: 'blob_created',
        label: 'Blob Created',
        description: 'A blob is uploaded to Azure Blob Storage',
        outputFields: ['container', 'blob_name', 'content_type', 'length', 'url', 'created_at'],
        filters: [
          { key: 'container', label: 'Container name', placeholder: 'documents', type: 'text' },
        ],
      },
      {
        id: 'event_grid_event',
        label: 'Event Grid Event',
        description: 'An Event Grid subscription fires',
        outputFields: ['topic', 'event_type', 'subject', 'data', 'event_time'],
        filters: [
          { key: 'event_type', label: 'Event type', placeholder: 'Microsoft.Storage.BlobCreated', type: 'text' },
        ],
      },
    ],
  },
];

/** Get all providers for a given category */
export function getProvidersByCategory(category: TriggerCategory): TriggerProviderDef[] {
  return TRIGGER_PROVIDERS.filter(p => p.category === category);
}

/** Find a provider by id */
export function findProvider(id: string): TriggerProviderDef | undefined {
  return TRIGGER_PROVIDERS.find(p => p.id === id);
}

/** Find an event within a provider */
export function findEvent(providerId: string, eventId: string): TriggerEventDef | undefined {
  return findProvider(providerId)?.events.find(e => e.id === eventId);
}

/** Categories that have at least one provider */
export function activeCategories(): TriggerCategory[] {
  const used = new Set(TRIGGER_PROVIDERS.map(p => p.category));
  return TRIGGER_CATEGORIES.filter(c => used.has(c.id)).map(c => c.id);
}
