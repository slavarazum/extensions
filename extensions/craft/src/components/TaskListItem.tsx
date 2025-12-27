import { ActionPanel, Action, List, Icon, Color, confirmAlert, Alert } from "@raycast/api";
import { blockLink, type Task } from "../api";

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
}: TaskListItemProps) {
  const stateIcon = isCompleting
    ? { source: Icon.CheckCircle, tintColor: Color.Green }
    : getStateIcon(task.taskInfo.state);
  const accessories = buildAccessories(task);

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

function buildAccessories(task: Task): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Add schedule date (red if overdue)
  if (task.taskInfo.scheduleDate) {
    const isOverdue = task.taskInfo.state === "todo" && task.taskInfo.scheduleDate < today;
    if (isOverdue) {
      const overdueDate = new Date(task.taskInfo.scheduleDate);
      const formatted = overdueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      accessories.push({
        tag: { value: formatted, color: Color.Red },
        tooltip: "Overdue",
      });
    } else {
      accessories.push({ date: new Date(task.taskInfo.scheduleDate), tooltip: "Scheduled" });
    }
  }

  // Add deadline
  if (task.taskInfo.deadlineDate) {
    accessories.push({ tag: { value: task.taskInfo.deadlineDate, color: Color.Red }, tooltip: "Deadline" });
  }

  // Add repeat indicator
  if (task.repeat) {
    accessories.push({ icon: Icon.ArrowClockwise, tooltip: `Repeats ${task.repeat.frequency}` });
  }

  // Add location info (always last)
  if (task.location?.title) {
    accessories.push({ tag: { value: task.location.title }, tooltip: "Document" });
  } else if (task.location?.type === "inbox") {
    accessories.push({ tag: { value: "Inbox", color: Color.Blue }, tooltip: "Location" });
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
