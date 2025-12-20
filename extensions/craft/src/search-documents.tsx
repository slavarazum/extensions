import { ActionPanel, Action, List, Icon, open } from "@raycast/api";
import { useState, useMemo } from "react";
import { usePromise } from "@raycast/utils";
import { useDocumentSearch, useDocuments, fetchDocuments, searchBlocks, type DocumentSearchMatch, type Document } from "./api";

const PAGE_SIZE = 20;

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { results, isLoading: isSearching, hasQuery } = useDocumentSearch(searchText, { fetchMetadata: true });

  // Fetch all documents for documentMap when searching (to get clickableLinks)
  const { documents: allDocsForMap, isLoading: isLoadingAllDocs } = useDocuments(
    { fetchMetadata: true },
    { execute: hasQuery }
  );

  // Fetch documents with pagination support for recent documents view
  const { isLoading: isLoadingDocuments, data: paginatedDocuments, pagination } = usePromise(
    () => async (options: { page: number }) => {
      // Fetch all documents once, then paginate client-side
      const docs = await fetchDocuments({ fetchMetadata: true });

      // Deduplicate by document ID
      const seen = new Set<string>();
      const uniqueDocs = docs.filter((doc) => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      });

      // Sort by last modified date (most recent first)
      const sorted = uniqueDocs.sort((a, b) => {
        const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
        const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Paginate: return items for current page
      const startIndex = 0;
      const endIndex = (options.page + 1) * PAGE_SIZE;
      const paginatedData = sorted.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        hasMore: endIndex < sorted.length,
      };
    },
    []
  );

  const documents = paginatedDocuments ?? [];

  // Create a map of document ID to document info for search results
  const documentMap = useMemo(() => {
    const map = new Map<string, Document>();
    // Use allDocsForMap when searching to ensure we have all clickableLinks
    const docsToMap = hasQuery ? allDocsForMap : documents;
    for (const doc of docsToMap) {
      map.set(doc.id, doc);
    }
    return map;
  }, [documents, allDocsForMap, hasQuery]);

  const isLoading = isSearching || (hasQuery ? isLoadingAllDocs : isLoadingDocuments);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Craft documents..."
      throttle
      pagination={hasQuery ? undefined : pagination}
    >
      {hasQuery ? (
        <List.Section title="Search Results" subtitle={results.length > 0 ? `${results.length}` : undefined}>
          {results.map((doc, index) => {
            const docInfo = documentMap.get(doc.documentId);
            return (
              <SearchResultItem
                key={`${doc.documentId}-${index}`}
                searchMatch={doc}
                document={docInfo}
                searchText={searchText}
              />
            );
          })}
        </List.Section>
      ) : (
        <List.Section title="Recent Documents" subtitle={documents.length > 0 ? `${documents.length}` : undefined}>
          {documents.map((doc, index) => (
            <RecentDocumentItem key={`${doc.id}-${index}`} document={doc} />
          ))}
        </List.Section>
      )}
      {!isSearching && !isLoadingDocuments && !hasQuery && documents.length === 0 && (
        <List.EmptyView icon={Icon.Document} title="No documents found" />
      )}
      {!isSearching && hasQuery && results.length === 0 && (
        <List.EmptyView icon={Icon.Document} title="No documents found" description="Try a different search term" />
      )}
    </List>
  );
}

/**
 * Clean up markdown snippet for display in a list item.
 * - Replaces newlines with spaces
 * - Centers the snippet around the highlighted match
 * - Ensures the highlight isn't cut off
 */
function formatSnippet(markdown: string, maxLength = 80): string {
  const cleaned = markdown
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Find the first highlight position
  const highlightStart = cleaned.indexOf("**");
  if (highlightStart === -1) {
    // No highlight, just truncate from start
    return cleaned.slice(0, maxLength) + "...";
  }

  // Find the end of the highlight
  const highlightEnd = cleaned.indexOf("**", highlightStart + 2);
  const highlightLength = highlightEnd !== -1 ? highlightEnd + 2 - highlightStart : 20;

  // Calculate window around highlight
  const padding = Math.floor((maxLength - highlightLength) / 2);
  let start = Math.max(0, highlightStart - padding);
  let end = Math.min(cleaned.length, highlightStart + highlightLength + padding);

  // Adjust if we hit boundaries
  if (start === 0) {
    end = Math.min(cleaned.length, maxLength);
  } else if (end === cleaned.length) {
    start = Math.max(0, cleaned.length - maxLength);
  }

  let result = cleaned.slice(start, end);

  // Add ellipsis if truncated
  if (start > 0) {
    result = "..." + result;
  }
  if (end < cleaned.length) {
    result = result + "...";
  }

  return result;
}

function SearchResultItem({
  searchMatch,
  document,
  searchText,
}: {
  searchMatch: DocumentSearchMatch;
  document?: Document;
  searchText: string;
}) {
  const lastModified = searchMatch.lastModifiedAt
    ? new Date(searchMatch.lastModifiedAt).toLocaleDateString()
    : undefined;

  const snippet = formatSnippet(searchMatch.markdown || "");

  /**
   * Normalize markdown by removing highlight markers and extra whitespace
   * for better comparison
   */
  const normalizeMarkdown = (md: string): string => {
    return md
      .replace(/\*\*/g, "") // Remove highlight markers
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .toLowerCase();
  };

  // Fetch blockId and open in app
  const handleOpenInApp = async () => {
    if (!document?.clickableLink) return;

    let openUrl = document.clickableLink;

    try {
      // Search within the document to get blockId
      const blockMatches = await searchBlocks({
        blockId: searchMatch.documentId,
        pattern: searchText,
        beforeBlockCount: 0,
        afterBlockCount: 0,
      });

      // Normalize the clicked result's markdown for comparison
      const normalizedClickedMarkdown = normalizeMarkdown(searchMatch.markdown || "");

      // Find the matching block by comparing normalized markdown content
      const matchingBlock = blockMatches.find((match) => {
        if (!match.markdown) return false;

        const normalizedBlockMarkdown = normalizeMarkdown(match.markdown);

        // Check if the block markdown matches the clicked result
        // Either exact match or one contains the other
        return (
          normalizedBlockMarkdown === normalizedClickedMarkdown ||
          normalizedBlockMarkdown.includes(normalizedClickedMarkdown) ||
          normalizedClickedMarkdown.includes(normalizedBlockMarkdown)
        );
      });

      if (matchingBlock?.blockId) {
        const separator = document.clickableLink.includes("?") ? "&" : "?";
        openUrl = `${document.clickableLink}${separator}blockId=${matchingBlock.blockId}`;
      }
    } catch {
      // If block search fails, open without blockId
    }

    await open(openUrl);
  };

  return (
    <List.Item
      title={snippet || "Untitled"}
      subtitle={document?.title}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {document?.clickableLink && (
              <Action
                title="Open in App"
                icon={Icon.ArrowRight}
                onAction={handleOpenInApp}
              />
            )}
            <Action.CopyToClipboard title="Copy Document ID" content={searchMatch.documentId} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function RecentDocumentItem({ document }: { document: Document }) {
  const lastModified = document.lastModifiedAt
    ? new Date(document.lastModifiedAt).toLocaleDateString()
    : undefined;

  return (
    <List.Item
      title={document.title || "Untitled"}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {document.clickableLink && (
              <Action.OpenInBrowser
                title="Open in App"
                url={document.clickableLink}
              />
            )}
            <Action.CopyToClipboard title="Copy Document ID" content={document.id} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
