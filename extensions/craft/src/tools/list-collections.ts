import { listCollections, type ListCollectionsParams } from "../api";

type Input = {
  /**
   * Optional: Filter by document IDs.
   * If not provided, collections from all documents will be listed.
   */
  documentIds?: string[];

  /**
   * Optional: Whether to include or exclude the specified documents.
   * Default is 'include'. Only used when documentIds is provided.
   */
  documentFilterMode?: "include" | "exclude";

  /**
   * Optional: Start date for filtering daily note collections.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  startDate?: string;

  /**
   * Optional: End date for filtering daily note collections.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  endDate?: string;
};

/**
 * List all collections in the Craft space.
 * Collections can be filtered by document or date range.
 */
export default async function (input: Input = {}) {
  const params: ListCollectionsParams = {
    ...(input.documentIds && { documentIds: input.documentIds }),
    ...(input.documentFilterMode && { documentFilterMode: input.documentFilterMode }),
    ...(input.startDate && { startDate: input.startDate }),
    ...(input.endDate && { endDate: input.endDate }),
  };

  const collections = await listCollections(params);

  return {
    totalCollections: collections.length,
    collections: collections.map((col) => ({
      id: col.id,
      name: col.name,
      itemCount: col.itemCount,
      ...(col.documentId && { documentId: col.documentId }),
      ...(col.dailyNoteDate && { dailyNoteDate: col.dailyNoteDate }),
    })),
  };
}
