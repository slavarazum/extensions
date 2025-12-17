import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { useDocumentSearch, useDocuments, useSpaceId, type DocumentSearchMatch } from "./api";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { results, isLoading, hasQuery } = useDocumentSearch(searchText, { fetchMetadata: true });

  // Fetch all documents to get their titles
  const { documents, isLoading: isLoadingDocuments } = useDocuments();

  // Fetch space ID for deep links (workaround via API)
  const { spaceId, isLoading: isLoadingSpaceId } = useSpaceId();

  // Create a map of document ID to title
  const documentTitles = useMemo(() => {
    const map = new Map<string, string>();

    for (const doc of documents) {
      map.set(doc.id, doc.title);
    }

    return map;
  }, [documents]);

  return (
    <List
      isLoading={isLoading || isLoadingDocuments || isLoadingSpaceId}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Craft documents..."
      throttle
    >
      <List.Section title="Results" subtitle={results.length > 0 ? `${results.length}` : undefined}>
        {results.map((doc, index) => (
          <DocumentListItem
            key={`${doc.documentId}-${index}`}
            document={doc}
            documentTitle={documentTitles.get(doc.documentId)}
            spaceId={spaceId}
          />
        ))}
      </List.Section>
      {!isLoading && !hasQuery && (
        <List.EmptyView icon={Icon.MagnifyingGlass} title="Start typing to search documents" />
      )}
      {!isLoading && hasQuery && results.length === 0 && (
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

function DocumentListItem({ document, documentTitle, spaceId }: { document: DocumentSearchMatch; documentTitle?: string; spaceId?: string }) {
  const lastModified = document.lastModifiedAt
    ? new Date(document.lastModifiedAt).toLocaleDateString()
    : undefined;

  const snippet = formatSnippet(document.markdown || "");

  console.log(documentTitle, snippet, document.markdown);

  return (
    <List.Item
      icon={Icon.Document}
      title={snippet || "Untitled"}
      subtitle={documentTitle}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in Craft"
              url={`craftdocs://open?spaceId=${spaceId}&blockId=${document.documentId}`}
            />
            <Action.CopyToClipboard title="Copy Document ID" content={document.documentId} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
