import { ActionPanel, Action, List, Icon, open, Detail, Alert, confirmAlert, showToast, Toast, Color, Form, useNavigation } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState, useMemo } from "react";
import {
  useDocumentSearch,
  useDocuments,
  useRecentDocuments,
  useBlocks,
  searchBlocks,
  appendBlockId,
  deleteDocuments,
  moveDocuments,
  useFolders,
  type DocumentSearchMatch,
  type Document,
  type FlatFolder,
} from "./api";

type LocationFilter = "all" | "unsorted" | string; // string for folder IDs

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");

  const { userFolders, isLoading: isLoadingFolders } = useFolders();

  // Determine filter params based on location filter
  const isFolder = locationFilter !== "all" && locationFilter !== "unsorted";
  const locationParam = locationFilter === "all" ? undefined : (isFolder ? undefined : locationFilter as "unsorted");
  const folderIdParam = isFolder ? locationFilter : undefined;

  const { results, isLoading: isSearching, hasQuery } = useDocumentSearch(searchText, {
    fetchMetadata: true,
    location: locationParam,
  });

  // Fetch all documents for documentMap when searching (to get clickableLinks)
  const { documents: allDocsForMap, isLoading: isLoadingAllDocs } = useDocuments(
    { fetchMetadata: true, location: locationParam, folderId: folderIdParam },
    { execute: hasQuery },
  );

  // Fetch recent documents - use location filter when set
  const { documents: unfilteredDocs, isLoading: isLoadingUnfiltered, revalidate: revalidateUnfiltered } = useRecentDocuments();
  const { documents: filteredDocs, isLoading: isLoadingFiltered, revalidate: revalidateFiltered } = useDocuments(
    { fetchMetadata: true, location: locationParam, folderId: folderIdParam },
    { execute: locationFilter !== "all" },
  );

  // Use filtered docs when a filter is selected, otherwise recent docs
  const documents = useMemo(() => {
    if (locationFilter !== "all") {
      // Sort filtered docs by last modified (most recent first)
      return [...filteredDocs].sort((a, b) => {
        const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
        const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return unfilteredDocs;
  }, [unfilteredDocs, filteredDocs, locationFilter]);

  const isLoadingDocuments = locationFilter !== "all" ? isLoadingFiltered : isLoadingUnfiltered;
  const revalidateDocuments = locationFilter !== "all" ? revalidateFiltered : revalidateUnfiltered;

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

  const isLoading = isSearching || isLoadingFolders || (hasQuery ? isLoadingAllDocs : isLoadingDocuments);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Craft documents..."
      throttle
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by Location" value={locationFilter} onChange={(v) => setLocationFilter(v as LocationFilter)}>
          <List.Dropdown.Section title="Locations">
            <List.Dropdown.Item title="All Documents" value="all" icon={Icon.List} />
            <List.Dropdown.Item title="Unsorted" value="unsorted" icon={Icon.Document} />
          </List.Dropdown.Section>
          {userFolders.length > 0 && (
            <List.Dropdown.Section title="Folders">
              {userFolders.map((folder) => (
                <List.Dropdown.Item
                  key={folder.id}
                  title={"  ".repeat(folder.depth) + folder.name}
                  value={folder.id}
                  icon={Icon.Folder}
                />
              ))}
            </List.Dropdown.Section>
          )}
        </List.Dropdown>
      }
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
                allFolders={userFolders}
              />
            );
          })}
        </List.Section>
      ) : (
        <List.Section title="Recent Documents" subtitle={documents.length > 0 ? `${documents.length}` : undefined}>
          {documents.map((doc, index) => (
            <RecentDocumentItem key={`${doc.id}-${index}`} document={doc} onDelete={revalidateDocuments} allFolders={userFolders} />
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
  const cleaned = markdown.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

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
  allFolders,
}: {
  searchMatch: DocumentSearchMatch;
  document?: Document;
  searchText: string;
  allFolders: FlatFolder[];
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
        openUrl = appendBlockId(document.clickableLink, matchingBlock.blockId);
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
            <Action.Push
              title="Show Preview"
              icon={Icon.Eye}
              target={
                <DocumentPreview
                  documentId={searchMatch.documentId}
                  title={document?.title}
                  clickableLink={document?.clickableLink}
                />
              }
            />
            {document?.clickableLink && (
              <Action title="Open in App" icon={Icon.AppWindow} onAction={handleOpenInApp} />
            )}
            <Action.CopyToClipboard
              title="Copy Document ID"
              content={searchMatch.documentId}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.Push
              title="Move to Folder"
              icon={Icon.Folder}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={
                <MoveDocumentToFolderForm
                  documentId={searchMatch.documentId}
                  documentTitle={document?.title}
                  allFolders={allFolders}
                />
              }
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Move to Trash"
              icon={{ source: Icon.Trash, tintColor: Color.Red }}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: "Move to Trash",
                  message: `Are you sure you want to move "${document?.title || "Untitled"}" to trash?`,
                  primaryAction: {
                    title: "Move to Trash",
                    style: Alert.ActionStyle.Destructive,
                  },
                });
                if (!confirmed) return;
                try {
                  await deleteDocuments([searchMatch.documentId]);
                  await showToast({ style: Toast.Style.Success, title: "Moved to trash" });
                } catch (error) {
                  showFailureToast(error, { title: "Failed to delete" });
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function RecentDocumentItem({ document, onDelete, allFolders }: { document: Document; onDelete: () => void; allFolders: FlatFolder[] }) {
  const lastModified = document.lastModifiedAt ? new Date(document.lastModifiedAt).toLocaleDateString() : undefined;

  return (
    <List.Item
      title={document.title || "Untitled"}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Show Preview"
              icon={Icon.Eye}
              target={
                <DocumentPreview
                  documentId={document.id}
                  title={document.title}
                  clickableLink={document.clickableLink}
                />
              }
            />
            {document.clickableLink && <Action.Open title="Open in App" target={document.clickableLink} icon={Icon.AppWindow} />}
            <Action.CopyToClipboard
              title="Copy Document ID"
              content={document.id}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.Push
              title="Move to Folder"
              icon={Icon.Folder}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={
                <MoveDocumentToFolderForm
                  documentId={document.id}
                  documentTitle={document.title}
                  allFolders={allFolders}
                  onMoved={onDelete}
                />
              }
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Move to Trash"
              icon={{ source: Icon.Trash, tintColor: Color.Red }}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: "Move to Trash",
                  message: `Are you sure you want to move "${document.title || "Untitled"}" to trash?`,
                  primaryAction: {
                    title: "Move to Trash",
                    style: Alert.ActionStyle.Destructive,
                  },
                });
                if (!confirmed) return;
                try {
                  await deleteDocuments([document.id]);
                  await showToast({ style: Toast.Style.Success, title: "Moved to trash" });
                  onDelete();
                } catch (error) {
                  showFailureToast(error, { title: "Failed to delete" });
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function DocumentPreview({
  documentId,
  title,
  clickableLink,
}: {
  documentId: string;
  title?: string;
  clickableLink?: string;
}) {
  const { isLoading, blocks } = useBlocks({ id: documentId, maxDepth: -1 });

  // Convert blocks to markdown for display
  const markdown = useMemo(() => {
    if (isLoading) return "loading document...";
    if (!blocks || blocks.length === 0) return "No content";

    const renderBlock = (block: { markdown?: string; content?: typeof blocks }): string => {
      let result = block.markdown || "";
      if (block.content && block.content.length > 0) {
        result += "\n" + block.content.map(renderBlock).join("\n");
      }
      return result;
    };

    return blocks.map(renderBlock).join("\n\n");
  }, [blocks, isLoading]);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={title || "Document Preview"}
      actions={
        <ActionPanel>
          {clickableLink && <Action.Open title="Open in App" target={clickableLink} icon={Icon.AppWindow} />}
          <Action.CopyToClipboard title="Copy Document ID" content={documentId} />
        </ActionPanel>
      }
    />
  );
}

function MoveDocumentToFolderForm({
  documentId,
  documentTitle,
  allFolders,
  onMoved,
}: {
  documentId: string;
  documentTitle?: string;
  allFolders: FlatFolder[];
  onMoved?: () => void;
}) {
  const { pop } = useNavigation();
  const [destination, setDestination] = useState<string>("unsorted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (destination === "unsorted" || destination === "templates") {
        await moveDocuments([documentId], { destination });
      } else {
        await moveDocuments([documentId], { folderId: destination });
      }
      await showToast({ style: Toast.Style.Success, title: "Document Moved", message: documentTitle });
      onMoved?.();
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to move document" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Move Document" icon={Icon.ArrowRight} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Moving" text={documentTitle || "Untitled"} />
      <Form.Dropdown id="destination" title="Destination" value={destination} onChange={setDestination}>
        <Form.Dropdown.Section title="Locations">
          <Form.Dropdown.Item value="unsorted" title="Unsorted" icon={Icon.Document} />
          <Form.Dropdown.Item value="templates" title="Templates" icon={Icon.BlankDocument} />
        </Form.Dropdown.Section>
        {allFolders.length > 0 && (
          <Form.Dropdown.Section title="Folders">
            {allFolders.map((f) => (
              <Form.Dropdown.Item key={f.id} value={f.id} title={"  ".repeat(f.depth) + f.name} icon={Icon.Folder} />
            ))}
          </Form.Dropdown.Section>
        )}
      </Form.Dropdown>
    </Form>
  );
}
