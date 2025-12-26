/**
 * Craft API Client
 *
 * Configuration and utilities for Craft Connect API.
 */

import {
  getCurrentSpace,
  getDocumentsApiUrl,
  getDailyNotesAndTasksApiUrl,
} from "./spaces";

// =============================================================================
// Types
// =============================================================================

/** Generic wrapper for list responses from Craft API */
export interface ItemsResponse<T> {
  items: T[];
}

/** Generic wrapper for ID-only responses */
export type IdsResponse = ItemsResponse<{ id: string }>;

// =============================================================================
// Configuration
// =============================================================================

export { getCurrentSpace, getDocumentsApiUrl, getDailyNotesAndTasksApiUrl };

// =============================================================================
// URL Builder
// =============================================================================

export type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

/**
 * Build a full API URL with query parameters.
 */
export async function buildUrl(endpoint: string, params?: QueryParams): Promise<string> {
  const baseUrl = await getDocumentsApiUrl();
  return buildUrlWithBase(baseUrl, endpoint, params);
}

/**
 * Build a full API URL with query parameters using Daily Notes API.
 */
export async function buildDailyNotesUrl(endpoint: string, params?: QueryParams): Promise<string> {
  const baseUrl = await getDailyNotesAndTasksApiUrl();
  return buildUrlWithBase(baseUrl, endpoint, params);
}

/**
 * Build URL with a specific base URL (for hooks using useCurrentSpace).
 */
export function buildUrlWithBaseUrl(baseUrl: string, endpoint: string, params?: QueryParams): string {
  return buildUrlWithBase(baseUrl, endpoint, params);
}

/**
 * Internal helper to build URL with given base.
 */
function buildUrlWithBase(baseUrl: string, endpoint: string, params?: QueryParams): string {
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

// =============================================================================
// HTTP Client
// =============================================================================

/**
 * Make a fetch request to the Craft API.
 * This is a thin wrapper around native fetch for async tool functions.
 */
export async function fetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await globalThis.fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Craft API error: ${response.status} ${response.statusText} - URL: ${url} - ${errorText}`);
  }

  return response.json();
}
