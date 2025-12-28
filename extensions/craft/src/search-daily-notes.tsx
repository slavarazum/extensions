import { ActionPanel, Action, List, Icon, open, Detail } from "@raycast/api";
import { useState, useMemo } from "react";
import {
  useDocumentSearch,
  useDocuments,
  useBlocks,
  searchBlocks,
  appendBlockId,
  type DocumentSearchMatch,
  type Document,
} from "./api";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { results, isLoading: isSearching, hasQuery } = useDocumentSearch(searchText, {
    fetchMetadata: true,
    location: "daily_notes",
  });

  // Fetch daily notes for documentMap (to get clickableLinks)
  const { documents: dailyNotes, isLoading: isLoadingDailyNotes } = useDocuments({
    location: "daily_notes",
    fetchMetadata: true,
  });

  // Create a map of document ID to document info for search results
  const documentMap = useMemo(() => {
    const map = new Map<string, Document>();
    for (const doc of dailyNotes) {
      map.set(doc.id, doc);
    }
    return map;
  }, [dailyNotes]);

  // Sort daily notes by date descending (most recent first)
  const sortedDailyNotes = useMemo(() => {
    return [...dailyNotes].sort((a, b) => {
      const dateA = a.dailyNoteDate || a.title;
      const dateB = b.dailyNoteDate || b.title;
      return dateB.localeCompare(dateA);
    });
  }, [dailyNotes]);

  const isLoading = isSearching || isLoadingDailyNotes;

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search daily notes..."
      throttle
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
        <List.Section title="Daily Notes" subtitle={sortedDailyNotes.length > 0 ? `${sortedDailyNotes.length}` : undefined}>
          {sortedDailyNotes.map((doc, index) => (
            <DailyNoteItem key={`${doc.id}-${index}`} document={doc} />
          ))}
        </List.Section>
      )}
      {!isSearching && !isLoadingDailyNotes && !hasQuery && sortedDailyNotes.length === 0 && (
        <List.EmptyView icon={Icon.Calendar} title="No daily notes found" />
      )}
      {!isSearching && hasQuery && results.length === 0 && (
        <List.EmptyView icon={Icon.Calendar} title="No results found" description="Try a different search term" />
      )}
    </List>
  );
}

/**
 * Clean up markdown snippet for display in a list item.
 */
function formatSnippet(markdown: string, maxLength = 80): string {
  const cleaned = markdown.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Find the first highlight position
  const highlightStart = cleaned.indexOf("**");
  if (highlightStart === -1) {
    return cleaned.slice(0, maxLength) + "...";
  }

  const highlightEnd = cleaned.indexOf("**", highlightStart + 2);
  const highlightLength = highlightEnd !== -1 ? highlightEnd + 2 - highlightStart : 20;

  const padding = Math.floor((maxLength - highlightLength) / 2);
  let start = Math.max(0, highlightStart - padding);
  let end = Math.min(cleaned.length, highlightStart + highlightLength + padding);

  if (start === 0) {
    end = Math.min(cleaned.length, maxLength);
  } else if (end === cleaned.length) {
    start = Math.max(0, cleaned.length - maxLength);
  }

  let result = cleaned.slice(start, end);

  if (start > 0) {
    result = "..." + result;
  }
  if (end < cleaned.length) {
    result = result + "...";
  }

  return result;
}

/**
 * Format daily note date for display
 */
function formatDailyNoteDate(doc: Document): string {
  const dateStr = doc.dailyNoteDate;
  if (!dateStr) return doc.title || "Untitled";

  try {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return doc.title || "Untitled";
  }
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
  const snippet = formatSnippet(searchMatch.markdown || "");

  const normalizeMarkdown = (md: string): string => {
    return md
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const handleOpenInApp = async () => {
    if (!document?.clickableLink) return;

    let openUrl = document.clickableLink;

    try {
      const blockMatches = await searchBlocks({
        blockId: searchMatch.documentId,
        pattern: searchText,
        beforeBlockCount: 0,
        afterBlockCount: 0,
      });

      const normalizedClickedMarkdown = normalizeMarkdown(searchMatch.markdown || "");

      const matchingBlock = blockMatches.find((match) => {
        if (!match.markdown) return false;
        const normalizedBlockMarkdown = normalizeMarkdown(match.markdown);
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
      icon={Icon.Calendar}
      title={snippet || "Untitled"}
      subtitle={document ? formatDailyNoteDate(document) : undefined}
      accessories={document?.dailyNoteDate ? [{ text: document.dailyNoteDate }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {document?.clickableLink && (
              <Action title="Open in App" icon={Icon.AppWindow} onAction={handleOpenInApp} />
            )}
            <Action.Push
              title="Show Preview"
              icon={Icon.Eye}
              target={
                <DailyNotePreview
                  documentId={searchMatch.documentId}
                  title={document ? formatDailyNoteDate(document) : undefined}
                  clickableLink={document?.clickableLink}
                />
              }
              shortcut={{ modifiers: ["cmd"], key: "y" }}
            />
            {document?.clickableLink && (
              <Action.CopyToClipboard
                title="Copy Deep Link"
                content={document.clickableLink}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function DailyNoteItem({ document }: { document: Document }) {
  return (
    <List.Item
      icon={Icon.Calendar}
      title={formatDailyNoteDate(document)}
      accessories={document.dailyNoteDate ? [{ text: document.dailyNoteDate }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {document.clickableLink && (
              <Action.Open title="Open in App" target={document.clickableLink} icon={Icon.AppWindow} />
            )}
            <Action.Push
              title="Show Preview"
              icon={Icon.Eye}
              target={
                <DailyNotePreview
                  documentId={document.id}
                  title={formatDailyNoteDate(document)}
                  clickableLink={document.clickableLink}
                />
              }
              shortcut={{ modifiers: ["cmd"], key: "y" }}
            />
            {document.clickableLink && (
              <Action.CopyToClipboard
                title="Copy Deep Link"
                content={document.clickableLink}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function DailyNotePreview({
  documentId,
  title,
  clickableLink,
}: {
  documentId: string;
  title?: string;
  clickableLink?: string;
}) {
  const { isLoading, blocks } = useBlocks({ id: documentId, maxDepth: -1 });

  const markdown = useMemo(() => {
    if (isLoading) return "Loading daily note...";
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
      navigationTitle={title || "Daily Note"}
      actions={
        <ActionPanel>
          {clickableLink && <Action.Open title="Open in App" target={clickableLink} icon={Icon.AppWindow} />}
          <Action.CopyToClipboard title="Copy Document ID" content={documentId} />
        </ActionPanel>
      }
    />
  );
}
