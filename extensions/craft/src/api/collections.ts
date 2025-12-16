/**
 * Collections API
 *
 * All types, parameters, and methods for working with Craft collections.
 */

import { buildUrl, httpGet } from "./client";

// =============================================================================
// Endpoints
// =============================================================================

export const CollectionEndpoints = {
  collections: "/collections",
  schema: (id: string) => `/collections/${id}/schema`,
  items: (id: string) => `/collections/${id}/items`,
} as const;

// =============================================================================
// Core Types
// =============================================================================

export interface Collection {
  key: string;
  name: string;
  documentId: string;
  schema?: CollectionSchema;
}

export interface CollectionSchema {
  fields: {
    name: string;
    type: string;
    options?: unknown;
  }[];
}

export interface CollectionItem {
  id: string;
  fields: Record<string, unknown>;
}

// =============================================================================
// Request Parameters
// =============================================================================

export interface ListCollectionsParams {
  documentIds?: string[];
}

export interface GetCollectionSchemaParams {
  collectionId: string;
  format?: "schema" | "json-schema-items";
}

export interface GetCollectionItemsParams {
  collectionId: string;
  maxDepth?: number;
}

// =============================================================================
// Response Types
// =============================================================================

export interface ListCollectionsResponse {
  collections: Collection[];
}

export interface GetCollectionSchemaResponse {
  schema: CollectionSchema;
}

export interface GetCollectionItemsResponse {
  items: CollectionItem[];
}

// =============================================================================
// URL Builders
// =============================================================================

export function buildListCollectionsUrl(params?: ListCollectionsParams): string {
  const builder = buildUrl(CollectionEndpoints.collections);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

export function buildGetCollectionSchemaUrl(params: GetCollectionSchemaParams): string {
  const { collectionId, ...queryParams } = params;
  return buildUrl(CollectionEndpoints.schema(collectionId)).params(queryParams).build();
}

export function buildGetCollectionItemsUrl(params: GetCollectionItemsParams): string {
  const { collectionId, ...queryParams } = params;
  return buildUrl(CollectionEndpoints.items(collectionId)).params(queryParams).build();
}

// =============================================================================
// API Methods
// =============================================================================

export async function listCollections(params?: ListCollectionsParams): Promise<ListCollectionsResponse> {
  const url = buildListCollectionsUrl(params);
  return httpGet<ListCollectionsResponse>(url);
}

export async function getCollectionSchema(params: GetCollectionSchemaParams): Promise<GetCollectionSchemaResponse> {
  const url = buildGetCollectionSchemaUrl(params);
  return httpGet<GetCollectionSchemaResponse>(url);
}

export async function getCollectionItems(params: GetCollectionItemsParams): Promise<GetCollectionItemsResponse> {
  const url = buildGetCollectionItemsUrl(params);
  return httpGet<GetCollectionItemsResponse>(url);
}
