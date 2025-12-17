/**
 * Craft API Client
 *
 * Configuration and utilities for Craft Connect API.
 */

import { useFetch } from "@raycast/utils";

// =============================================================================
// Configuration
// =============================================================================

// Craft Connect API endpoints
// Full Space API - access to all documents, folders, blocks, tasks
export const CRAFT_SPACE_API = "https://connect.craft.do/links/CbwiyeDAUMD/api/v1";

// Daily Notes API - focused on daily notes and tasks
export const CRAFT_DAILY_NOTES_API = "https://connect.craft.do/links/6fYEq6cozne/api/v1";

// Default to Full Space API for general operations
export const API_BASE_URL = CRAFT_SPACE_API;

// =============================================================================
// Space ID
// =============================================================================

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
 * Hook to fetch the space ID from the Craft API.
 *
 * WORKAROUND: The Craft API doesn't expose a direct endpoint to get the space ID.
 * Instead, we request a daily note for "tomorrow" which returns a 404 error
 * that includes the spaceId in the error response details.
 */
export function useSpaceId(): { spaceId: string | undefined; isLoading: boolean } {
  const { data, isLoading } = useFetch<DailyNoteNotFoundError>(
    `${API_BASE_URL}/blocks?date=tomorrow`,
    {
      // We expect a 404 response, so parse it as JSON
      async parseResponse(response) {
        return response.json();
      },
    }
  );

  return {
    spaceId: data?.details?.spaceId,
    isLoading,
  };
}

// =============================================================================
// URL Builder
// =============================================================================

type QueryValue = string | number | boolean | string[] | undefined;

export function buildUrl(endpoint: string, params?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${endpoint}`;

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
