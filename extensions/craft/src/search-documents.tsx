import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useState } from "react";
import { useDocumentSearch, type DocumentSearchMatch } from "./api";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { results, isLoading, hasQuery } = useDocumentSearch(searchText, { fetchMetadata: true });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Craft documents..."
      throttle
    >
      <List.Section title="Results" subtitle={results.length > 0 ? `${results.length}` : undefined}>
        {results.map((doc, index) => (
          <DocumentListItem key={`${doc.documentId}-${index}`} document={doc} />
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

function DocumentListItem({ document }: { document: DocumentSearchMatch }) {
  const lastModified = document.lastModifiedAt
    ? new Date(document.lastModifiedAt).toLocaleDateString()
    : undefined;

  return (
    <List.Item
      icon={Icon.Document}
      title={document.markdown || "Untitled"}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${document.documentId}`} />
            <Action.CopyToClipboard title="Copy Document ID" content={document.documentId} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
