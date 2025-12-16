/**
 * Blocks API
 *
 * API methods for working with Craft blocks.
 */

import { buildUrl, Endpoints, httpDelete, httpGet, httpPost, httpPut } from "./client";
import type {
  Block,
  SearchMatch,
  GetBlocksParams,
  SearchBlocksParams,
  InsertBlocksParams,
  UpdateBlocksParams,
  DeleteBlocksParams,
  MoveBlocksParams,
} from "./types";

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

/**
 * Build URL for getting blocks
 */
export function buildGetBlocksUrl(params: GetBlocksParams): string {
  return buildUrl(Endpoints.blocks).params(params).build();
}

/**
 * Build URL for searching blocks
 */
export function buildSearchBlocksUrl(params: SearchBlocksParams): string {
  return buildUrl(Endpoints.blocksSearch).params(params).build();
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * Get blocks from a document
 */
export async function getBlocks(params: GetBlocksParams): Promise<GetBlocksResponse> {
  const url = buildGetBlocksUrl(params);
  return httpGet<GetBlocksResponse>(url);
}

/**
 * Search for blocks
 */
export async function searchBlocks(params: SearchBlocksParams): Promise<SearchBlocksResponse> {
  const url = buildSearchBlocksUrl(params);
  return httpGet<SearchBlocksResponse>(url);
}

/**
 * Insert blocks into a document
 */
export async function insertBlocks(params: InsertBlocksParams): Promise<InsertBlocksResponse> {
  const url = buildUrl(Endpoints.blocks).build();
  return httpPost<InsertBlocksResponse>(url, params);
}

/**
 * Update existing blocks
 */
export async function updateBlocks(params: UpdateBlocksParams): Promise<UpdateBlocksResponse> {
  const url = buildUrl(Endpoints.blocks).build();
  return httpPut<UpdateBlocksResponse>(url, params);
}

/**
 * Delete blocks from a document
 */
export async function deleteBlocks(params: DeleteBlocksParams): Promise<DeleteBlocksResponse> {
  const url = buildUrl(Endpoints.blocks).build();
  return httpDelete<DeleteBlocksResponse>(url, params);
}

/**
 * Move blocks to a different location
 */
export async function moveBlocks(params: MoveBlocksParams): Promise<MoveBlocksResponse> {
  const url = buildUrl(Endpoints.blocksMove).build();
  return httpPost<MoveBlocksResponse>(url, params);
}
