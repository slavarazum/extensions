/**
 * Craft API Client
 *
 * Configuration and utilities for Craft Connect API.
 */

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
