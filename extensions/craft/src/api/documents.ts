/**
 * Documents Domain
 *
 * Everything related to documents in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, fetch } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface Document {
  id: string;
  title: string;
  lastModifiedAt?: string;
  createdAt?: string;
  clickableLink?: string;
  dailyNoteDate?: string; // YYYY-MM-DD format for daily notes
  spaceId?: string; // Space ID for constructing deep links
}

export type VirtualLocation = "unsorted" | "trash" | "templates" | "daily_notes";

export interface DocumentSearchMatch {
  documentId: string;
  markdown: string;
  documentTitle?: string; // Enriched client-side
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
  dailyNoteDateGte?: string;
  dailyNoteDateLte?: string;
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

export interface UseDocumentsOptions {
  execute?: boolean;
}

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
export function useDocuments(params?: ListDocumentsParams, options?: UseDocumentsOptions): UseDocumentsResult {
  const { data, isLoading, error, revalidate } = useFetch<DocumentsResponse>(documentsUrl(params), {
    keepPreviousData: true,
    execute: options?.execute,
  });

  return {
    documents: data?.items ?? [],
    isLoading: options?.execute === false ? false : isLoading,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useRecentDocuments
// =============================================================================

export interface UseRecentDocumentsResult {
  documents: Document[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Fetch documents sorted by most recent, with deduplication
 *
 * @example
 * ```tsx
 * const { documents, isLoading } = useRecentDocuments();
 * ```
 */
export function useRecentDocuments(): UseRecentDocumentsResult {
  const { data, isLoading, error, revalidate } = useFetch<DocumentsResponse, undefined, Document[]>(
    documentsUrl({ fetchMetadata: true }),
    {
      keepPreviousData: true,
      mapResult(result: DocumentsResponse) {
        // Deduplicate by document ID
        const seen = new Set<string>();
        const uniqueDocs = result.items.filter((doc) => {
          if (seen.has(doc.id)) return false;
          seen.add(doc.id);
          return true;
        });

        // Sort by last modified date (most recent first)
        const sorted = uniqueDocs.sort((a, b) => {
          const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
          const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
          return dateB - dateA;
        });

        return { data: sorted };
      },
    },
  );

  return {
    documents: data ?? [],
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
export function useDocumentSearch(
  query: string,
  params?: Omit<SearchDocumentsParams, "include">,
): UseDocumentSearchResult {
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
  const data = await fetch<DocumentsResponse>(documentsUrl(params));
  return data.items;
}

/**
 * Search documents (for tools)
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<DocumentSearchMatch[]> {
  const data = await fetch<SearchDocumentsResponse>(searchDocumentsUrl(params));
  return data.items;
}

/**
 * Create a new document
 */
export async function createDocument(params: {
  title: string;
  destination?: { destination: "unsorted" | "templates" } | { folderId: string };
}): Promise<Document> {
  const data = await fetch<{ items: Document[] }>(buildUrl(ENDPOINTS.documents), {
    method: "POST",
    body: JSON.stringify({
      documents: [{ title: params.title }],
      destination: params.destination,
    }),
  });
  return data.items[0];
}

/**
 * Delete documents (moves to trash)
 */
export async function deleteDocuments(documentIds: string[]): Promise<string[]> {
  const data = await fetch<{ items: string[] }>(buildUrl(ENDPOINTS.documents), {
    method: "DELETE",
    body: JSON.stringify({ documentIds }),
  });
  return data.items;
}
