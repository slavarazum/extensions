/**
 * Blocks Domain
 *
 * Everything related to blocks in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrlWithBaseUrl, buildUrl, buildDailyNotesUrl, fetch, formatLocalDate, ItemsResponse, IdsResponse } from "./client";
import { useCurrentSpace } from "./spaces";

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
// Hook: useBlocks
// =============================================================================

export interface UseBlocksResult {
  blocks: Block[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

export interface UseBlocksOptions {
  /** If true, suppresses the default error toast (useful when 404 is expected) */
  suppressErrorToast?: boolean;
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
export function useBlocks(params: GetBlocksParams, options?: UseBlocksOptions): UseBlocksResult {
  const { documentsApiUrl, dailyNotesApiUrl, isLoading: isLoadingSpace } = useCurrentSpace();
  const hasTarget = Boolean(params.id || params.date);
  // Use Daily Notes API for date-based queries, Documents API for ID-based queries
  const baseUrl = params.date ? dailyNotesApiUrl : documentsApiUrl;
  const shouldExecute = hasTarget && !!baseUrl;

  const { data, isLoading, error, revalidate } = useFetch<Block>(
    buildUrlWithBaseUrl(baseUrl, ENDPOINTS.blocks, { ...params }),
    {
      execute: shouldExecute,
      keepPreviousData: true,
      // Suppress error toast if requested (e.g., for daily notes that might not exist)
      onError: options?.suppressErrorToast ? () => {} : undefined,
    },
  );

  return {
    blocks: data?.content ?? (data ? [data] : []),
    isLoading: isLoadingSpace || (shouldExecute && isLoading),
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
  const { documentsApiUrl, isLoading: isLoadingSpace } = useCurrentSpace();
  const shouldExecute = pattern.length > 0 && blockId.length > 0 && !!documentsApiUrl;

  const { data, isLoading, error, revalidate } = useFetch<ItemsResponse<SearchMatch>>(
    buildUrlWithBaseUrl(documentsApiUrl, ENDPOINTS.search, {
      blockId,
      pattern,
      beforeBlockCount: options?.beforeBlockCount ?? 3,
      afterBlockCount: options?.afterBlockCount ?? 3,
    }),
    { execute: shouldExecute },
  );

  return {
    matches: data?.items ?? [],
    isLoading: isLoadingSpace || (shouldExecute && isLoading),
    hasPattern: pattern.length > 0,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useDailyNote (single daily note)
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
  const targetDate = date ?? formatLocalDate(new Date());

  const { blocks, isLoading, error, revalidate } = useBlocks(
    { date: targetDate },
    // Daily notes might not exist yet, so suppress the default error toast
    { suppressErrorToast: true },
  );

  // Daily note might not exist yet - treat 404 as empty, not an error
  const isNotFoundError = error?.message?.includes("Not Found") || error?.message?.includes("404");
  const effectiveError = isNotFoundError ? undefined : error;
  const effectiveBlocks = isNotFoundError ? [] : blocks;

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
    blocks: effectiveBlocks,
    isLoading,
    date: targetDate,
    error: effectiveError,
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
  // Use Daily Notes API if fetching by date, otherwise use Documents API
  const isDailyNote = !!params.date;
  const url = isDailyNote
    ? await buildDailyNotesUrl(ENDPOINTS.blocks, { ...params })
    : await buildUrl(ENDPOINTS.blocks, { ...params });
  const data = await fetch<Block>(url);
  return data.content ?? [data];
}

/**
 * Search blocks (for tools)
 */
export async function searchBlocks(params: SearchBlocksParams): Promise<SearchMatch[]> {
  const url = await buildUrl(ENDPOINTS.search, { ...params });
  const data = await fetch<ItemsResponse<SearchMatch>>(url);
  return data.items;
}

/**
 * Insert a block
 */
export async function insertBlock(params: InsertBlockParams): Promise<Block[]> {
  // Use Daily Notes API for date-based positions, otherwise use Documents API
  // Both use the /blocks endpoint with the same payload structure
  const isDailyNote = "date" in params.position;
  const url = isDailyNote
    ? await buildDailyNotesUrl(ENDPOINTS.blocks)
    : await buildUrl(ENDPOINTS.blocks);

  const data = await fetch<ItemsResponse<Block>>(url, {
    method: "POST",
    body: JSON.stringify({
      blocks: [{ type: "text", markdown: params.content, listStyle: params.listStyle ?? "none" }],
      position: params.position,
    }),
  });
  return data.items;
}

/**
 * Insert multiple blocks
 */
export async function insertBlocks(blocks: Partial<Block>[], position: BlockPosition): Promise<Block[]> {
  // Use Daily Notes API for date-based positions, otherwise use Documents API
  // Both use the /blocks endpoint with the same payload structure
  const isDailyNote = "date" in position;
  const url = isDailyNote
    ? await buildDailyNotesUrl(ENDPOINTS.blocks)
    : await buildUrl(ENDPOINTS.blocks);

  const data = await fetch<ItemsResponse<Block>>(url, {
    method: "POST",
    body: JSON.stringify({ blocks, position }),
  });
  return data.items;
}

/**
 * Update blocks
 */
export async function updateBlocks(
  updates: { id: string; markdown?: string; taskInfo?: Partial<TaskInfo> }[],
): Promise<Block[]> {
  const url = await buildUrl(ENDPOINTS.blocks);
  const data = await fetch<ItemsResponse<Block>>(url, {
    method: "PUT",
    body: JSON.stringify({ blocks: updates }),
  });
  return data.items;
}

/**
 * Delete blocks
 */
export async function deleteBlocks(blockIds: string[]): Promise<string[]> {
  const url = await buildUrl(ENDPOINTS.blocks);
  const data = await fetch<IdsResponse>(url, {
    method: "DELETE",
    body: JSON.stringify({ blockIds }),
  });
  return data.items.map((item) => item.id);
}

/**
 * Move blocks to a new position
 */
export async function moveBlocks(blockIds: string[], position: BlockPosition): Promise<string[]> {
  const url = await buildUrl(ENDPOINTS.move);
  const data = await fetch<IdsResponse>(url, {
    method: "PUT",
    body: JSON.stringify({ blockIds, position }),
  });
  return data.items.map((item) => item.id);
}
