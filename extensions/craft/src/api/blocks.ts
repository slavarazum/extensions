/**
 * Blocks Domain
 *
 * Everything related to blocks in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl } from "./client";

// =============================================================================
// Types
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

export type BlockPosition =
  | { position: "start" | "end"; pageId: string }
  | { position: "start" | "end"; date: string }
  | { siblingId: string; position: "before" | "after" };

export interface SearchMatch {
  documentId?: string;
  blockId?: string;
  markdown: string;
  pageBlockPath?: { id: string; content: string }[];
  beforeBlocks?: { blockId: string; markdown: string }[];
  afterBlocks?: { blockId: string; markdown: string }[];
}

// =============================================================================
// Endpoints
// =============================================================================

const ENDPOINTS = {
  blocks: "/blocks",
  search: "/blocks/search",
  move: "/blocks/move",
} as const;

// =============================================================================
// Parameters
// =============================================================================

export interface GetBlocksParams {
  id?: string; // Block ID or document ID
  date?: string; // YYYY-MM-DD for daily notes (mutually exclusive with id)
  maxDepth?: number; // -1 for all descendants (default)
  fetchMetadata?: boolean;
}

export interface SearchBlocksParams {
  blockId: string;
  pattern: string;
  caseSensitive?: boolean;
  beforeBlockCount?: number;
  afterBlockCount?: number;
}

export interface InsertBlockParams {
  content: string;
  position: BlockPosition;
  listStyle?: ListStyle;
}

// =============================================================================
// Responses
// =============================================================================

// GET /blocks returns a single block (the page) with nested content
type BlockResponse = Block;

interface SearchBlocksResponse {
  items: SearchMatch[];
}

interface InsertBlocksResponse {
  items: Block[];
}

// =============================================================================
// Internal: URL Builders
// =============================================================================

function blocksUrl(params: GetBlocksParams): string {
  return buildUrl(ENDPOINTS.blocks, params as unknown as Record<string, string | number | boolean | undefined>);
}

function searchBlocksUrl(params: SearchBlocksParams): string {
  return buildUrl(ENDPOINTS.search, params as unknown as Record<string, string | number | boolean | undefined>);
}

// =============================================================================
// Hook: useBlocks
// =============================================================================

export interface UseBlocksResult {
  blocks: Block[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Fetch blocks from a document or daily note
 *
 * @example
 * ```tsx
 * // By document ID
 * const { blocks, isLoading } = useBlocks({ id: documentId });
 *
 * // By date (daily note)
 * const { blocks } = useBlocks({ date: "2024-01-15" });
 * ```
 */
export function useBlocks(params: GetBlocksParams): UseBlocksResult {
  const hasTarget = Boolean(params.id || params.date);

  const { data, isLoading, error, revalidate } = useFetch<BlockResponse>(blocksUrl(params), {
    execute: hasTarget,
    keepPreviousData: true,
  });

  // API returns single block with nested content array
  const blocks = data?.content ?? (data ? [data] : []);

  return {
    blocks,
    isLoading: hasTarget ? isLoading : false,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useBlockSearch
// =============================================================================

export interface UseBlockSearchResult {
  matches: SearchMatch[];
  isLoading: boolean;
  hasPattern: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Search within a document's blocks
 *
 * @example
 * ```tsx
 * const { matches, isLoading } = useBlockSearch(documentId, searchText);
 * ```
 */
export function useBlockSearch(
  blockId: string,
  pattern: string,
  options?: { beforeBlockCount?: number; afterBlockCount?: number },
): UseBlockSearchResult {
  const hasPattern = pattern.length > 0;
  const hasBlockId = blockId.length > 0;
  const shouldExecute = hasPattern && hasBlockId;

  const { data, isLoading, error, revalidate } = useFetch<SearchBlocksResponse>(
    searchBlocksUrl({
      blockId,
      pattern,
      beforeBlockCount: options?.beforeBlockCount ?? 3,
      afterBlockCount: options?.afterBlockCount ?? 3,
    }),
    {
      execute: shouldExecute,
      keepPreviousData: true,
    },
  );

  return {
    matches: data?.items ?? [],
    isLoading: shouldExecute ? isLoading : false,
    hasPattern,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useDailyNote
// =============================================================================

export interface UseDailyNoteResult {
  blocks: Block[];
  isLoading: boolean;
  date: string;
  error?: Error;
  revalidate: () => void;
  addContent: (content: string, listStyle?: ListStyle) => Promise<Block[]>;
}

/**
 * Today's daily note with ability to add content
 *
 * @example
 * ```tsx
 * const { blocks, addContent } = useDailyNote();
 * await addContent("New item", "bullet");
 * ```
 */
export function useDailyNote(date?: string): UseDailyNoteResult {
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const { blocks, isLoading, error, revalidate } = useBlocks({
    date: targetDate,
  });

  const addContent = async (content: string, listStyle?: ListStyle): Promise<Block[]> => {
    const result = await insertBlock({
      content,
      position: { position: "end", date: targetDate },
      listStyle,
    });
    revalidate();
    return result;
  };

  return {
    blocks,
    isLoading,
    date: targetDate,
    error,
    revalidate,
    addContent,
  };
}

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * Fetch blocks (for tools)
 */
export async function fetchBlocks(params: GetBlocksParams): Promise<Block[]> {
  const response = await fetch(blocksUrl(params));
  if (!response.ok) throw new Error(`Failed to fetch blocks: ${response.statusText}`);
  const data: BlockResponse = await response.json();
  // API returns single block with nested content array
  return data.content ?? [data];
}

/**
 * Search blocks (for tools)
 */
export async function searchBlocks(params: SearchBlocksParams): Promise<SearchMatch[]> {
  const response = await fetch(searchBlocksUrl(params));
  if (!response.ok) throw new Error(`Failed to search blocks: ${response.statusText}`);
  const data: SearchBlocksResponse = await response.json();
  return data.items;
}

/**
 * Insert a block
 */
export async function insertBlock(params: InsertBlockParams): Promise<Block[]> {
  const response = await fetch(buildUrl(ENDPOINTS.blocks), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "text",
          markdown: params.content,
          listStyle: params.listStyle ?? "none",
        },
      ],
      position: params.position,
    }),
  });
  if (!response.ok) throw new Error(`Failed to insert block: ${response.statusText}`);
  const data: InsertBlocksResponse = await response.json();
  return data.items;
}

/**
 * Insert multiple blocks
 */
export async function insertBlocks(
  blocks: Partial<Block>[],
  position: BlockPosition,
): Promise<Block[]> {
  const response = await fetch(buildUrl(ENDPOINTS.blocks), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks, position }),
  });
  if (!response.ok) throw new Error(`Failed to insert blocks: ${response.statusText}`);
  const data: InsertBlocksResponse = await response.json();
  return data.items;
}

/**
 * Update blocks
 */
export async function updateBlocks(
  updates: { id: string; markdown?: string; taskInfo?: Partial<TaskInfo> }[],
): Promise<Block[]> {
  const response = await fetch(buildUrl(ENDPOINTS.blocks), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks: updates }),
  });
  if (!response.ok) throw new Error(`Failed to update blocks: ${response.statusText}`);
  const data: { items: Block[] } = await response.json();
  return data.items;
}

/**
 * Delete blocks
 */
export async function deleteBlocks(blockIds: string[]): Promise<string[]> {
  const response = await fetch(buildUrl(ENDPOINTS.blocks), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blockIds }),
  });
  if (!response.ok) throw new Error(`Failed to delete blocks: ${response.statusText}`);
  const data: { items: { id: string }[] } = await response.json();
  return data.items.map((item) => item.id);
}
