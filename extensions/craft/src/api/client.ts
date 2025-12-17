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
