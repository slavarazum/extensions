import { fetchDocuments, type ListDocumentsParams, type VirtualLocation } from "../api";

type Input = {
  /**
   * Filter by virtual location: 'unsorted', 'trash', 'templates', or 'daily_notes'.
   * Cannot be used together with 'folderId'.
   */
  location?: VirtualLocation;

  /**
   * Filter by specific folder ID (includes subfolders recursively).
   * Cannot be used together with 'location'.
   */
  folderId?: string;

  /**
   * Whether to include metadata (lastModifiedAt, createdAt) in the response.
   * Default is false.
   */
  fetchMetadata?: boolean;

  /**
   * Only include documents created on or after this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  createdDateGte?: string;

  /**
   * Only include documents created on or before this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  createdDateLte?: string;

  /**
   * Only include documents modified on or after this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  lastModifiedDateGte?: string;

  /**
   * Only include documents modified on or before this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  lastModifiedDateLte?: string;

  /**
   * Only include daily notes on or after this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  dailyNoteDateGte?: string;

  /**
   * Only include daily notes on or before this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  dailyNoteDateLte?: string;
};

/**
 * List documents in the Craft space.
 * Without location or folderId filters, returns all documents.
 * Use GET /folders first to see available locations.
 */
export default async function (input: Input) {
  const params: ListDocumentsParams = {
    ...(input.location && { location: input.location }),
    ...(input.folderId && { folderId: input.folderId }),
    ...(input.fetchMetadata && { fetchMetadata: input.fetchMetadata }),
    ...(input.createdDateGte && { createdDateGte: input.createdDateGte }),
    ...(input.createdDateLte && { createdDateLte: input.createdDateLte }),
    ...(input.lastModifiedDateGte && { lastModifiedDateGte: input.lastModifiedDateGte }),
    ...(input.lastModifiedDateLte && { lastModifiedDateLte: input.lastModifiedDateLte }),
    ...(input.dailyNoteDateGte && { dailyNoteDateGte: input.dailyNoteDateGte }),
    ...(input.dailyNoteDateLte && { dailyNoteDateLte: input.dailyNoteDateLte }),
  };

  const documents = await fetchDocuments(params);

  return {
    totalDocuments: documents.length,
    ...(input.location && { location: input.location }),
    ...(input.folderId && { folderId: input.folderId }),
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      ...(doc.dailyNoteDate && { dailyNoteDate: doc.dailyNoteDate }),
      ...(doc.lastModifiedAt && { lastModified: doc.lastModifiedAt }),
      ...(doc.createdAt && { created: doc.createdAt }),
    })),
  };
}
