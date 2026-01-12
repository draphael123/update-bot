// Parsed Slack message structure
export interface SlackMessage {
  id: string;
  author: string | null;
  timestamp_text: string | null;
  timestamp_minutes: number | null;
  is_thread_reply: boolean;
  is_pinned_context: boolean;
  mentions: string[];
  body: string;
  links: string[];
  attachments: string[];
  raw_block: string;
}

// Category types for classified updates
export type UpdateCategory = 
  | "Announcement" 
  | "Protocol" 
  | "Incident" 
  | "Reminder" 
  | "FYI" 
  | "Staffing/OOO" 
  | "Noise";

export type Priority = "High" | "Med" | "Low";

// Classified update item
export interface UpdateItem {
  id: string;
  category: UpdateCategory;
  priority: Priority;
  title: string;
  summary: string;
  details: string;
  owner: string | null;
  mentions: string[];
  links: string[];
  tags: string[];
  source_message_id: string;
  timestamp_text: string | null;
  timestamp_minutes: number | null;
  is_pinned: boolean;
}

// Filter state for the updates feed
export interface FilterState {
  categories: UpdateCategory[];
  priorities: Priority[];
  tags: string[];
  authors: string[];
  onlyMentions: boolean;
  searchQuery: string;
}

// Document template types
export type DocumentTemplate = 
  | "Daily IC Update" 
  | "Weekly IC Summary" 
  | "Leadership Digest";

// Storage state
export interface StorageState {
  rawText: string;
  messages: SlackMessage[];
  updates: UpdateItem[];
  lastParsed: string | null;
}

// Parsed block intermediate type
export interface ParsedBlock {
  author: string | null;
  timestamp_text: string | null;
  body_lines: string[];
  raw_lines: string[];
  is_thread_reply: boolean;
  is_pinned_context: boolean;
}

