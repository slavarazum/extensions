import { Tool } from "@raycast/api";
import { searchBlocks } from "../api";

type Input = {
  /**
   * The block ID (document or page) to search within.
   * This is REQUIRED - the /blocks/search endpoint requires a specific block to search in.
   */
  blockId: string;

  /**
   * The search pattern to look for in blocks.
   * Patterns must follow RE2-compatible syntax for regex searches.
   */
  pattern: string;

  /**
   * Optional: Whether the search should be case sensitive.
   * Default is false.
   */
  caseSensitive?: boolean;

  /**
   * Optional: Number of blocks to include before each match for context.
   * Default is 5.
   */
  beforeBlockCount?: number;

  /**
   * Optional: Number of blocks to include after each match for context.
   * Default is 5.
   */
  afterBlockCount?: number;
};

export default async function (input: Input) {
  const { blockId, pattern, caseSensitive = false, beforeBlockCount = 5, afterBlockCount = 5 } = input;

  // Use the API service to search blocks
  const data = await searchBlocks({
    blockId,
    pattern,
    caseSensitive,
    beforeBlockCount,
    afterBlockCount,
  });

  // Format results for better readability
  const results = data.matches.map((item, index) => {
    const result: {
      index: number;
      content: string;
      documentId?: string;
      blockId?: string;
      path?: string;
      contextBefore?: string[];
      contextAfter?: string[];
    } = {
      index: index + 1,
      content: item.markdown,
    };

    if (item.documentId) {
      result.documentId = item.documentId;
    }
    if (item.blockId) {
      result.blockId = item.blockId;
    }
    if (item.pageBlockPath) {
      result.path = item.pageBlockPath.map((p) => p.content).join(" → ");
    }
    if (item.beforeBlocks) {
      result.contextBefore = item.beforeBlocks.map((b) => b.markdown);
    }
    if (item.afterBlocks) {
      result.contextAfter = item.afterBlocks.map((b) => b.markdown);
    }

    return result;
  });

  return {
    totalResults: results.length,
    pattern: pattern,
    searchScope: `Block: ${blockId}`,
    results: results,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    title: "Search Blocks",
    message: `Search for "${input.pattern}" in block ${input.blockId}?`,
  };
};
