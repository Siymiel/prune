// ── Tool Input/Output Schema Definitions ─────────────────────────────────────
//
// HOW TO ADD A NEW ACTION TOOL:
//
//   1. Define its input schema  →  const MY_TOOL_SCHEMA: ToolInputSchema = { fields: [...] }
//   2. Define its output schema →  const MY_TOOL_OUTPUTS: ToolOutputSchema = { fields: [...] }
//   3. Register both in the TOOL_SCHEMAS / TOOL_OUTPUTS maps at the bottom of this file.
//      The key must match the tool.id in PROVIDER_TOOLS (node-detail-panel.tsx).
//
// Field types available for inputs:
//   'string'           plain textarea, or enum dropdown when `options` is provided
//   'number'           numeric input
//   'boolean'          inline on/off toggle
//   'array'            list of strings; or list of objects when `fields` is provided
//   'multiple_select'  checkbox multi-select from a fixed `options` list
//   'select'           single-select from dynamic runtime options (e.g. Slack channels)
//
// Extra InputFieldDef options:
//   required         mark field with a red *
//   default          pre-fill value
//   options          static list of choices (string / multiple_select)
//   fields           sub-field definitions for array-of-objects
//   infoText         blue information banner shown when the row is expanded
//   warningText      amber warning banner shown when the row is expanded
//   switchableTypes  types the user can switch to via the badge (e.g. ['select','string'])

// ── Types ─────────────────────────────────────────────────────────────────────

export type InputFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'multiple_select'
  | 'select';

export interface InputFieldDef {
  key: string;
  label: string;
  type: InputFieldType;
  required?: boolean;
  default?: unknown;
  options?: string[];
  fields?: InputFieldDef[];
  infoText?: string;
  warningText?: string;
  switchableTypes?: string[];
}

export interface ToolInputSchema {
  fields: InputFieldDef[];
}

export type OutputFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'object_array';

export interface OutputFieldDef {
  key: string;
  label: string;
  type: OutputFieldType;
  description: string;
}

export interface ToolOutputSchema {
  fields: OutputFieldDef[];
}

// ── Ahrefs ────────────────────────────────────────────────────────────────────

const AHREFS_COLUMNS = [
  'Ahrefs Rank', 'Backlinks', 'Backlinks Dofollow', 'Backlinks Internal',
  'Backlinks Nofollow', 'Backlinks Redirect', 'Domain Rating', 'Index',
  'Linked Domains', 'Linked Domains Dofollow', 'Linked Domains Gov',
  'Linked Domains Edu', 'Org Keywords', 'Org Traffic', 'Paid Keywords',
  'Paid Traffic', 'Referring Domains', 'Referring Domains Dofollow',
  'Referring IPs', 'Referring Subnets', 'Traffic Value', 'URL Rating',
  'Words', 'Links External', 'Links Internal', 'Nofollow Links',
  'Pages Crawled', 'Pages Indexed', 'Redirects', 'Canonical',
  'Meta Noindex', 'HTTP Code', 'Last Crawl', 'Content Hash', 'Language',
];

const AHREFS_BATCH_SCHEMA: ToolInputSchema = {
  fields: [
    {
      key: 'targets', label: 'Targets', type: 'array', required: true,
      fields: [
        { key: 'url',              label: 'Url',             type: 'string', required: true },
        { key: 'ahrefs_mode',     label: 'AhrefsMode',     type: 'string', options: ['exact', 'prefix', 'domain', 'subdomains'] },
        { key: 'ahrefs_protocol', label: 'AhrefsProtocol', type: 'string', options: ['both', 'https', 'http'] },
      ],
    },
    { key: 'select',      label: 'Columns',     type: 'multiple_select', required: true, options: AHREFS_COLUMNS },
    { key: 'country',     label: 'Country',     type: 'string',          default: 'us' },
    { key: 'volume_mode', label: 'Volume Mode', type: 'string',          options: ['Monthly (default)', 'Average'] },
    { key: 'order_by',    label: 'Order By',    type: 'array' },
  ],
};

const AHREFS_DOMAIN_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'target',   label: 'Target',   type: 'string', required: true },
    { key: 'mode',     label: 'Mode',     type: 'string', options: ['domain', 'subdomains', 'prefix', 'exact'] },
    { key: 'protocol', label: 'Protocol', type: 'string', options: ['both', 'https', 'http'] },
  ],
};

