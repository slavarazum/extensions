import { ActionPanel, Action, List, Icon, Color, useNavigation } from "@raycast/api";
import { useState } from "react";
import { useDocuments, useBlocks, type Block, type Document } from "./api";

type DateRange = "month" | "3months" | "all";

const DATE_RANGE_CONFIG: Record<DateRange, { title: string; days: number | null }> = {
  month: { title: "Last Month", days: 30 },
  "3months": { title: "Last 3 Months", days: 90 },
  all: { title: "All", days: null },
};

/**
 * Format a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
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

  const { documents, isLoading, revalidate } = useDocuments({
    location: "daily_notes",
    dailyNoteDateGte: startDate,
    dailyNoteDateLte: "today",
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
  const yesterday = yesterdayDate.toISOString().split("T")[0];

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
                    onAction={() => push(<DailyNoteDetail note={{ id: doc.id, date: noteDate, link: doc.clickableLink }} />)}
                  />
                  {doc.clickableLink && <Action.Open title="Open in Craft" target={doc.clickableLink} icon={Icon.AppWindow} />}
                  {doc.clickableLink && <Action.CopyToClipboard title="Copy Deep Link" content={doc.clickableLink} icon={Icon.Link} />}
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    onAction={revalidate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
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

function DailyNoteDetail({ note }: DailyNoteDetailProps) {
  const { pop } = useNavigation();
  // Fetch blocks using document ID
  const { blocks, isLoading, revalidate } = useBlocks({ id: note.id });

  const contentBlocks = blocks.filter((block) => block.markdown?.trim());

  return (
    <List
      isLoading={isLoading}
      navigationTitle={getDateLabel(note.date)}
      searchBarPlaceholder="Filter daily note content..."
    >
      <List.Section title={getDateLabel(note.date)} subtitle={`${contentBlocks.length} items`}>
        {contentBlocks.map((block) => (
          <BlockListItem key={block.id} block={block} craftLink={note.link} onRefresh={revalidate} onBack={pop} />
        ))}
      </List.Section>
      {!isLoading && contentBlocks.length === 0 && (
        <List.EmptyView
          icon={Icon.Calendar}
          title="Empty daily note"
          description={`No content in ${getDateLabel(note.date).toLowerCase()}'s daily note`}
          actions={
            <ActionPanel>
              <Action title="Go Back" icon={Icon.ArrowLeft} onAction={pop} />
              {note.link && <Action.Open title="Open in Craft" target={note.link} icon={Icon.AppWindow} />}
              {note.link && <Action.CopyToClipboard title="Copy Deep Link" content={note.link} icon={Icon.Link} />}
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

interface BlockListItemProps {
  block: Block;
  craftLink?: string;
  onRefresh: () => void;
  onBack: () => void;
}

function BlockListItem({ block, craftLink, onRefresh, onBack }: BlockListItemProps) {
  const icon = getBlockIcon(block);
  const accessories = getBlockAccessories(block);

  return (
    <List.Item
      icon={icon}
      title={cleanMarkdown(block.markdown || "")}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {craftLink && <Action.Open title="Open in Craft" target={craftLink} icon={Icon.AppWindow} />}
            {craftLink && <Action.CopyToClipboard title="Copy Deep Link" content={craftLink} icon={Icon.Link} />}
            <Action
              title="Go Back"
              icon={Icon.ArrowLeft}
              onAction={onBack}
              shortcut={{ modifiers: ["cmd"], key: "[" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard title="Copy Content" content={block.markdown || ""} />
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              onAction={onRefresh}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function getBlockIcon(block: Block): { source: Icon; tintColor?: Color } {
  if (block.listStyle === "task" && block.taskInfo) {
    switch (block.taskInfo.state) {
      case "done":
        return { source: Icon.CheckCircle, tintColor: Color.Green };
      case "canceled":
        return { source: Icon.XMarkCircle, tintColor: Color.SecondaryText };
      default:
        return { source: Icon.Circle };
    }
  }

  switch (block.listStyle) {
    case "bullet":
      return { source: Icon.Dot };
    case "numbered":
      return { source: Icon.List };
    case "toggle":
      return { source: Icon.ChevronRight };
    default:
      break;
  }

  switch (block.textStyle) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
      return { source: Icon.Text };
    case "card":
    case "page":
      return { source: Icon.Document };
    default:
      return { source: Icon.Minus };
  }
}

function getBlockAccessories(block: Block): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];

  if (block.taskInfo?.scheduleDate) {
    accessories.push({ date: new Date(block.taskInfo.scheduleDate), tooltip: "Scheduled" });
  }
  if (block.taskInfo?.deadlineDate) {
    accessories.push({
      tag: { value: block.taskInfo.deadlineDate, color: Color.Red },
      tooltip: "Deadline",
    });
  }

  if (block.textStyle && ["h1", "h2", "h3", "h4"].includes(block.textStyle)) {
    accessories.push({ tag: block.textStyle.toUpperCase() });
  }

  return accessories;
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^- \[.\] /, "")
    .replace(/^[-*] /, "")
    .replace(/^\d+\. /, "")
    .replace(/\*\*/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
