/**
 * Spaces Management
 *
 * Multi-space support for Craft extension.
 * Users can have a default space (via preferences) and additional spaces stored locally.
 */

import { LocalStorage, getPreferenceValues } from "@raycast/api";

// =============================================================================
// Types
// =============================================================================

export interface Space {
  id: string;
  name: string;
  documentsApiUrl: string;
  dailyNotesAndTasksApiUrl: string;
  isDefault?: boolean;
}

interface Preferences {
  documentsApiUrl?: string;
  dailyNotesAndTasksApiUrl?: string;
}

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  spaces: "craft-spaces",
  currentSpaceId: "craft-current-space-id",
} as const;

const DEFAULT_SPACE_ID = "default";

// =============================================================================
// Space Management
// =============================================================================

/**
 * Get the default space from preferences.
 * Returns null if preferences are not configured.
 */
export function getDefaultSpace(): Space | null {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.documentsApiUrl || !preferences.dailyNotesAndTasksApiUrl) {
    return null;
  }

  return {
    id: DEFAULT_SPACE_ID,
    name: "Default Space",
    documentsApiUrl: preferences.documentsApiUrl,
    dailyNotesAndTasksApiUrl: preferences.dailyNotesAndTasksApiUrl,
    isDefault: true,
  };
}

/**
 * Get all additional spaces from local storage.
 */
export async function getAdditionalSpaces(): Promise<Space[]> {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.spaces);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as Space[];
  } catch {
    return [];
  }
}

/**
 * Get all available spaces (default + additional).
 */
export async function getAllSpaces(): Promise<Space[]> {
  const defaultSpace = getDefaultSpace();
  const additionalSpaces = await getAdditionalSpaces();

  const spaces: Space[] = [];
  if (defaultSpace) {
    spaces.push(defaultSpace);
  }
  spaces.push(...additionalSpaces);

  return spaces;
}

/**
 * Save additional spaces to local storage.
 */
export async function saveAdditionalSpaces(spaces: Space[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEYS.spaces, JSON.stringify(spaces));
}

/**
 * Add a new space.
 */
export async function addSpace(space: Omit<Space, "id">): Promise<Space> {
  const spaces = await getAdditionalSpaces();
  const newSpace: Space = {
    ...space,
    id: `space-${Date.now()}`,
  };
  spaces.push(newSpace);
  await saveAdditionalSpaces(spaces);
  return newSpace;
}

/**
 * Update an existing space.
 */
export async function updateSpace(id: string, updates: Partial<Omit<Space, "id" | "isDefault">>): Promise<void> {
  const spaces = await getAdditionalSpaces();
  const index = spaces.findIndex((s) => s.id === id);
  if (index !== -1) {
    spaces[index] = { ...spaces[index], ...updates };
    await saveAdditionalSpaces(spaces);
  }
}

/**
 * Delete a space by ID.
 */
export async function deleteSpace(id: string): Promise<void> {
  if (id === DEFAULT_SPACE_ID) {
    throw new Error("Cannot delete the default space");
  }

  const spaces = await getAdditionalSpaces();
  const filtered = spaces.filter((s) => s.id !== id);
  await saveAdditionalSpaces(filtered);

  // If the deleted space was current, reset to default
  const currentId = await getCurrentSpaceId();
  if (currentId === id) {
    await setCurrentSpaceId(DEFAULT_SPACE_ID);
  }
}

/**
 * Get the ID of the currently selected space.
 */
export async function getCurrentSpaceId(): Promise<string> {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.currentSpaceId);
  return stored || DEFAULT_SPACE_ID;
}

/**
 * Set the current space by ID.
 */
export async function setCurrentSpaceId(id: string): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEYS.currentSpaceId, id);
}

/**
 * Get the currently selected space.
 * Returns the default space if current space is not found or not configured.
 */
export async function getCurrentSpace(): Promise<Space> {
  const currentId = await getCurrentSpaceId();
  const allSpaces = await getAllSpaces();

  // Find the current space
  const currentSpace = allSpaces.find((s) => s.id === currentId);
  if (currentSpace) {
    return currentSpace;
  }

  // Fallback to default space
  const defaultSpace = getDefaultSpace();
  if (defaultSpace) {
    return defaultSpace;
  }

  // Fallback to first available space
  if (allSpaces.length > 0) {
    await setCurrentSpaceId(allSpaces[0].id);
    return allSpaces[0];
  }

  throw new Error(
    "No spaces configured. Please configure the default space in extension preferences or add a space via Manage Spaces command.",
  );
}

/**
 * Get the Documents API URL for the current space.
 */
export async function getDocumentsApiUrl(): Promise<string> {
  const space = await getCurrentSpace();
  return space.documentsApiUrl;
}

/**
 * Get the Daily Notes & Tasks API URL for the current space.
 */
export async function getDailyNotesAndTasksApiUrl(): Promise<string> {
  const space = await getCurrentSpace();
  return space.dailyNotesAndTasksApiUrl;
}

// =============================================================================
// React Hook
// =============================================================================

import { usePromise } from "@raycast/utils";

export interface UseCurrentSpaceResult {
  space: Space | undefined;
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
  /** Documents API base URL for current space (empty string if loading) */
  documentsApiUrl: string;
  /** Daily Notes & Tasks API base URL for current space (empty string if loading) */
  dailyNotesApiUrl: string;
}

/**
 * React hook to get the current space with its API URLs.
 * Use this in components that need to make API calls with the current space.
 *
 * @example
 * ```tsx
 * const { space, documentsApiUrl, isLoading } = useCurrentSpace();
 * // Use documentsApiUrl in useFetch or other hooks
 * ```
 */
export function useCurrentSpace(): UseCurrentSpaceResult {
  const { data, isLoading, error, revalidate } = usePromise(getCurrentSpace);

  return {
    space: data,
    isLoading,
    error,
    revalidate,
    documentsApiUrl: data?.documentsApiUrl ?? "",
    dailyNotesApiUrl: data?.dailyNotesAndTasksApiUrl ?? "",
  };
}
