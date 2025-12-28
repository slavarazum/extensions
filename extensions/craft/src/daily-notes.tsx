import {
  ActionPanel,
  Action,
  List,
  Detail,
  Icon,
  Color,
  useNavigation,
  Alert,
  confirmAlert,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { useDocuments, useBlocks, deleteDocuments, type Document } from "./api";

type DateRange = "month" | "3months" | "all";

const DATE_RANGE_CONFIG: Record<DateRange, { title: string; days: number | null }> = {
  month: { title: "Last Month", days: 30 },
  "3months": { title: "Last 3 Months", days: 90 },
  all: { title: "All", days: null },
};

/**
 * Format a date as YYYY-MM-DD in local timezone
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get date label for display
 */
function getDateLabel(dateStr: string): string {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const tomorrow = formatDate(new Date(Date.now() + 86400000));

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  if (dateStr === tomorrow) return "Tomorrow";

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/**
 * Extract date from daily note document.
 * Priority:
 * 1. dailyNoteDate field (YYYY-MM-DD from API)
 * 2. Title in YYYY-MM-DD format
 * 3. Parse title as date string (e.g., "Tuesday, December 16, 2025")
 */
function extractDateFromDocument(doc: Document): string | null {
  // Use dailyNoteDate field if available (API returns this for daily notes)
  if (doc.dailyNoteDate) return doc.dailyNoteDate;

  // Try YYYY-MM-DD format in title
  const isoMatch = doc.title?.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return doc.title;

  // Parse full date format like "Tuesday, December 16, 2025"
  if (doc.title) {
    // Remove weekday prefix if present (e.g., "Tuesday, ")
    const withoutWeekday = doc.title.replace(/^\w+,\s*/, "");
    const parsed = new Date(withoutWeekday);
    if (!isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }
  }

  return null;
}

interface SelectedNote {
  id: string;
  date: string;
  link?: string;
}

export default function Command() {
  const { push } = useNavigation();
  const [dateRange, setDateRange] = useState<DateRange>("month");

  const config = DATE_RANGE_CONFIG[dateRange];
  const startDate = config.days ? formatDate(new Date(Date.now() - config.days * 86400000)) : undefined;
  // For "All" filter (no days limit), don't restrict the end date so future notes are included
  const endDate = config.days ? "today" : undefined;

  const { documents, isLoading, revalidate } = useDocuments({
    location: "daily_notes",
    dailyNoteDateGte: startDate,
    dailyNoteDateLte: endDate,
    fetchMetadata: true,
  });

  const today = formatDate(new Date());

  // Sort documents by date descending
  const sortedDocs = [...documents].sort((a, b) => {
    const dateA = extractDateFromDocument(a) || a.title;
    const dateB = extractDateFromDocument(b) || b.title;
    return dateB.localeCompare(dateA);
  });

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDate(yesterdayDate);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter daily notes..."
      searchBarAccessory={
        <List.Dropdown tooltip="Date Range" value={dateRange} onChange={(v) => setDateRange(v as DateRange)}>
          <List.Dropdown.Item title="Last Month" value="month" />
          <List.Dropdown.Item title="Last 3 Months" value="3months" />
          <List.Dropdown.Item title="All" value="all" />
        </List.Dropdown>
      }
    >
      <List.Section title="Daily Notes" subtitle={`${sortedDocs.length}`}>
        {sortedDocs.map((doc) => {
          const noteDate = extractDateFromDocument(doc) || doc.title;
          const isToday = noteDate === today;
          const isYesterday = noteDate === yesterday;

          const getIcon = () => {
            if (isToday) return { source: Icon.Calendar, tintColor: Color.Blue };
            if (isYesterday) return { source: Icon.Calendar, tintColor: Color.Orange };
            return Icon.Calendar;
          };

          return (
            <List.Item
              key={doc.id}
              icon={getIcon()}
              title={getDateLabel(noteDate)}
              subtitle={noteDate}
              actions={
                <ActionPanel>
                  <Action
                    title="View Daily Note"
                    icon={Icon.Eye}
                    onAction={() =>
                      push(<DailyNoteMarkdownDetail note={{ id: doc.id, date: noteDate, link: doc.clickableLink }} />)
                    }
                  />
                  {doc.clickableLink && (
                    <Action.Open title="Open in App" target={doc.clickableLink} icon={Icon.AppWindow} />
                  )}
                  {doc.clickableLink && (
                    <Action.CopyToClipboard title="Copy Deep Link" content={doc.clickableLink} icon={Icon.Link} />
                  )}
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    onAction={revalidate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                  <Action
                    title="Move to Trash"
                    icon={{ source: Icon.Trash, tintColor: Color.Red }}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={async () => {
                      const confirmed = await confirmAlert({
                        title: "Move to Trash",
                        message: `Are you sure you want to move the daily note for ${getDateLabel(noteDate)} to trash?`,
                        primaryAction: {
                          title: "Move to Trash",
                          style: Alert.ActionStyle.Destructive,
                        },
                      });
                      if (!confirmed) return;
                      try {
                        await deleteDocuments([doc.id]);
                        await showToast({ style: Toast.Style.Success, title: "Moved to trash" });
                        revalidate();
                      } catch (error) {
                        showFailureToast(error, { title: "Failed to delete" });
                      }
                    }}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
      {!isLoading && sortedDocs.length === 0 && (
        <List.EmptyView
          icon={Icon.Calendar}
          title="No daily notes found"
          description={`No daily notes in ${config.title.toLowerCase()}`}
        />
      )}
    </List>
  );
}

interface DailyNoteDetailProps {
  note: SelectedNote;
}

function DailyNoteMarkdownDetail({ note }: DailyNoteDetailProps) {
  const { pop } = useNavigation();
  const { blocks, isLoading, revalidate } = useBlocks({ id: note.id });

  // Join markdown content from blocks directly
  const markdown = blocks
    .filter((block) => block.markdown?.trim())
    .map((block) => block.markdown)
    .join("\n\n");

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={getDateLabel(note.date)}
      markdown={markdown || `*No content in ${getDateLabel(note.date)}'s daily note*`}
      actions={
        <ActionPanel>
          {note.link && <Action.Open title="Open in App" target={note.link} icon={Icon.AppWindow} />}
          {note.link && <Action.CopyToClipboard title="Copy Deep Link" content={note.link} icon={Icon.Link} />}
          <Action title="Go Back" icon={Icon.ArrowLeft} onAction={pop} shortcut={{ modifiers: ["cmd"], key: "[" }} />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            onAction={revalidate}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
          <Action.CopyToClipboard
            title="Copy Markdown"
            content={markdown}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
