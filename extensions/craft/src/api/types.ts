/**
 * Craft API Types
 *
 * Shared type definitions for all Craft API entities.
 */

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

export interface Block {
  id: string;
  type: "text" | "page" | "image" | "video" | "file" | "drawing" | "whiteboard" | "table" | "collection" | "code" | "richLink" | "line";
  textStyle?: "card" | "page" | "h1" | "h2" | "h3" | "h4" | "caption" | "body";
  textAlignment?: "left" | "center" | "right" | "justify";
  font?: "system" | "serif" | "rounded" | "mono";
  markdown?: string;
  indentationLevel?: number;
  listStyle?: "none" | "bullet" | "numbered" | "toggle" | "task";
  decorations?: string[];
  color?: string;
  taskInfo?: TaskInfo;
  metadata?: BlockMetadata;
  content?: Block[];
}

export interface BlocksResponse {
  items: Block[];
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

export interface DocumentsResponse {
  items: Document[];
}

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

export interface SearchResponse {
  items: SearchMatch[];
}

// =============================================================================
// Folder Types
// =============================================================================

export interface Folder {
  id: string;
  name: string;
  documentCount: number;
  folders: Folder[];
}

export interface FoldersResponse {
  items: Folder[];
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

export interface TasksResponse {
  items: Task[];
}

// =============================================================================
// Collection Types
// =============================================================================

export interface Collection {
  key: string;
  name: string;
  documentId: string;
  schema?: unknown;
}

export interface CollectionsResponse {
  items: Collection[];
}

export interface CollectionItemsResponse {
  items: unknown[];
}

// =============================================================================
// Position Types (for block operations)
// =============================================================================

export type BlockPosition =
  | { position: "start" | "end"; pageId: string }
  | { position: "start" | "end"; date: string }
  | { siblingId: string; position: "before" | "after" };

// =============================================================================
// Location Types
// =============================================================================

export type VirtualLocation = "unsorted" | "trash" | "templates" | "daily_notes";

export type TaskLocation =
  | { type: "inbox" }
  | { type: "dailyNote"; date: string }
  | { type: "document"; documentId: string };

export type DocumentDestination =
  | { destination: "unsorted" | "templates" }
  | { folderId: string };

export type FolderDestination = "root" | { parentFolderId: string };

// =============================================================================
// Task Scopes
// =============================================================================

export type TaskScope = "active" | "upcoming" | "inbox" | "logbook" | "document";

// =============================================================================
// Collection Schema Types
// =============================================================================

export interface CollectionSchema {
  fields: {
    name: string;
    type: string;
    options?: unknown;
  }[];
}

export interface CollectionItem {
  id: string;
  fields: Record<string, unknown>;
}

// =============================================================================
// API Request Parameters
// =============================================================================

// Blocks Parameters
export interface GetBlocksParams {
  pageId?: string;
  date?: string; // YYYY-MM-DD format for daily notes
  blockIds?: string[];
  includeContent?: boolean;
  includeMetadata?: boolean;
}

export interface SearchBlocksParams {
  /** The block ID (document or page) to search within - required */
  blockId: string;
  /** The search pattern (RE2-compatible regex syntax) - required */
  pattern: string;
  /** Whether the search should be case sensitive. Default is false */
  caseSensitive?: boolean;
  /** The number of blocks to include before the matched block. Default is 5 */
  beforeBlockCount?: number;
  /** The number of blocks to include after the matched block. Default is 5 */
  afterBlockCount?: number;
}

export interface InsertBlocksParams {
  blocks: Partial<Block>[];
  position: BlockPosition;
  foldExistingBlock?: boolean;
}

export interface UpdateBlocksParams {
  pageId?: string;
  date?: string;
  blocks: { id: string; updates: Partial<Block> }[];
}

export interface DeleteBlocksParams {
  pageId?: string;
  date?: string;
  blockIds: string[];
}

export interface MoveBlocksParams {
  pageId?: string;
  date?: string;
  blockIds: string[];
  position: BlockPosition;
}

// Documents Parameters
export interface ListDocumentsParams {
  folderId?: string;
  virtualLocation?: VirtualLocation;
  includeMetadata?: boolean;
}

export interface SearchDocumentsParams {
  /** Search terms to include in the search. Can be a single string or array of strings */
  include?: string | string[];
  /** Search terms using RE2-compatible regex syntax */
  regexps?: string[];
  /** Document IDs to filter (cannot be used with location or folderIds) */
  documentIds?: string[];
  /** Whether to include document metadata */
  fetchMetadata?: boolean;
  /** Filter by virtual location */
  location?: "unsorted" | "trash" | "templates" | "daily_notes";
  /** Filter by specific folders */
  folderIds?: string[];
  /** Date filters */
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
  dailyNoteDateGte?: string;
  dailyNoteDateLte?: string;
}

export interface CreateDocumentParams {
  title: string;
  destination?: DocumentDestination;
  blocks?: Partial<Block>[];
}

export interface DeleteDocumentsParams {
  documentIds: string[];
}

export interface MoveDocumentsParams {
  documentIds: string[];
  destination: DocumentDestination;
}

// Tasks Parameters
export interface GetTasksParams {
  scope?: TaskScope;
  documentId?: string; // Required when scope is "document"
  date?: string; // For upcoming scope filtering
}

export interface AddTasksParams {
  tasks: {
    blockId: string;
    taskInfo: Partial<TaskInfo>;
  }[];
}

export interface UpdateTasksParams {
  tasks: {
    blockId: string;
    updates: Partial<TaskInfo>;
  }[];
}

export interface DeleteTasksParams {
  blockIds: string[];
}

// Folders Parameters
export interface ListFoldersParams {
  parentFolderId?: string;
}

export interface CreateFolderParams {
  name: string;
  destination?: FolderDestination;
}

export interface DeleteFoldersParams {
  folderIds: string[];
}

export interface MoveFoldersParams {
  folderIds: string[];
  destination: FolderDestination;
}

// Collections Parameters
export interface ListCollectionsParams {
  // Currently no specific params
}

export interface GetCollectionSchemaParams {
  collectionId: string;
}

export interface GetCollectionItemsParams {
  collectionId: string;
  // Additional query params can be added
}
