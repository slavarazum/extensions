/**
 * Blocks API
 *
 * All types, parameters, and methods for working with Craft blocks.
 */

import { buildUrl, httpDelete, httpGet, httpPost, httpPut } from "./client";

// =============================================================================
// Endpoints
// =============================================================================

export const BlockEndpoints = {
  blocks: "/blocks",
  search: "/blocks/search",
  move: "/blocks/move",
} as const;

// =============================================================================
// Core Types
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

export interface Block {
  id: string;
  type:
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

// =============================================================================
// Position Types
// =============================================================================

export type BlockPosition =
  | { position: "start" | "end"; pageId: string }
  | { position: "start" | "end"; date: string }
  | { siblingId: string; position: "before" | "after" };

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
// Request Parameters
// =============================================================================

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

// =============================================================================
// Response Types
// =============================================================================

export interface GetBlocksResponse {
  blocks: Block[];
}

export interface SearchBlocksResponse {
  matches: SearchMatch[];
}

export interface InsertBlocksResponse {
  insertedBlocks: Block[];
}

export interface UpdateBlocksResponse {
  updatedBlocks: Block[];
}

export interface DeleteBlocksResponse {
  deletedBlockIds: string[];
}

export interface MoveBlocksResponse {
  movedBlockIds: string[];
}

// =============================================================================
// URL Builders
// =============================================================================

export function buildGetBlocksUrl(params: GetBlocksParams): string {
  return buildUrl(BlockEndpoints.blocks).params(params).build();
}

export function buildSearchBlocksUrl(params: SearchBlocksParams): string {
  return buildUrl(BlockEndpoints.search).params(params).build();
}

// =============================================================================
// API Methods
// =============================================================================

export async function getBlocks(params: GetBlocksParams): Promise<GetBlocksResponse> {
  const url = buildGetBlocksUrl(params);
  return httpGet<GetBlocksResponse>(url);
}

export async function searchBlocks(params: SearchBlocksParams): Promise<SearchBlocksResponse> {
  const url = buildSearchBlocksUrl(params);
  return httpGet<SearchBlocksResponse>(url);
}

export async function insertBlocks(params: InsertBlocksParams): Promise<InsertBlocksResponse> {
  const url = buildUrl(BlockEndpoints.blocks).build();
  return httpPost<InsertBlocksResponse>(url, params);
}

export async function updateBlocks(params: UpdateBlocksParams): Promise<UpdateBlocksResponse> {
  const url = buildUrl(BlockEndpoints.blocks).build();
  return httpPut<UpdateBlocksResponse>(url, params);
}

export async function deleteBlocks(params: DeleteBlocksParams): Promise<DeleteBlocksResponse> {
  const url = buildUrl(BlockEndpoints.blocks).build();
  return httpDelete<DeleteBlocksResponse>(url, params);
}

export async function moveBlocks(params: MoveBlocksParams): Promise<MoveBlocksResponse> {
  const url = buildUrl(BlockEndpoints.move).build();
  return httpPost<MoveBlocksResponse>(url, params);
}
