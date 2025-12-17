/**
 * Documents Domain
 *
 * Everything related to documents in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface Document {
  id: string;
  title: string;
  lastModifiedAt?: string;
  createdAt?: string;
}

export type VirtualLocation = "unsorted" | "trash" | "templates" | "daily_notes";

export interface DocumentSearchMatch {
  documentId: string;
  markdown: string;
  lastModifiedAt?: string;
  createdAt?: string;
}

// =============================================================================
// Endpoints
// =============================================================================

const ENDPOINTS = {
  documents: "/documents",
  search: "/documents/search",
  move: "/documents/move",
} as const;

// =============================================================================
// Parameters
// =============================================================================

export interface ListDocumentsParams {
  folderId?: string;
  location?: VirtualLocation;
  fetchMetadata?: boolean;
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
}

export interface SearchDocumentsParams {
  include?: string | string[];
  regexps?: string[];
  documentIds?: string[];
  fetchMetadata?: boolean;
  location?: VirtualLocation;
  folderIds?: string[];
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
}

// =============================================================================
// Responses
// =============================================================================

interface DocumentsResponse {
  items: Document[];
}

interface SearchDocumentsResponse {
  items: DocumentSearchMatch[];
}

// =============================================================================
// Internal: URL Builders
// =============================================================================

function documentsUrl(params?: ListDocumentsParams): string {
  return buildUrl(ENDPOINTS.documents, params as Record<string, string | boolean | undefined>);
}

function searchDocumentsUrl(params: SearchDocumentsParams): string {
  // Build query params - arrays need special handling
  const flatParams: Record<string, string | boolean | undefined> = {
    fetchMetadata: params.fetchMetadata,
    location: params.location,
    createdDateGte: params.createdDateGte,
    createdDateLte: params.createdDateLte,
    lastModifiedDateGte: params.lastModifiedDateGte,
    lastModifiedDateLte: params.lastModifiedDateLte,
  };

  // include can be string or array
  if (typeof params.include === "string") {
    flatParams.include = params.include;
  }

  return buildUrl(ENDPOINTS.search, flatParams);
}

// =============================================================================
// Hook: useDocuments
// =============================================================================

export interface UseDocumentsResult {
  documents: Document[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Fetch documents list
 *
 * @example
 * ```tsx
 * const { documents, isLoading } = useDocuments();
 * ```
 */
export function useDocuments(params?: ListDocumentsParams): UseDocumentsResult {
  const { data, isLoading, error, revalidate } = useFetch<DocumentsResponse>(documentsUrl(params), {
    keepPreviousData: true,
  });

  return {
    documents: data?.items ?? [],
    isLoading,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useDocumentSearch
// =============================================================================

export interface UseDocumentSearchResult {
  results: DocumentSearchMatch[];
  isLoading: boolean;
  hasQuery: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Search documents
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * const { results, isLoading, hasQuery } = useDocumentSearch(query);
 * ```
 */
export function useDocumentSearch(query: string, params?: Omit<SearchDocumentsParams, "include">): UseDocumentSearchResult {
  const hasQuery = query.length > 0;

  console.log(searchDocumentsUrl({ ...params, include: query }))

  const { data, isLoading, error, revalidate } = useFetch<SearchDocumentsResponse>(
    searchDocumentsUrl({ ...params, include: query }),
    {
      execute: hasQuery,
      keepPreviousData: true,
    },
  );

  return {
    results: data?.items ?? [],
    isLoading: hasQuery ? isLoading : false,
    hasQuery,
    error,
    revalidate,
  };
}

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * Fetch documents list (for tools)
 */
export async function fetchDocuments(params?: ListDocumentsParams): Promise<Document[]> {
  const response = await fetch(documentsUrl(params));
  if (!response.ok) throw new Error(`Failed to fetch documents: ${response.statusText}`);
  const data: DocumentsResponse = await response.json();
  return data.items;
}

/**
 * Search documents (for tools)
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<DocumentSearchMatch[]> {
  const response = await fetch(searchDocumentsUrl(params));
  if (!response.ok) throw new Error(`Failed to search documents: ${response.statusText}`);
  const data: SearchDocumentsResponse = await response.json();
  return data.items;
}

/**
 * Create a new document
 */
export async function createDocument(params: {
  title: string;
  destination?: { destination: "unsorted" | "templates" } | { folderId: string };
}): Promise<Document> {
  const response = await fetch(buildUrl(ENDPOINTS.documents), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: [{ title: params.title }],
      destination: params.destination,
    }),
  });
  if (!response.ok) throw new Error(`Failed to create document: ${response.statusText}`);
  const data: { items: Document[] } = await response.json();
  return data.items[0];
}

/**
 * Delete documents (moves to trash)
 */
export async function deleteDocuments(documentIds: string[]): Promise<string[]> {
  const response = await fetch(buildUrl(ENDPOINTS.documents), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentIds }),
  });
  if (!response.ok) throw new Error(`Failed to delete documents: ${response.statusText}`);
  const data: { items: string[] } = await response.json();
  return data.items;
}
