import { ActionPanel, Action, List, Icon, Detail, Color } from "@raycast/api";
import { useState } from "react";
import {
  useDocuments,
  useBlockSearch,
  useDocumentSearch,
  type SearchMatch,
  type DocumentSearchMatch,
} from "./api";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all");

  // Fetch documents for the dropdown
  const { documents, isLoading: isLoadingDocuments } = useDocuments();

  // Determine search mode
  const isSearchingAllDocs = selectedDocumentId === "all";
  const canSearch = searchText.length > 0;

  // Search within specific document (only when a specific doc is selected)
  const { matches: blockMatches, isLoading: isSearchingBlocks } = useBlockSearch(
    isSearchingAllDocs ? "" : selectedDocumentId,
    searchText,
    { beforeBlockCount: 3, afterBlockCount: 3 },
  );

  // Search across all documents (only when "all" is selected)
  const { results: docResults, isLoading: isSearchingDocs } = useDocumentSearch(
    isSearchingAllDocs ? searchText : "",
  );

  // Combine results - normalize to a common format
  const searchResults: SearchMatch[] = isSearchingAllDocs
    ? docResults.map((item: DocumentSearchMatch) => ({
        documentId: item.documentId,
        markdown: item.markdown,
      }))
    : blockMatches;

  const isLoading = isLoadingDocuments || (canSearch && (isSearchingBlocks || isSearchingDocs));
  const hasResults = searchResults.length > 0;

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search blocks..."
      throttle
      searchBarAccessory={
        <List.Dropdown tooltip="Select Document" value={selectedDocumentId} onChange={setSelectedDocumentId}>
          <List.Dropdown.Item title="All Documents" value="all" icon={Icon.Globe} />
          <List.Dropdown.Section title="Documents">
            {documents.map((doc) => (
              <List.Dropdown.Item key={doc.id} title={doc.title || "Untitled"} value={doc.id} icon={Icon.Document} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {!canSearch ? (
        <List.EmptyView icon={Icon.MagnifyingGlass} title="Start typing to search blocks" />
      ) : !hasResults && !isLoading ? (
        <List.EmptyView
          icon={Icon.XMarkCircle}
          title="No results found"
          description={`No blocks match "${searchText}"`}
        />
      ) : (
        <List.Section title="Search Results" subtitle={`${searchResults.length} matches`}>
          {searchResults.map((match, index) => (
            <SearchResultItem key={`${match.documentId || match.blockId}-${index}`} match={match} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function SearchResultItem({ match }: { match: SearchMatch }) {
  // Clean up markdown for display
  const displayText = cleanMarkdown(match.markdown);
  const truncatedText = displayText.length > 100 ? displayText.substring(0, 100) + "..." : displayText;

  // Build path breadcrumb if available
  const pathBreadcrumb = match.pageBlockPath?.map((p) => p.content).join(" → ");

  return (
    <List.Item
      icon={Icon.TextDocument}
      title={truncatedText || "Empty block"}
      subtitle={pathBreadcrumb}
      accessories={
        [
          match.documentId ? { tag: { value: "Document", color: Color.Blue } } : null,
          match.blockId ? { text: match.blockId.substring(0, 8) } : null,
        ].filter(Boolean) as { tag?: { value: string; color: Color }; text?: string }[]
      }
      actions={
        <ActionPanel>
          <Action.Push title="View Details" icon={Icon.Eye} target={<BlockDetailView match={match} />} />
          {match.documentId && (
            <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${match.documentId}`} />
          )}
          {match.blockId && (
            <Action.OpenInBrowser title="Open Block in Craft" url={`craftdocs://open?blockId=${match.blockId}`} />
          )}
          <Action.CopyToClipboard
            title="Copy Content"
            content={match.markdown}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

function BlockDetailView({ match }: { match: SearchMatch }) {
  let markdown = "# Block Content\n\n";

  // Show path if available
  if (match.pageBlockPath && match.pageBlockPath.length > 0) {
    markdown += "**Path:** " + match.pageBlockPath.map((p) => p.content).join(" → ") + "\n\n---\n\n";
  }

  // Show before blocks context
  if (match.beforeBlocks && match.beforeBlocks.length > 0) {
    markdown += "## Context Before\n\n";
    for (const block of match.beforeBlocks) {
      markdown += cleanMarkdown(block.markdown) + "\n\n";
    }
    markdown += "---\n\n";
  }

  // Show matched content
  markdown += "## Matched Block\n\n";
  markdown += "**" + match.markdown + "**\n\n";

  // Show after blocks context
  if (match.afterBlocks && match.afterBlocks.length > 0) {
    markdown += "---\n\n## Context After\n\n";
    for (const block of match.afterBlocks) {
      markdown += cleanMarkdown(block.markdown) + "\n\n";
    }
  }

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          {match.documentId && <Detail.Metadata.Label title="Document ID" text={match.documentId} />}
          {match.blockId && <Detail.Metadata.Label title="Block ID" text={match.blockId} />}
          {match.pageBlockPath && match.pageBlockPath.length > 0 && (
            <Detail.Metadata.TagList title="Path">
              {match.pageBlockPath.map((p) => (
                <Detail.Metadata.TagList.Item key={p.id} text={p.content} color={Color.Blue} />
              ))}
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {match.documentId && (
            <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${match.documentId}`} />
          )}
          {match.blockId && (
            <Action.OpenInBrowser title="Open Block in Craft" url={`craftdocs://open?blockId=${match.blockId}`} />
          )}
          <Action.CopyToClipboard
            title="Copy Content"
            content={match.markdown}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

function cleanMarkdown(markdown: string): string {
  // Remove page tags and other structural markup
  return markdown
    .replace(/<page>|<\/page>/g, "")
    .replace(/<card>|<\/card>/g, "")
    .replace(/\*\*/g, "")
    .trim();
}
