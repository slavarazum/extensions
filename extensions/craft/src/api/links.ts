/**
 * Craft Deep Links Service
 *
 * Build craftdocs:// URLs for opening content in Craft app.
 *
 * @see https://support.craft.do/hc/en-us/articles/360020168838-Deep-Links
 */

const CRAFT_SCHEME = "craftdocs://";

// =============================================================================
// Types
// =============================================================================

export interface OpenLinkParams {
  /** Block ID to open directly */
  blockId?: string;
  /** Document ID (alternative to blockId) */
  documentId?: string;
  /** Space ID for context */
  spaceId?: string;
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
 *
 * @example
 * ```ts
 * openLink({ blockId: "abc123" })
 * // => "craftdocs://open?blockId=abc123"
 *
 * openLink({ documentId: "doc456", spaceId: "space789" })
 * // => "craftdocs://open?documentId=doc456&spaceId=space789"
 * ```
 */
export function openLink(params: OpenLinkParams): string {
  const searchParams = new URLSearchParams();

  if (params.blockId) {
    searchParams.set("blockId", params.blockId);
  }
  if (params.documentId) {
    searchParams.set("documentId", params.documentId);
  }
  if (params.spaceId) {
    searchParams.set("spaceId", params.spaceId);
  }

  return `${CRAFT_SCHEME}open?${searchParams.toString()}`;
}

/**
 * Build a link to open a block directly
 *
 * @example
 * ```ts
 * blockLink("abc123")
 * // => "craftdocs://open?blockId=abc123"
 * ```
 */
export function blockLink(blockId: string): string {
  return openLink({ blockId });
}

/**
 * Build a link to open a document
 *
 * @example
 * ```ts
 * documentLink("doc123")
 * // => "craftdocs://open?documentId=doc123"
 * ```
 */
export function documentLink(documentId: string): string {
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

/**
 * Build a link to open today's daily note
 *
 * @example
 * ```ts
 * dailyNoteLink()
 * // => "craftdocs://openDailyNote"
 *
 * dailyNoteLink("space123")
 * // => "craftdocs://openDailyNote?spaceId=space123"
 * ```
 */
export function dailyNoteLink(spaceId?: string): string {
  if (spaceId) {
    return `${CRAFT_SCHEME}openDailyNote?spaceId=${encodeURIComponent(spaceId)}`;
  }
  return `${CRAFT_SCHEME}openDailyNote`;
}
