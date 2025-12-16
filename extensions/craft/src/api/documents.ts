/**
 * Documents API
 *
 * All types, parameters, and methods for working with Craft documents.
 */

import { buildUrl, httpDelete, httpGet, httpPost } from "./client";
import type { Block } from "./blocks";

// =============================================================================
// Endpoints
// =============================================================================

export const DocumentEndpoints = {
  documents: "/documents",
  search: "/documents/search",
  move: "/documents/move",
} as const;

// =============================================================================
// Core Types
// =============================================================================

export interface Document {
  id: string;
  title: string;
  metadata?: {
    lastModifiedAt?: string;
    createdAt?: string;
  };
}

// =============================================================================
// Location Types
// =============================================================================

export type VirtualLocation = "unsorted" | "trash" | "templates" | "daily_notes";

export type DocumentDestination =
  | { destination: "unsorted" | "templates" }
  | { folderId: string };

// =============================================================================
// Search Types
// =============================================================================

export interface DocumentSearchMatch {
  documentId: string;
  markdown: string;
  metadata?: {
    lastModifiedAt?: string;
    createdAt?: string;
  };
}

// =============================================================================
// Request Parameters
// =============================================================================

export interface ListDocumentsParams {
  folderId?: string;
  virtualLocation?: VirtualLocation;
  includeMetadata?: boolean;
}

export interface SearchDocumentsParams {
  /** Search terms to include in the search. Can be a single string or array of strings */
  include?: string | string[];
  /** Search terms using RE2-compatible regex syntax */
  regexps?: string[];
  /** Document IDs to filter (cannot be used with location or folderIds) */
  documentIds?: string[];
  /** Whether to include document metadata */
  fetchMetadata?: boolean;
  /** Filter by virtual location */
  location?: VirtualLocation;
  /** Filter by specific folders */
  folderIds?: string[];
  /** Date filters */
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
  dailyNoteDateGte?: string;
  dailyNoteDateLte?: string;
}

export interface CreateDocumentParams {
  title: string;
  destination?: DocumentDestination;
  blocks?: Partial<Block>[];
}

export interface DeleteDocumentsParams {
  documentIds: string[];
}

export interface MoveDocumentsParams {
  documentIds: string[];
  destination: DocumentDestination;
}

// =============================================================================
// Response Types
// =============================================================================

export interface ListDocumentsResponse {
  documents: Document[];
}

export interface SearchDocumentsResponse {
  items: DocumentSearchMatch[];
}

export interface CreateDocumentResponse {
  document: Document;
}

export interface DeleteDocumentsResponse {
  deletedDocumentIds: string[];
}

export interface MoveDocumentsResponse {
  movedDocumentIds: string[];
}

// =============================================================================
// URL Builders
// =============================================================================

export function buildListDocumentsUrl(params?: ListDocumentsParams): string {
  const builder = buildUrl(DocumentEndpoints.documents);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

export function buildSearchDocumentsUrl(params: SearchDocumentsParams): string {
  return buildUrl(DocumentEndpoints.search).params(params).build();
}

// =============================================================================
// API Methods
// =============================================================================

export async function listDocuments(params?: ListDocumentsParams): Promise<ListDocumentsResponse> {
  const url = buildListDocumentsUrl(params);
  return httpGet<ListDocumentsResponse>(url);
}

export async function searchDocuments(params: SearchDocumentsParams): Promise<SearchDocumentsResponse> {
  const url = buildSearchDocumentsUrl(params);
  return httpGet<SearchDocumentsResponse>(url);
}

export async function createDocument(params: CreateDocumentParams): Promise<CreateDocumentResponse> {
  const url = buildUrl(DocumentEndpoints.documents).build();
  return httpPost<CreateDocumentResponse>(url, params);
}

export async function deleteDocuments(params: DeleteDocumentsParams): Promise<DeleteDocumentsResponse> {
  const url = buildUrl(DocumentEndpoints.documents).build();
  return httpDelete<DeleteDocumentsResponse>(url, params);
}

export async function moveDocuments(params: MoveDocumentsParams): Promise<MoveDocumentsResponse> {
  const url = buildUrl(DocumentEndpoints.move).build();
  return httpPost<MoveDocumentsResponse>(url, params);
}
