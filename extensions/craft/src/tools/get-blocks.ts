import { fetchBlocks, type GetBlocksParams } from "../api";

type Input = {
  /**
   * The ID of the block or document to fetch.
   * Use document ID to fetch the entire document's content.
   * Mutually exclusive with 'date'.
   */
  id?: string;

  /**
   * Fetch daily note for this date.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   * Mutually exclusive with 'id'.
   */
  date?: string;

  /**
   * Maximum depth of blocks to fetch.
   * -1 for all descendants (default), 0 for only the specified block, 1 for direct children only.
   */
  maxDepth?: number;

  /**
   * Whether to fetch metadata (comments, createdBy, lastModifiedBy, lastModifiedAt, createdAt).
   * Default is false.
   */
  fetchMetadata?: boolean;
};

/**
 * Fetch blocks from a document or daily note.
 * Use 'id' to fetch a specific block/document, or 'date' to fetch a daily note.
 */
export default async function (input: Input) {
  const { id, date, maxDepth = -1, fetchMetadata = false } = input;

  if (!id && !date) {
    return { error: "Either 'id' or 'date' must be provided" };
  }

  const params: GetBlocksParams = {
    ...(id && { id }),
    ...(date && { date }),
    maxDepth,
    fetchMetadata,
  };

  const blocks = await fetchBlocks(params);

  return {
    totalBlocks: blocks.length,
    ...(id && { blockId: id }),
    ...(date && { date }),
    blocks: blocks.map((block) => ({
      id: block.id,
      type: block.type,
      textStyle: block.textStyle,
      content: block.markdown,
      ...(block.listStyle && { listStyle: block.listStyle }),
      ...(block.taskInfo && { taskInfo: block.taskInfo }),
      ...(block.content && { hasChildren: true, childCount: block.content.length }),
      ...(block.metadata && { metadata: block.metadata }),
    })),
  };
}
