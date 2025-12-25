/**
 * Craft API Client
 *
 * Configuration and utilities for Craft Connect API.
 */

import { getPreferenceValues } from "@raycast/api";

// =============================================================================
// Types
// =============================================================================

interface Preferences {
  documentsApiUrl?: string;
  dailyNotesAndTasksApiUrl?: string;
}

/** Generic wrapper for list responses from Craft API */
export interface ItemsResponse<T> {
  items: T[];
}

/** Generic wrapper for ID-only responses */
export type IdsResponse = ItemsResponse<{ id: string }>;

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
// URL Builder
// =============================================================================

export type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

/**
 * Build a full API URL with query parameters.
 * Uses the Documents API URL from preferences by default.
 */
export function buildUrl(endpoint: string, params?: QueryParams): string {
  return buildUrlWithBase(getDocumentsApiUrl(), endpoint, params);
}

/**
 * Build a full API URL with query parameters using Daily Notes API.
 */
export function buildDailyNotesUrl(endpoint: string, params?: QueryParams): string {
  return buildUrlWithBase(getDailyNotesAndTasksApiUrl(), endpoint, params);
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
    throw new Error(`Craft API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
