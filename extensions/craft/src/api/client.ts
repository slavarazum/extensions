/**
 * Craft API Client
 *
 * Configuration and utilities for Craft Connect API.
 */

import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { usePromise } from "@raycast/utils";

// =============================================================================
// Types
// =============================================================================

interface Preferences {
  documentsApiUrl?: string;
  dailyNotesAndTasksApiUrl?: string;
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Get the Documents API URL from user preferences.
 */
export function getDocumentsApiUrl(): string {
  const preferences = getPreferenceValues<Preferences>();
  if (!preferences.documentsApiUrl) {
    throw new Error("Please configure the Documents API URL in extension preferences.");
  }
  return preferences.documentsApiUrl;
}

/**
 * Get the Daily Notes & Tasks API URL from user preferences.
 */
export function getDailyNotesAndTasksApiUrl(): string {
  const preferences = getPreferenceValues<Preferences>();
  if (!preferences.dailyNotesAndTasksApiUrl) {
    throw new Error("Please configure the Daily Notes & Tasks API URL in extension preferences.");
  }
  return preferences.dailyNotesAndTasksApiUrl;
}

// =============================================================================
// Space ID
// =============================================================================

const SPACE_ID_CACHE_KEY = "craft-space-id";

/**
 * Error response from Craft API when daily note doesn't exist.
 * Used as a workaround to extract the spaceId.
 */
interface DailyNoteNotFoundError {
  error: string;
  code: string;
  details: {
    resourceType: string;
    date: string;
    spaceId: string;
  };
}

/**
 * Fetch space ID from the API.
 */
async function fetchSpaceIdFromApi(apiUrl: string): Promise<string | undefined> {
  const response = await fetch(`${apiUrl}/blocks?date=tomorrow`);
  const json = (await response.json()) as DailyNoteNotFoundError;
  return json?.details?.spaceId;
}

/**
 * Hook to fetch the space ID from the Craft API.
 *
 * WORKAROUND: The Craft API doesn't expose a direct endpoint to get the space ID.
 * Instead, we request a daily note for "tomorrow" which returns a 404 error
 * that includes the spaceId in the error response details.
 *
 * The result is cached in LocalStorage.
 */
export function useSpaceId(): { spaceId: string | undefined; isLoading: boolean } {
  const documentsApiUrl = getDocumentsApiUrl();

  const { data, isLoading } = usePromise(async () => {
    // Check if we have a cached value
    const cached = await LocalStorage.getItem<string>(SPACE_ID_CACHE_KEY);

    if (cached) {
      return cached;
    }

    // Fetch fresh space ID from API
    const spaceId = await fetchSpaceIdFromApi(documentsApiUrl);

    if (spaceId) {
      await LocalStorage.setItem(SPACE_ID_CACHE_KEY, spaceId);
    }

    return spaceId;
  });

  return {
    spaceId: data,
    isLoading,
  };
}

// =============================================================================
// URL Builder
// =============================================================================

type QueryValue = string | number | boolean | string[] | undefined;

/**
 * Build a full API URL with query parameters.
 * Uses the Documents API URL from preferences by default.
 */
export function buildUrl(endpoint: string, params?: Record<string, QueryValue>): string {
  const baseUrl = getDocumentsApiUrl();
  const url = `${baseUrl}${endpoint}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const v of value) {
        searchParams.append(key, v);
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}
