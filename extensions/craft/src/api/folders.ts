/**
 * Folders Domain
 *
 * Everything related to folders in one place:
 * - Types
 * - Async functions for tools
 */

import { buildUrl, fetch, ItemsResponse } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface Folder {
  id: string;
  name: string;
  documentCount: number;
  folders: Folder[];
}

export type FolderDestination = { destination: "root" } | { parentFolderId: string };

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * List all folders in the space
 */
export async function fetchFolders(): Promise<Folder[]> {
  const data = await fetch<ItemsResponse<Folder>>(buildUrl("/folders"));
  return data.items;
}

/**
 * Create new folders
 */
export async function createFolders(
  folders: { name: string; parentFolderId?: string }[],
): Promise<{ id: string; name: string; parentFolderId?: string }[]> {
  const data = await fetch<ItemsResponse<{ id: string; name: string; parentFolderId?: string }>>(
    buildUrl("/folders"),
    { method: "POST", body: JSON.stringify({ folders }) },
  );
  return data.items;
}

/**
 * Delete folders (documents and subfolders are moved to parent or Unsorted)
 */
export async function deleteFolders(folderIds: string[]): Promise<string[]> {
  const data = await fetch<ItemsResponse<string>>(buildUrl("/folders"), {
    method: "DELETE",
    body: JSON.stringify({ folderIds }),
  });
  return data.items;
}

/**
 * Move folders within the hierarchy
 */
export async function moveFolders(
  folderIds: string[],
  destination: FolderDestination,
): Promise<{ id: string; destination: FolderDestination }[]> {
  const data = await fetch<ItemsResponse<{ id: string; destination: FolderDestination }>>(
    buildUrl("/folders/move"),
    { method: "PUT", body: JSON.stringify({ folderIds, destination }) },
  );
  return data.items;
}
