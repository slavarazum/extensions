import { Tool } from "@raycast/api";
import { searchDailyNotes, type SearchDailyNotesParams } from "../api";

type Input = {
  /**
   * The search query to find in daily notes.
   * This will search across all daily note content.
   */
  query: string;

  /**
   * Optional: Start date for filtering daily notes.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  startDate?: string;

  /**
   * Optional: End date for filtering daily notes.
   * Accepts ISO format YYYY-MM-DD or relative dates: 'today', 'tomorrow', 'yesterday'.
   */
  endDate?: string;

  /**
   * Optional: Include document metadata (lastModifiedAt, createdAt).
   * Default is false.
   */
  fetchMetadata?: boolean;
};

/**
 * Search content across multiple daily notes.
 * Returns relevance-ranked results with content snippets.
 */
export default async function (input: Input) {
  const { query, startDate, endDate, fetchMetadata = false } = input;

  const params: SearchDailyNotesParams = {
    include: query,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    fetchMetadata,
  };

  const results = await searchDailyNotes(params);

  // Format results for better readability
  const formattedResults = results.map((item, index) => ({
    index: index + 1,
    dailyNoteDate: item.dailyNoteDate,
    matchSnippet: item.markdown,
    ...(item.blockId && { blockId: item.blockId }),
    ...(item.lastModifiedAt && { lastModified: item.lastModifiedAt }),
    ...(item.createdAt && { created: item.createdAt }),
  }));

  return {
    totalResults: formattedResults.length,
    query,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    results: formattedResults,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const dateRange =
    input.startDate && input.endDate
      ? ` from ${input.startDate} to ${input.endDate}`
      : input.startDate
        ? ` from ${input.startDate}`
        : input.endDate
          ? ` until ${input.endDate}`
          : "";

  return {
    message: `Search for "${input.query}" in daily notes${dateRange}?`,
  };
};
