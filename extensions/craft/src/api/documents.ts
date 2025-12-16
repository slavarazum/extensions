/**
 * Documents API
 *
 * API methods for working with Craft documents.
 */

import { buildUrl, Endpoints, httpDelete, httpGet, httpPost } from "./client";
import type {
  Document,
  ListDocumentsParams,
  SearchDocumentsParams,
  CreateDocumentParams,
  DeleteDocumentsParams,
  MoveDocumentsParams,
} from "./types";

// =============================================================================
// Response Types
// =============================================================================

export interface ListDocumentsResponse {
  documents: Document[];
}

/** Document search match result from /documents/search */
export interface DocumentSearchMatch {
  documentId: string;
  markdown: string;
  metadata?: {
    lastModifiedAt?: string;
    createdAt?: string;
  };
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

/**
 * Build URL for listing documents
 */
export function buildListDocumentsUrl(params?: ListDocumentsParams): string {
  const builder = buildUrl(Endpoints.documents);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

/**
 * Build URL for searching documents
 */
export function buildSearchDocumentsUrl(params: SearchDocumentsParams): string {
  return buildUrl(Endpoints.documentsSearch).params(params).build();
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * List documents in a folder
 */
export async function listDocuments(params?: ListDocumentsParams): Promise<ListDocumentsResponse> {
  const url = buildListDocumentsUrl(params);
  return httpGet<ListDocumentsResponse>(url);
}

/**
 * Search for documents
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<SearchDocumentsResponse> {
  const url = buildSearchDocumentsUrl(params);
  return httpGet<SearchDocumentsResponse>(url);
}

/**
 * Create a new document
 */
export async function createDocument(params: CreateDocumentParams): Promise<CreateDocumentResponse> {
  const url = buildUrl(Endpoints.documents).build();
  return httpPost<CreateDocumentResponse>(url, params);
}

/**
 * Delete documents
 */
export async function deleteDocuments(params: DeleteDocumentsParams): Promise<DeleteDocumentsResponse> {
  const url = buildUrl(Endpoints.documents).build();
  return httpDelete<DeleteDocumentsResponse>(url, params);
}

/**
 * Move documents to a different folder
 */
export async function moveDocuments(params: MoveDocumentsParams): Promise<MoveDocumentsResponse> {
  const url = buildUrl(Endpoints.documentsMove).build();
  return httpPost<MoveDocumentsResponse>(url, params);
}
