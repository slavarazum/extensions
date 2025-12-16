/**
 * HTTP Client - Pure Data Layer
 *
 * Low-level HTTP utilities. No UI concerns.
 * Used internally by domain modules.
 */

import { API_BASE_URL, ApiError } from "./types";

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

// =============================================================================
// HTTP Methods
// =============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, response.statusText, errorText);
  }
  return response.json();
}

export async function httpGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleResponse<T>(response);
}

export async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function httpPut<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function httpDelete<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}
