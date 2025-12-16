/**
 * Collections API
 *
 * API methods for working with Craft collections.
 */

import { buildUrl, Endpoints, httpGet } from "./client";
import type {
  Collection,
  CollectionSchema,
  CollectionItem,
  ListCollectionsParams,
  GetCollectionSchemaParams,
  GetCollectionItemsParams,
} from "./types";

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

/**
 * Build URL for listing collections
 */
export function buildListCollectionsUrl(params?: ListCollectionsParams): string {
  const builder = buildUrl(Endpoints.collections);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

/**
 * Build URL for getting collection schema
 */
export function buildGetCollectionSchemaUrl(params: GetCollectionSchemaParams): string {
  return buildUrl(Endpoints.collectionSchema(params.collectionId)).build();
}

/**
 * Build URL for getting collection items
 */
export function buildGetCollectionItemsUrl(params: GetCollectionItemsParams): string {
  const { collectionId, ...queryParams } = params;
  return buildUrl(Endpoints.collectionItems(collectionId)).params(queryParams).build();
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * List all collections
 */
export async function listCollections(params?: ListCollectionsParams): Promise<ListCollectionsResponse> {
  const url = buildListCollectionsUrl(params);
  return httpGet<ListCollectionsResponse>(url);
}

/**
 * Get the schema for a collection
 */
export async function getCollectionSchema(params: GetCollectionSchemaParams): Promise<GetCollectionSchemaResponse> {
  const url = buildGetCollectionSchemaUrl(params);
  return httpGet<GetCollectionSchemaResponse>(url);
}

/**
 * Get items from a collection
 */
export async function getCollectionItems(params: GetCollectionItemsParams): Promise<GetCollectionItemsResponse> {
  const url = buildGetCollectionItemsUrl(params);
  return httpGet<GetCollectionItemsResponse>(url);
}
