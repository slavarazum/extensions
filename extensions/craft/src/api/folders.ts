/**
 * Folders Domain
 *
 * Everything related to folders in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, buildUrlWithBaseUrl, fetch, ItemsResponse } from "./client";
import { useCurrentSpace } from "./spaces";

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

/** Flattened folder for easier consumption */
export interface FlatFolder {
  id: string;
  name: string;
  path: string;
  documentCount: number;
  hasChildren: boolean;
  depth: number;
  isSystem?: boolean;
}

/** System folder IDs that are reserved by Craft */
export const SYSTEM_FOLDER_IDS = ["unsorted", "daily_notes", "trash", "templates"] as const;
export type SystemFolderId = (typeof SYSTEM_FOLDER_IDS)[number];

/**
 * Check if a folder ID is a system folder
 */
export function isSystemFolder(folderId: string): boolean {
  return SYSTEM_FOLDER_IDS.includes(folderId as SystemFolderId);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Flatten folder hierarchy for easier consumption
 */
export function flattenFolders(items: Folder[], parentPath = "", depth = 0): FlatFolder[] {
  const result: FlatFolder[] = [];

  for (const folder of items) {
    const path = parentPath ? `${parentPath}/${folder.name}` : folder.name;
    result.push({
      id: folder.id,
      name: folder.name,
      path,
      documentCount: folder.documentCount,
      hasChildren: folder.folders.length > 0,
      depth,
      isSystem: isSystemFolder(folder.id),
    });

    if (folder.folders.length > 0) {
      result.push(...flattenFolders(folder.folders, path, depth + 1));
    }
  }

  return result;
}

// =============================================================================
// Hook: useFolders
// =============================================================================

export interface UseFoldersResult {
  folders: Folder[];
  flatFolders: FlatFolder[];
  systemFolders: FlatFolder[];
  userFolders: FlatFolder[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Fetch folders with hierarchy and flattened structure.
 * Returns folders in reverse order (newest first) and separates system folders.
 *
 * @example
 * ```tsx
 * const { systemFolders, userFolders, isLoading } = useFolders();
 * ```
 */
export function useFolders(): UseFoldersResult {
  const { documentsApiUrl, isLoading: isLoadingSpace } = useCurrentSpace();

  const { data, isLoading, error, revalidate } = useFetch<ItemsResponse<Folder>>(
    buildUrlWithBaseUrl(documentsApiUrl, "/folders"),
    { keepPreviousData: true, execute: !!documentsApiUrl },
  );

  const folders = data?.items ?? [];
  // Reverse the order (newest first)
  const reversedFolders = [...folders].reverse();
  const flatFolders = flattenFolders(reversedFolders);

  // Separate system folders from user folders
  const systemFolders = flatFolders.filter((f) => f.isSystem);
  const userFolders = flatFolders.filter((f) => !f.isSystem);

  return {
    folders: reversedFolders,
    flatFolders,
    systemFolders,
    userFolders,
    isLoading: isLoadingSpace || isLoading,
    error,
    revalidate,
  };
}

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * List all folders in the space
 */
export async function fetchFolders(): Promise<Folder[]> {
  const url = await buildUrl("/folders");
  const data = await fetch<ItemsResponse<Folder>>(url);
  return data.items;
}

/**
 * Create new folders
 */
export async function createFolders(
  folders: { name: string; parentFolderId?: string }[],
): Promise<{ id: string; name: string; parentFolderId?: string }[]> {
  const url = await buildUrl("/folders");
  const data = await fetch<ItemsResponse<{ id: string; name: string; parentFolderId?: string }>>(url, {
    method: "POST",
    body: JSON.stringify({ folders }),
  });
  return data.items;
}

/**
 * Delete folders (documents and subfolders are moved to parent or Unsorted)
 */
export async function deleteFolders(folderIds: string[]): Promise<string[]> {
  const url = await buildUrl("/folders");
  const data = await fetch<ItemsResponse<string>>(url, {
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
  const url = await buildUrl("/folders/move");
  const data = await fetch<ItemsResponse<{ id: string; destination: FolderDestination }>>(url, {
    method: "PUT",
    body: JSON.stringify({ folderIds, destination }),
  });
  return data.items;
}