const AHREFS_BATCH_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'targets',   label: 'Targets',   type: 'array',   description: 'Array of target rows with the requested columns.' },
    { key: 'row_count', label: 'Row Count', type: 'integer', description: 'Number of target rows returned.' },
  ],
};

const AHREFS_DOMAIN_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'domain_rating', label: 'Domain Rating', type: 'integer', description: 'Ahrefs Domain Rating for the target.' },
    { key: 'ahrefs_rank',   label: 'Ahrefs Rank',   type: 'integer', description: 'Ahrefs Rank for the target.' },
  ],
};

const AHREFS_BL_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'backlinks',         label: 'Backlinks',         type: 'integer', description: 'Total number of backlinks for the target.' },
    { key: 'referring_domains', label: 'Referring Domains', type: 'integer', description: 'Number of unique referring domains.' },
  ],
};

// ── Slack ─────────────────────────────────────────────────────────────────────

// Reusable channel selector shared across Slack tools
const SLACK_CHANNEL_FIELD: InputFieldDef = {
  key: 'channel_id',
  label: 'Channel Name or ID',
  type: 'select',
  required: true,
  infoText: "To add a channel, open it in Slack, @mention the bot (e.g., @StackAI), then click 'Add to channel'.",
  warningText: 'A connection is required',
  switchableTypes: ['select', 'string'],
};

const SLACK_SEND_MESSAGE_SCHEMA: ToolInputSchema = {
  fields: [
    SLACK_CHANNEL_FIELD,
    { key: 'thread_ts',         label: 'Thread ID to Reply in', type: 'string' },
    { key: 'message_format',    label: 'Message Format',        type: 'string', required: true, options: ['Plain Text', 'Markdown', 'Block Kit'] },
    { key: 'message',           label: 'Message',               type: 'string' },
    { key: 'file_source',       label: 'File Source',           type: 'string', options: ['None', 'URL', 'Base64', 'Text'] },
    { key: 'files',             label: 'Files (Legacy)',         type: 'array' },
    { key: 'make_files_public', label: 'Make Files Public',     type: 'boolean' },
  ],
};

const SLACK_SEND_MESSAGE_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'channel_id',         label: 'Channel ID',         type: 'string',       description: 'Slack channel ID where message was posted' },
    { key: 'status',             label: 'Status',             type: 'string',       description: 'Message delivery status with channel and timestamp details' },
    { key: 'message_ts',         label: 'Message Timestamp',  type: 'string',       description: 'Unique timestamp identifier for the Slack message' },
    { key: 'uploaded_files',     label: 'Uploaded Files',     type: 'object_array', description: 'List of files that were uploaded and shared with the message' },
    { key: 'files_shared_count', label: 'Files Shared Count', type: 'number',       description: 'Number of files shared with the message' },
  ],
};

const SLACK_SEARCH_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'query',     label: 'Query',     type: 'string',          required: true },
    { key: 'channels',  label: 'Channels',  type: 'multiple_select', options: [] },
    { key: 'count',     label: 'Count',     type: 'number',          default: 20 },
    { key: 'sort',      label: 'Sort',      type: 'string',          options: ['timestamp', 'relevance'], default: 'timestamp' },
    { key: 'sort_dir',  label: 'Sort Dir',  type: 'string',          options: ['asc', 'desc'], default: 'desc' },
    { key: 'highlight', label: 'Highlight', type: 'boolean',         default: true },
  ],
};

const SLACK_SEARCH_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'query',         label: 'Query',         type: 'string',  description: 'The search query that was executed (with channel filters applied)' },
    { key: 'total_matches', label: 'Total Matches', type: 'number',  description: 'Total number of messages matching the search query' },
    { key: 'messages',      label: 'Messages',      type: 'array',   description: 'List of messages matching the search query' },
    { key: 'has_more',      label: 'Has More',      type: 'boolean', description: 'Whether there are more results available' },
  ],
};

