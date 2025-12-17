import { Tool } from "@raycast/api";
import { searchDocuments, type VirtualLocation } from "../api";

type Input = {
  /**
   * The search query to find in documents.
   * This will search across document content.
   */
  query: string;

  /**
   * Optional: Filter by location.
   * Values: "unsorted", "trash", "templates", "daily_notes"
   */
  location?: VirtualLocation;

  /**
   * Optional: Include document metadata (lastModifiedAt, createdAt).
   * Default is false.
   */
  fetchMetadata?: boolean;
};

export default async function (input: Input) {
  const { query, location, fetchMetadata = false } = input;

  const results = await searchDocuments({
    include: query,
    location,
    fetchMetadata,
  });

  // Format results for better readability
  const formattedResults = results.map((item, index) => ({
    index: index + 1,
    documentId: item.documentId,
    matchSnippet: item.markdown,
    ...(item.metadata && {
      lastModified: item.metadata.lastModifiedAt,
      created: item.metadata.createdAt,
    }),
  }));

  return {
    totalResults: formattedResults.length,
    query,
    ...(location && { location }),
    results: formattedResults,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Search for "${input.query}"${input.location ? ` in ${input.location}` : " across all documents"}?`,
  };
};
