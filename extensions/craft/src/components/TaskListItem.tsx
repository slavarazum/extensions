import { ActionPanel, Action, List, Icon, Color, confirmAlert, Alert } from "@raycast/api";
import { blockLink, formatLocalDate, type Task } from "../api";

export interface TaskListItemProps {
  task: Task;
  onComplete: () => void;
  onReopen: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onRefresh: () => void;
  extraActions?: React.ReactNode;
  /** Show as completing (green checkmark, will be removed) */
  isCompleting?: boolean;
  /** Hide the location badge (e.g., when viewing inbox tasks) */
  hideLocation?: boolean;
  /** Hide "Today" schedule date (e.g., when viewing today's tasks) */
  hideTodaySchedule?: boolean;
}

export function TaskListItem({
  task,
  onComplete,
  onReopen,
  onCancel,
  onDelete,
  onRefresh,
  extraActions,
  isCompleting = false,
  hideLocation = false,
  hideTodaySchedule = false,
}: TaskListItemProps) {
  const stateIcon = isCompleting
    ? { source: Icon.CheckCircle, tintColor: Color.Green }
    : getStateIcon(task.taskInfo.state);
  const accessories = buildAccessories(task, hideLocation, hideTodaySchedule);

  return (
    <List.Item
      icon={stateIcon}
      title={cleanMarkdown(task.markdown)}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {task.taskInfo.state === "todo" ? (
              <>
                <Action
                  title="Complete"
                  icon={{ source: Icon.CheckCircle, tintColor: Color.Green }}
                  onAction={async () => {
                    if (
                      await confirmAlert({
                        title: "Complete Task",
                        message: "Are you sure you want to mark this task as complete?",
                        primaryAction: { title: "Complete", style: Alert.ActionStyle.Default },
                      })
                    ) {
                      onComplete();
                    }
                  }}
                />
                {onCancel && (
                  <Action
                    title="Cancel"
                    icon={Icon.XMarkCircle}
                    onAction={onCancel}
                    shortcut={{ modifiers: ["cmd"], key: "x" }}
                  />
                )}
              </>
            ) : (
              <Action title="Reopen" icon={Icon.Circle} onAction={onReopen} />
            )}
            <Action.OpenInBrowser
              title="Open in Craft"
              url={blockLink(task.id)}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
          </ActionPanel.Section>
          {extraActions && <ActionPanel.Section>{extraActions}</ActionPanel.Section>}
          <ActionPanel.Section>
            {onDelete && (
              <Action
                title="Delete"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={onDelete}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
              />
            )}
            <Action.CopyToClipboard title="Copy" content={task.markdown} />
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

function buildAccessories(task: Task, hideLocation: boolean, hideTodaySchedule: boolean): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];
  const today = formatLocalDate(new Date());

  // Add schedule date (red if overdue, skip "Today" if hideTodaySchedule is true)
  if (task.taskInfo.scheduleDate) {
    const isToday = task.taskInfo.scheduleDate === today;
    const isOverdue = task.taskInfo.state === "todo" && task.taskInfo.scheduleDate < today;

    // Skip showing "Today" schedule in today view (it's redundant)
    if (!(hideTodaySchedule && isToday)) {
      const scheduleFormatted = formatScheduleDate(task.taskInfo.scheduleDate, today);
      if (isOverdue) {
        accessories.push({
          tag: { value: scheduleFormatted, color: Color.Red },
          tooltip: "Overdue",
        });
      } else {
        accessories.push({ text: scheduleFormatted, tooltip: "Scheduled" });
      }
    }
  }

  // Add deadline with flag icon on gray background (matching Craft app style)
  if (task.taskInfo.deadlineDate) {
    const deadlineFormatted = formatDeadlineDate(task.taskInfo.deadlineDate, today);
    const isOverdue = task.taskInfo.state === "todo" && task.taskInfo.deadlineDate < today;
    accessories.push({
      icon: { source: Icon.Flag, tintColor: isOverdue ? Color.Red : Color.SecondaryText },
      tag: {
        value: deadlineFormatted,
        color: isOverdue ? Color.Red : Color.SecondaryText,
      },
      tooltip: "Deadline",
    });
  }

  // Add repeat indicator
  if (task.repeat) {
    accessories.push({ icon: Icon.ArrowClockwise, tooltip: `Repeats ${task.repeat.frequency}` });
  }

  // Add location info (always last)
  if (!hideLocation) {
    if (task.location?.title) {
      accessories.push({ tag: { value: task.location.title }, tooltip: "Document" });
    } else if (task.location?.type === "inbox") {
      accessories.push({ tag: { value: "Inbox", color: Color.Blue }, tooltip: "Location" });
    }
  }

  return accessories;
}

function getStateIcon(state: string): { source: Icon; tintColor?: Color } {
  switch (state) {
    case "done":
      return { source: Icon.CheckCircle, tintColor: Color.Green };
    case "canceled":
      return { source: Icon.XMarkCircle, tintColor: Color.SecondaryText };
    default:
      return { source: Icon.Circle };
  }
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^- \[.\] /, "")
    .replace(/\*\*/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function formatDeadlineDate(dateStr: string, today: string): string {
  const deadline = new Date(dateStr + "T00:00:00");
  const todayDate = new Date(today + "T00:00:00");

  const diffTime = deadline.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else {
    // Format as "Dec 31" style
    return deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatScheduleDate(dateStr: string, today: string): string {
  const schedule = new Date(dateStr + "T00:00:00");
  const todayDate = new Date(today + "T00:00:00");

  const diffTime = schedule.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else {
    // Format as "Dec 28" style
    return schedule.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
