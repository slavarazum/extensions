/**
 * Collections Domain
 *
 * Everything related to collections in one place:
 * - Types
 * - Async functions for tools
 */

import { buildUrl, fetchDocumentsApi, ItemsResponse, IdsResponse } from "./client";
import { Block } from "./blocks";

// =============================================================================
// Types
// =============================================================================

export interface Collection {
  id: string;
  name: string;
  itemCount: number;
  documentId?: string;
  dailyNoteDate?: string;
}

export interface CollectionProperty {
  key: string;
  name: string;
  type: "select" | "date" | "text" | "number" | "checkbox" | "relation";
  options?: string[];
}

export interface CollectionSchema {
  key: string;
  name: string;
  contentPropDetails?: {
    key: string;
    name: string;
  };
  properties: CollectionProperty[];
  propertyDetails: CollectionProperty[];
}

export interface CollectionItem {
  id: string;
  title: string;
  properties: Record<string, unknown>;
  content?: Block[];
}

// =============================================================================
// Parameters
// =============================================================================

export interface ListCollectionsParams {
  documentIds?: string[];
  documentFilterMode?: "include" | "exclude";
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * List all collections
 */
export async function listCollections(params?: ListCollectionsParams): Promise<Collection[]> {
  const url = await buildUrl("/collections", {
    startDate: params?.startDate,
    endDate: params?.endDate,
    documentFilterMode: params?.documentFilterMode,
  });
  const data = await fetchDocumentsApi<ItemsResponse<Collection>>(url);
  return data.items;
}

/**
 * Get collection schema
 */
export async function getCollectionSchema(
  collectionId: string,
  format: "schema" | "json-schema-items" = "json-schema-items",
): Promise<CollectionSchema> {
  const url = await buildUrl(`/collections/${collectionId}/schema`, { format });
  return fetchDocumentsApi<CollectionSchema>(url);
}

/**
 * Get collection items
 */
export async function getCollectionItems(collectionId: string, maxDepth = -1): Promise<CollectionItem[]> {
  const url = await buildUrl(`/collections/${collectionId}/items`, { maxDepth });
  const data = await fetchDocumentsApi<ItemsResponse<CollectionItem>>(url);
  return data.items;
}

/**
 * Add items to a collection
 */
export async function addCollectionItems(
  collectionId: string,
  items: { title: string; properties?: Record<string, unknown> }[],
  allowNewSelectOptions?: boolean,
): Promise<CollectionItem[]> {
  const url = await buildUrl(`/collections/${collectionId}/items`);
  const data = await fetchDocumentsApi<ItemsResponse<CollectionItem>>(url, {
    method: "POST",
    body: JSON.stringify({
      items,
      ...(allowNewSelectOptions !== undefined && { allowNewSelectOptions }),
    }),
  });
  return data.items;
}

/**
 * Update collection items
 */
export async function updateCollectionItems(
  collectionId: string,
  itemsToUpdate: { id: string; title?: string; properties?: Record<string, unknown> }[],
  allowNewSelectOptions?: boolean,
): Promise<CollectionItem[]> {
  const url = await buildUrl(`/collections/${collectionId}/items`);
  const data = await fetchDocumentsApi<ItemsResponse<CollectionItem>>(url, {
    method: "PUT",
    body: JSON.stringify({
      itemsToUpdate,
      ...(allowNewSelectOptions !== undefined && { allowNewSelectOptions }),
    }),
  });
  return data.items;
}

/**
 * Delete collection items
 */
export async function deleteCollectionItems(collectionId: string, idsToDelete: string[]): Promise<string[]> {
  const url = await buildUrl(`/collections/${collectionId}/items`);
  const data = await fetchDocumentsApi<IdsResponse>(url, {
    method: "DELETE",
    body: JSON.stringify({ idsToDelete }),
  });
  return data.items.map((item) => item.id);
}
