import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { useDocumentSearch, useDocuments, type DocumentSearchMatch, type Document } from "./api";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { results, isLoading, hasQuery } = useDocumentSearch(searchText, { fetchMetadata: true });

  // Fetch all documents to get their titles and clickable links (only when searching)
  const { documents, isLoading: isLoadingDocuments } = useDocuments({ fetchMetadata: true }, { execute: hasQuery });

  // Create a map of document ID to document info
  const documentMap = useMemo(() => {
    const map = new Map<string, Document>();

    for (const doc of documents) {
      map.set(doc.id, doc);
    }

    return map;
  }, [documents]);

  return (
    <List
      isLoading={isLoading || isLoadingDocuments}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Craft documents..."
      throttle
    >
      <List.Section title="Results" subtitle={results.length > 0 ? `${results.length}` : undefined}>
        {results.map((doc, index) => {
          const docInfo = documentMap.get(doc.documentId);
          return (
            <DocumentListItem
              key={`${doc.documentId}-${index}`}
              searchMatch={doc}
              document={docInfo}
            />
          );
        })}
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

function DocumentListItem({ searchMatch, document }: { searchMatch: DocumentSearchMatch; document?: Document }) {
  const lastModified = searchMatch.lastModifiedAt
    ? new Date(searchMatch.lastModifiedAt).toLocaleDateString()
    : undefined;

  const snippet = formatSnippet(searchMatch.markdown || "");

  return (
    <List.Item
      icon={Icon.Document}
      title={snippet || "Untitled"}
      subtitle={document?.title}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {document?.clickableLink && (
              <Action.OpenInBrowser
                title="Open in Craft"
                url={document.clickableLink}
              />
            )}
            <Action.CopyToClipboard title="Copy Document ID" content={searchMatch.documentId} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
