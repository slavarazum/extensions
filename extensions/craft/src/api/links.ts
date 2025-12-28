/**
 * Craft Deep Links Service
 *
 * Build craftdocs:// URLs for opening content in Craft app.
 *
 * @see https://support.craft.do/hc/en-us/articles/360020168838-Deep-Links
 */

import { getCurrentSpaceId } from "./spaces";

const CRAFT_SCHEME = "craftdocs://";

// =============================================================================
// Types
// =============================================================================

export interface OpenLinkParams {
  /** Block ID to open directly */
  blockId?: string;
  /** Document ID (alternative to blockId) */
  documentId?: string;
}

export interface SearchLinkParams {
  /** Search query */
  query: string;
  /** Space ID to search within */
  spaceId?: string;
}

// =============================================================================
// Link Builders
// =============================================================================

/**
 * Build a link to open a block/document in Craft
 * Always uses the current selected space ID from storage.
 *
 * @example
 * ```ts
 * await openLink({ blockId: "abc123" })
 * // => "craftdocs://open?blockId=abc123&spaceId=<currentSpaceId>"
 *
 * await openLink({ documentId: "doc456" })
 * // => "craftdocs://open?documentId=doc456&spaceId=<currentSpaceId>"
 * ```
 */
export async function openLink(params: OpenLinkParams): Promise<string> {
  const searchParams = new URLSearchParams();

  if (params.blockId) {
    searchParams.set("blockId", params.blockId);
  }
  if (params.documentId) {
    searchParams.set("blockId", params.documentId);
  }

  // Always get space ID from current selected space
  const spaceId = await getCurrentSpaceId();
  searchParams.set("spaceId", spaceId);

  return `${CRAFT_SCHEME}open?${searchParams.toString()}`;
}

/**
 * Build a link to open a block directly
 * Always uses the current selected space ID from storage.
 *
 * @example
 * ```ts
 * await blockLink("abc123")
 * // => "craftdocs://open?blockId=abc123&spaceId=<currentSpaceId>"
 * ```
 */
export async function blockLink(blockId: string): Promise<string> {
  return openLink({ blockId });
}

/**
 * Build a link to open a document
 * Always uses the current selected space ID from storage.
 *
 * @example
 * ```ts
 * await documentLink("doc123")
 * // => "craftdocs://open?documentId=doc123&spaceId=<currentSpaceId>"
 * ```
 */
export async function documentLink(documentId: string): Promise<string> {
  return openLink({ documentId });
}

/**
 * Append a blockId to an existing Craft link (e.g., clickableLink from API)
 *
 * @example
 * ```ts
 * appendBlockId("craftdocs://open?documentId=doc123", "block456")
 * // => "craftdocs://open?documentId=doc123&blockId=block456"
 *
 * appendBlockId("https://www.craft.do/s/abc", "block456")
 * // => "https://www.craft.do/s/abc?blockId=block456"
 * ```
 */
export function appendBlockId(baseUrl: string, blockId: string): string {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}blockId=${blockId}`;
}

/**
 * Build a search link to search in Craft
 *
 * @example
 * ```ts
 * searchLink({ query: "meeting notes" })
 * // => "craftdocs://search?query=meeting%20notes"
 * ```
 */
export function searchLink(params: SearchLinkParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);

  if (params.spaceId) {
    searchParams.set("spaceId", params.spaceId);
  }

  return `${CRAFT_SCHEME}search?${searchParams.toString()}`;
}

/**
 * Build a link to create a new document
 *
 * @example
 * ```ts
 * newDocumentLink()
 * // => "craftdocs://createdocument"
 *
 * newDocumentLink("space123")
 * // => "craftdocs://createdocument?spaceId=space123"
 * ```
 */
export function newDocumentLink(spaceId?: string): string {
  if (spaceId) {
    return `${CRAFT_SCHEME}createdocument?spaceId=${encodeURIComponent(spaceId)}`;
  }
  return `${CRAFT_SCHEME}createdocument`;
}