const SLACK_SEND_WAIT_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'message',                label: 'Message',                type: 'string',  required: true },
    SLACK_CHANNEL_FIELD,
    { key: 'response_type',          label: 'Response Type',          type: 'string',  required: true, options: ['approval', 'free_text'], default: 'approval' },
    { key: 'button_text',            label: 'Button Text',            type: 'string',  default: 'Approve' },
    { key: 'include_disapprove',     label: 'Include Disapprove',     type: 'boolean', default: true },
    { key: 'disapprove_button_text', label: 'Disapprove Button Text', type: 'string',  default: 'Disapprove' },
    { key: 'free_text_placeholder',  label: 'Free Text Placeholder',  type: 'string' },
    { key: 'button_style',           label: 'Button Style',           type: 'string',  options: ['primary', 'danger', 'default'] },
  ],
};

const SLACK_SEND_WAIT_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'channel_id',    label: 'Channel ID',    type: 'string', description: 'The Slack channel ID where the interactive message was sent' },
    { key: 'results',       label: 'Results',       type: 'string', description: 'The status of the interactive message sent' },
    { key: 'message_ts',    label: 'Message TS',    type: 'string', description: 'Slack message timestamp (unique identifier)' },
    { key: 'resume_output', label: 'Resume Output', type: 'object', description: 'User interaction data when workflow resumes' },
  ],
};

const SLACK_UPLOAD_FILE_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'source_url',      label: 'Source URL',       type: 'string' },
    { key: 'bytes_b64',       label: 'Base64 Content',   type: 'string' },
    { key: 'text',            label: 'Text Content',     type: 'string' },
    { key: 'filename',        label: 'Filename',         type: 'string' },
    { key: 'title',           label: 'Title',            type: 'string' },
    { key: 'content_type',    label: 'Content Type',     type: 'string' },
    { ...SLACK_CHANNEL_FIELD, required: false },
    { key: 'thread_ts',       label: 'Thread Timestamp', type: 'string' },
    { key: 'initial_comment', label: 'Initial Comment',  type: 'string' },
    { key: 'unfurl_links',    label: 'Unfurl Links',     type: 'boolean', default: true },
    { key: 'unfurl_media',    label: 'Unfurl Media',     type: 'boolean', default: true },
  ],
};

const SLACK_UPLOAD_FILE_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'success',         label: 'Success',         type: 'boolean', description: 'Whether the file was uploaded successfully.' },
    { key: 'file_id',         label: 'File ID',         type: 'string',  description: 'Unique ID of the uploaded file.' },
    { key: 'file_url',        label: 'File URL',        type: 'string',  description: 'Private URL to access the file.' },
    { key: 'permalink',       label: 'Permalink',       type: 'string',  description: 'Permanent link to the file.' },
    { key: 'sharing_summary', label: 'Sharing Summary', type: 'string',  description: 'Summary of where the file was shared.' },
    { key: 'upload_method',   label: 'Upload Method',   type: 'string',  description: 'Method used for upload.' },
  ],
};

const SLACK_DELETE_FILE_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'file_id', label: 'File ID', type: 'string', required: true },
  ],
};

const SLACK_DELETE_FILE_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'success', label: 'Success', type: 'boolean', description: 'Whether the file was successfully deleted.' },
    { key: 'file_id', label: 'File ID', type: 'string',  description: 'The ID of the file that was deleted.' },
    { key: 'message', label: 'Message', type: 'string',  description: 'Message describing the deletion result.' },
  ],
};

const SLACK_GET_FILE_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'file_id', label: 'File ID', type: 'string', required: true },
  ],
};

const SLACK_GET_FILE_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'file',         label: 'File',         type: 'object', description: 'Detailed information about the file (id, name, title, mimetype, size, etc.).' },
    { key: 'access_urls',  label: 'Access URLs',  type: 'object', description: 'URLs for accessing the file (require Authorization header).' },
    { key: 'sharing_info', label: 'Sharing Info', type: 'object', description: 'Information about where the file is shared.' },
  ],
};

