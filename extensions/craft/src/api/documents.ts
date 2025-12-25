/**
 * Documents Domain
 *
 * Everything related to documents in one place:
 * - Types
 * - Hooks for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, buildDailyNotesUrl, fetch, ItemsResponse, QueryParams } from "./client";

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

export interface SearchDailyNotesParams {
  include?: string | string[];
  regexps?: string[];
  startDate?: string;
  endDate?: string;
  fetchMetadata?: boolean;
}

export interface DailyNoteSearchMatch {
  dailyNoteDate: string;
  markdown: string;
  blockId?: string;
  lastModifiedAt?: string;
  createdAt?: string;
}

export type DocumentDestination = { destination: "unsorted" | "templates" } | { folderId: string };

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
  const { data, isLoading, error, revalidate } = useFetch<ItemsResponse<Document>>(
    buildUrl(ENDPOINTS.documents, { ...params }),
    { keepPreviousData: true, execute: options?.execute },
  );

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
  const { data, isLoading, error, revalidate } = useFetch<ItemsResponse<Document>, undefined, Document[]>(
    buildUrl(ENDPOINTS.documents, { fetchMetadata: true }),
    {
      keepPreviousData: true,
      mapResult(result) {
        const seen = new Set<string>();
        const uniqueDocs = result.items.filter((doc) => {
          if (seen.has(doc.id)) return false;
          seen.add(doc.id);
          return true;
        });
        return {
          data: uniqueDocs.sort((a, b) => {
            const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
            const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
            return dateB - dateA;
          }),
        };
      },
    },
  );

  return { documents: data ?? [], isLoading, error, revalidate };
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
  const searchParams: QueryParams = {
    include: query,
    fetchMetadata: params?.fetchMetadata,
    location: params?.location,
    createdDateGte: params?.createdDateGte,
    createdDateLte: params?.createdDateLte,
    lastModifiedDateGte: params?.lastModifiedDateGte,
    lastModifiedDateLte: params?.lastModifiedDateLte,
  };

  const { data, isLoading, error, revalidate } = useFetch<ItemsResponse<DocumentSearchMatch>>(
    buildUrl(ENDPOINTS.search, searchParams),
    { execute: hasQuery, keepPreviousData: true },
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
  const data = await fetch<ItemsResponse<Document>>(buildUrl(ENDPOINTS.documents, { ...params }));
  return data.items;
}

/**
 * Search documents (for tools)
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<DocumentSearchMatch[]> {
  const searchParams: QueryParams = {
    include: typeof params.include === "string" ? params.include : undefined,
    fetchMetadata: params.fetchMetadata,
    location: params.location,
    createdDateGte: params.createdDateGte,
    createdDateLte: params.createdDateLte,
    lastModifiedDateGte: params.lastModifiedDateGte,
    lastModifiedDateLte: params.lastModifiedDateLte,
  };
  const data = await fetch<ItemsResponse<DocumentSearchMatch>>(buildUrl(ENDPOINTS.search, searchParams));
  return data.items;
}

/**
 * Search daily notes (for tools)
 */
export async function searchDailyNotes(params: SearchDailyNotesParams): Promise<DailyNoteSearchMatch[]> {
  const searchParams: QueryParams = {
    startDate: params.startDate,
    endDate: params.endDate,
    fetchMetadata: params.fetchMetadata,
    include: typeof params.include === "string" ? params.include : undefined,
  };
  const data = await fetch<ItemsResponse<DailyNoteSearchMatch>>(
    buildDailyNotesUrl("/daily-notes/search", searchParams),
  );
  return data.items;
}

/**
 * Create a new document
 */
export async function createDocument(params: {
  title: string;
  destination?: DocumentDestination;
}): Promise<Document> {
  const data = await fetch<ItemsResponse<Document>>(buildUrl(ENDPOINTS.documents), {
    method: "POST",
    body: JSON.stringify({
      documents: [{ title: params.title }],
      destination: params.destination,
    }),
  });
  return data.items[0];
}

/**
 * Delete documents
 */
export async function deleteDocuments(documentIds: string[]): Promise<string[]> {
  const data = await fetch<ItemsResponse<string>>(buildUrl(ENDPOINTS.documents), {
    method: "DELETE",
    body: JSON.stringify({ documentIds }),
  });
  return data.items;
}

/**
 * Move documents between locations
 */
export async function moveDocuments(
  documentIds: string[],
  destination: DocumentDestination,
): Promise<{ id: string; destination: DocumentDestination }[]> {
  const data = await fetch<ItemsResponse<{ id: string; destination: DocumentDestination }>>(
    buildUrl(ENDPOINTS.move),
    {
      method: "PUT",
      body: JSON.stringify({ documentIds, destination }),
    },
  );
  return data.items;
}
