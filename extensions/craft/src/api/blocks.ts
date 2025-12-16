/**
 * Blocks Domain
 *
 * Everything related to blocks in one place:
 * - Types (params, responses)
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, httpGet, httpPost, httpPut, httpDelete } from "./client";
import type { Block, BlockPosition, SearchMatch, ListStyle } from "./types";

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
  pageId?: string;
  date?: string; // YYYY-MM-DD for daily notes
  blockIds?: string[];
  includeContent?: boolean;
  includeMetadata?: boolean;
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

interface BlocksResponse {
  blocks: Block[];
}

interface SearchBlocksResponse {
  matches: SearchMatch[];
}

interface InsertBlocksResponse {
  insertedBlocks: Block[];
}

// =============================================================================
// Internal: URL Builders
// =============================================================================

function blocksUrl(params: GetBlocksParams): string {
  return buildUrl(ENDPOINTS.blocks, params as unknown as Record<string, string | boolean | undefined>);
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
 * const { blocks, isLoading } = useBlocks({ pageId: documentId });
 *
 * // By date (daily note)
 * const { blocks } = useBlocks({ date: "2024-01-15" });
 * ```
 */
export function useBlocks(params: GetBlocksParams): UseBlocksResult {
  const hasTarget = Boolean(params.pageId || params.date || params.blockIds?.length);

  const { data, isLoading, error, revalidate } = useFetch<BlocksResponse>(blocksUrl(params), {
    execute: hasTarget,
    keepPreviousData: true,
  });

  return {
    blocks: data?.blocks ?? [],
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
    matches: data?.matches ?? [],
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
    includeContent: true,
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
  const response = await httpGet<BlocksResponse>(blocksUrl(params));
  return response.blocks;
}

/**
 * Search blocks (for tools)
 */
export async function searchBlocks(params: SearchBlocksParams): Promise<SearchMatch[]> {
  const response = await httpGet<SearchBlocksResponse>(searchBlocksUrl(params));
  return response.matches;
}

/**
 * Insert a block
 */
export async function insertBlock(params: InsertBlockParams): Promise<Block[]> {
  const response = await httpPost<InsertBlocksResponse>(buildUrl(ENDPOINTS.blocks), {
    blocks: [
      {
        type: "text",
        markdown: params.content,
        listStyle: params.listStyle ?? "none",
      },
    ],
    position: params.position,
  });
  return response.insertedBlocks;
}

/**
 * Insert multiple blocks
 */
export async function insertBlocks(
  blocks: Partial<Block>[],
  position: BlockPosition,
): Promise<Block[]> {
  const response = await httpPost<InsertBlocksResponse>(buildUrl(ENDPOINTS.blocks), {
    blocks,
    position,
  });
  return response.insertedBlocks;
}

/**
 * Update blocks
 */
export async function updateBlocks(
  updates: { id: string; updates: Partial<Block> }[],
  target?: { pageId?: string; date?: string },
): Promise<Block[]> {
  const response = await httpPut<{ updatedBlocks: Block[] }>(buildUrl(ENDPOINTS.blocks), {
    ...target,
    blocks: updates,
  });
  return response.updatedBlocks;
}

/**
 * Delete blocks
 */
export async function deleteBlocks(
  blockIds: string[],
  target?: { pageId?: string; date?: string },
): Promise<string[]> {
  const response = await httpDelete<{ deletedBlockIds: string[] }>(buildUrl(ENDPOINTS.blocks), {
    ...target,
    blockIds,
  });
  return response.deletedBlockIds;
}
