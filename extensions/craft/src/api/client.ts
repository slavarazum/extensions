/**
 * Craft API Client Base
 *
 * Core HTTP client and URL building utilities for the Craft API.
 */

// =============================================================================
// Configuration
// =============================================================================

export const API_BASE_URL = "https://connect.craft.do/links/CbwiyeDAUMD/api/v1";

// =============================================================================
// Endpoints
// =============================================================================

export const Endpoints = {
  // Blocks
  blocks: "/blocks",
  blocksSearch: "/blocks/search",
  blocksMove: "/blocks/move",

  // Documents
  documents: "/documents",
  documentsSearch: "/documents/search",
  documentsMove: "/documents/move",

  // Folders
  folders: "/folders",
  foldersMove: "/folders/move",

  // Collections
  collections: "/collections",
  collectionSchema: (id: string) => `/collections/${id}/schema`,
  collectionItems: (id: string) => `/collections/${id}/items`,

  // Tasks
  tasks: "/tasks",
} as const;

// =============================================================================
// URL Builder
// =============================================================================

type QueryParamValue = string | number | boolean | string[] | undefined;

export class URLBuilder {
  private baseUrl: string;
  private pathSegment: string;
  private searchParams: URLSearchParams;

  constructor(path: string, baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.pathSegment = path;
    this.searchParams = new URLSearchParams();
  }

  /**
   * Add a single parameter (chainable)
   */
  param(key: string, value: QueryParamValue): this {
    if (value === undefined) return this;

    if (Array.isArray(value)) {
      for (const v of value) {
        this.searchParams.append(key, v);
      }
    } else {
      this.searchParams.set(key, String(value));
    }
    return this;
  }

  /**
   * Add multiple parameters at once (chainable)
   * Accepts any object with string keys
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params(queryParams: Record<string, any>): this {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const v of value) {
            this.searchParams.append(key, String(v));
          }
        } else {
          this.searchParams.set(key, String(value));
        }
      }
    }
    return this;
  }

  /**
   * Build the final URL string
   */
  build(): string {
    const queryString = this.searchParams.toString();
    const url = `${this.baseUrl}${this.pathSegment}`;
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Build as URL object
   */
  toURL(): URL {
    return new URL(this.build());
  }
}

// =============================================================================
// HTTP Client
// =============================================================================

/**
 * Execute a GET request
 */
export async function httpGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Execute a POST request
 */
export async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Execute a PUT request
 */
export async function httpPut<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Execute a DELETE request
 */
export async function httpDelete<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// =============================================================================
// Helper to create URL builder
// =============================================================================

export function buildUrl(endpoint: string): URLBuilder {
  return new URLBuilder(endpoint);
}
