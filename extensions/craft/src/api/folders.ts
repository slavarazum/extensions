/**
 * Folders API
 *
 * API methods for working with Craft folders.
 */

import { buildUrl, Endpoints, httpDelete, httpGet, httpPost } from "./client";
import type {
  Folder,
  ListFoldersParams,
  CreateFolderParams,
  DeleteFoldersParams,
  MoveFoldersParams,
} from "./types";

// =============================================================================
// Response Types
// =============================================================================

export interface ListFoldersResponse {
  folders: Folder[];
}

export interface CreateFolderResponse {
  folder: Folder;
}

export interface DeleteFoldersResponse {
  deletedFolderIds: string[];
}

export interface MoveFoldersResponse {
  movedFolderIds: string[];
}

// =============================================================================
// URL Builders
// =============================================================================

/**
 * Build URL for listing folders
 */
export function buildListFoldersUrl(params?: ListFoldersParams): string {
  const builder = buildUrl(Endpoints.folders);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * List folders
 */
export async function listFolders(params?: ListFoldersParams): Promise<ListFoldersResponse> {
  const url = buildListFoldersUrl(params);
  return httpGet<ListFoldersResponse>(url);
}

/**
 * Create a new folder
 */
export async function createFolder(params: CreateFolderParams): Promise<CreateFolderResponse> {
  const url = buildUrl(Endpoints.folders).build();
  return httpPost<CreateFolderResponse>(url, params);
}

/**
 * Delete folders
 */
export async function deleteFolders(params: DeleteFoldersParams): Promise<DeleteFoldersResponse> {
  const url = buildUrl(Endpoints.folders).build();
  return httpDelete<DeleteFoldersResponse>(url, params);
}

/**
 * Move folders to a different location
 */
export async function moveFolders(params: MoveFoldersParams): Promise<MoveFoldersResponse> {
  const url = buildUrl(Endpoints.foldersMove).build();
  return httpPost<MoveFoldersResponse>(url, params);
}
