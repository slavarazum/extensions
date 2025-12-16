/**
 * Folders API
 *
 * All types, parameters, and methods for working with Craft folders.
 */

import { buildUrl, httpDelete, httpGet, httpPost } from "./client";

// =============================================================================
// Endpoints
// =============================================================================

export const FolderEndpoints = {
  folders: "/folders",
  move: "/folders/move",
} as const;

// =============================================================================
// Core Types
// =============================================================================

export interface Folder {
  id: string;
  name: string;
  documentCount: number;
  folders: Folder[];
}

// =============================================================================
// Destination Types
// =============================================================================

export type FolderDestination = "root" | { parentFolderId: string };

// =============================================================================
// Request Parameters
// =============================================================================

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

export function buildListFoldersUrl(params?: ListFoldersParams): string {
  const builder = buildUrl(FolderEndpoints.folders);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

// =============================================================================
// API Methods
// =============================================================================

export async function listFolders(params?: ListFoldersParams): Promise<ListFoldersResponse> {
  const url = buildListFoldersUrl(params);
  return httpGet<ListFoldersResponse>(url);
}

export async function createFolder(params: CreateFolderParams): Promise<CreateFolderResponse> {
  const url = buildUrl(FolderEndpoints.folders).build();
  return httpPost<CreateFolderResponse>(url, params);
}

export async function deleteFolders(params: DeleteFoldersParams): Promise<DeleteFoldersResponse> {
  const url = buildUrl(FolderEndpoints.folders).build();
  return httpDelete<DeleteFoldersResponse>(url, params);
}

export async function moveFolders(params: MoveFoldersParams): Promise<MoveFoldersResponse> {
  const url = buildUrl(FolderEndpoints.move).build();
  return httpPost<MoveFoldersResponse>(url, params);
}
