/**
 * Documents Domain
 *
 * Everything related to documents in one place:
 * - Types (params, responses)
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, httpGet, httpPost, httpDelete } from "./client";
import type { Document, DocumentSearchMatch, VirtualLocation } from "./types";

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
  virtualLocation?: VirtualLocation;
  includeMetadata?: boolean;
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
  documents: Document[];
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
  // Handle array params
  const flatParams: Record<string, string | boolean | undefined> = {
    fetchMetadata: params.fetchMetadata,
    location: params.location,
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
    documents: data?.documents ?? [],
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
  const response = await httpGet<DocumentsResponse>(documentsUrl(params));
  return response.documents;
}

/**
 * Search documents (for tools)
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<DocumentSearchMatch[]> {
  const response = await httpGet<SearchDocumentsResponse>(searchDocumentsUrl(params));
  return response.items;
}

/**
 * Create a new document
 */
export async function createDocument(params: {
  title: string;
  destination?: { destination: "unsorted" | "templates" } | { folderId: string };
}): Promise<Document> {
  const response = await httpPost<{ document: Document }>(buildUrl(ENDPOINTS.documents), params);
  return response.document;
}

/**
 * Delete documents
 */
export async function deleteDocuments(documentIds: string[]): Promise<string[]> {
  const response = await httpDelete<{ deletedDocumentIds: string[] }>(buildUrl(ENDPOINTS.documents), { documentIds });
  return response.deletedDocumentIds;
}
