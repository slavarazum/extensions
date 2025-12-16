/**
 * Craft API - Shared Types
 *
 * Core types used across all domains.
 * Single source of truth for data structures.
 */

// =============================================================================
// Configuration
// =============================================================================

export const API_BASE_URL = "https://connect.craft.do/links/CbwiyeDAUMD/api/v1";

// =============================================================================
// Common Types
// =============================================================================

export interface BlockMetadata {
  lastModifiedAt?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  createdBy?: string;
  comments?: { id: string; author: string; content: string; createdAt: string }[];
  clickableLink?: string;
}

export interface TaskInfo {
  state: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
  completedAt?: string;
  canceledAt?: string;
}

// =============================================================================
// Block Types
// =============================================================================

export type BlockType =
  | "text"
  | "page"
  | "image"
  | "video"
  | "file"
  | "drawing"
  | "whiteboard"
  | "table"
  | "collection"
  | "code"
  | "richLink"
  | "line";

export type TextStyle = "card" | "page" | "h1" | "h2" | "h3" | "h4" | "caption" | "body";
export type ListStyle = "none" | "bullet" | "numbered" | "toggle" | "task";

export interface Block {
  id: string;
  type: BlockType;
  textStyle?: TextStyle;
  textAlignment?: "left" | "center" | "right" | "justify";
  font?: "system" | "serif" | "rounded" | "mono";
  markdown?: string;
  indentationLevel?: number;
  listStyle?: ListStyle;
  decorations?: string[];
  color?: string;
  taskInfo?: TaskInfo;
  metadata?: BlockMetadata;
  content?: Block[];
}

// =============================================================================
// Document Types
// =============================================================================

export interface Document {
  id: string;
  title: string;
  metadata?: {
    lastModifiedAt?: string;
    createdAt?: string;
  };
}

export type VirtualLocation = "unsorted" | "trash" | "templates" | "daily_notes";

export interface DocumentSearchMatch {
  documentId: string;
  markdown: string;
  metadata?: {
    lastModifiedAt?: string;
    createdAt?: string;
  };
}

// =============================================================================
// Task Types
// =============================================================================

export interface Task {
  id: string;
  markdown: string;
  state: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
}

export type TaskScope = "active" | "upcoming" | "inbox" | "logbook" | "document";

// =============================================================================
// Search Types
// =============================================================================

export interface SearchMatch {
  documentId?: string;
  blockId?: string;
  markdown: string;
  pageBlockPath?: { id: string; content: string }[];
  beforeBlocks?: { blockId: string; markdown: string }[];
  afterBlocks?: { blockId: string; markdown: string }[];
}

// =============================================================================
// Position Types
// =============================================================================

export type BlockPosition =
  | { position: "start" | "end"; pageId: string }
  | { position: "start" | "end"; date: string }
  | { siblingId: string; position: "before" | "after" };

// =============================================================================
// API Error
// =============================================================================

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`API Error: ${status} ${statusText}${body ? ` - ${body}` : ""}`);
    this.name = "ApiError";
  }
}