const SLACK_LIST_FILES_SCHEMA: ToolInputSchema = {
  fields: [
    { key: 'user',                       label: 'User',                         type: 'string' },
    { key: 'channel',                    label: 'Channel',                      type: 'string' },
    { key: 'ts_from',                    label: 'From Timestamp',               type: 'string' },
    { key: 'ts_to',                      label: 'To Timestamp',                 type: 'string' },
    { key: 'types',                      label: 'File Types',                   type: 'string', options: ['all', 'spaces', 'snippets', 'images', 'gdocs', 'zips', 'pdfs'] },
    { key: 'count',                      label: 'Count',                        type: 'number', default: 20 },
    { key: 'show_files_hidden_by_limit', label: 'Show Files Hidden by Limit',   type: 'boolean', default: false },
  ],
};

const SLACK_LIST_FILES_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'files',       label: 'Files',       type: 'array',   description: 'List of files matching the criteria.' },
    { key: 'total_count', label: 'Total Count', type: 'number',  description: 'Total number of files found.' },
    { key: 'has_more',    label: 'Has More',    type: 'boolean', description: 'Whether there are more files available.' },
    { key: 'paging',      label: 'Paging',      type: 'object',  description: 'Pagination information.' },
  ],
};

const SLACK_QUERY_SCHEMA: ToolInputSchema = {
  fields: [SLACK_CHANNEL_FIELD],
};

const SLACK_QUERY_OUTPUTS: ToolOutputSchema = {
  fields: [
    { key: 'channel_id', label: 'Channel ID', type: 'string', description: 'The Slack channel ID that was queried.' },
    { key: 'results',    label: 'Results',    type: 'array',  description: 'Messages retrieved from the channel. Each contains: id, text, timestamp, is_thread_reply, parent_ts.' },
  ],
};

// ── Registry ──────────────────────────────────────────────────────────────────
//
// Add entries here when adding a new tool.
// Keys must match tool.id values in PROVIDER_TOOLS (node-detail-panel.tsx).

export const TOOL_SCHEMAS: Record<string, ToolInputSchema> = {
  // Ahrefs
  'ahrefs-batch':         AHREFS_BATCH_SCHEMA,
  'ahrefs-bulk':          AHREFS_BATCH_SCHEMA,
  'ahrefs-domain-batch':  AHREFS_BATCH_SCHEMA,
  'ahrefs-bl-batch':      AHREFS_BATCH_SCHEMA,
  'ahrefs-domain-rating': AHREFS_DOMAIN_SCHEMA,
  'ahrefs-bl-stats':      AHREFS_DOMAIN_SCHEMA,
  // Slack
  'slack-send-message':   SLACK_SEND_MESSAGE_SCHEMA,
  'slack-search':         SLACK_SEARCH_SCHEMA,
  'slack-send-wait':      SLACK_SEND_WAIT_SCHEMA,
  'slack-upload-file':    SLACK_UPLOAD_FILE_SCHEMA,
  'slack-delete-file':    SLACK_DELETE_FILE_SCHEMA,
  'slack-get-file':       SLACK_GET_FILE_SCHEMA,
  'slack-list-files':     SLACK_LIST_FILES_SCHEMA,
  'slack-query':          SLACK_QUERY_SCHEMA,
};

export const TOOL_OUTPUTS: Record<string, ToolOutputSchema> = {
  // Ahrefs
  'ahrefs-batch':         AHREFS_BATCH_OUTPUTS,
  'ahrefs-bulk':          AHREFS_BATCH_OUTPUTS,
  'ahrefs-domain-batch':  AHREFS_BATCH_OUTPUTS,
  'ahrefs-bl-batch':      AHREFS_BATCH_OUTPUTS,
  'ahrefs-domain-rating': AHREFS_DOMAIN_OUTPUTS,
  'ahrefs-bl-stats':      AHREFS_BL_OUTPUTS,
  // Slack
  'slack-send-message':   SLACK_SEND_MESSAGE_OUTPUTS,
  'slack-search':         SLACK_SEARCH_OUTPUTS,
  'slack-send-wait':      SLACK_SEND_WAIT_OUTPUTS,
  'slack-upload-file':    SLACK_UPLOAD_FILE_OUTPUTS,
  'slack-delete-file':    SLACK_DELETE_FILE_OUTPUTS,
  'slack-get-file':       SLACK_GET_FILE_OUTPUTS,
  'slack-list-files':     SLACK_LIST_FILES_OUTPUTS,
  'slack-query':          SLACK_QUERY_OUTPUTS,
};
