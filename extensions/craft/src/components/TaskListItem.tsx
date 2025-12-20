import { ActionPanel, Action, List, Icon, Color } from "@raycast/api";
import type { Task } from "../api";

export interface TaskListItemProps {
  task: Task;
  onComplete: () => void;
  onReopen: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onRefresh: () => void;
  extraActions?: React.ReactNode;
}

export function TaskListItem({
  task,
  onComplete,
  onReopen,
  onCancel,
  onDelete,
  onRefresh,
  extraActions,
}: TaskListItemProps) {
  const stateIcon = getStateIcon(task.taskInfo.state);
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
                  onAction={onComplete}
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
              url={`craftdocs://open?blockId=${task.id}`}
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

  // Add location info
  if (task.location?.title) {
    accessories.push({ tag: { value: task.location.title }, tooltip: "Document" });
  } else if (task.location?.type === "inbox") {
    accessories.push({ tag: { value: "Inbox", color: Color.Blue }, tooltip: "Location" });
  }

  // Add schedule date
  if (task.taskInfo.scheduleDate) {
    accessories.push({ date: new Date(task.taskInfo.scheduleDate), tooltip: "Scheduled" });
  }

  // Add deadline
  if (task.taskInfo.deadlineDate) {
    accessories.push({ tag: { value: task.taskInfo.deadlineDate, color: Color.Red }, tooltip: "Deadline" });
  }

  // Add repeat indicator
  if (task.repeat) {
    accessories.push({ icon: Icon.ArrowClockwise, tooltip: `Repeats ${task.repeat.frequency}` });
  }

  return accessories;
}

function getStateIcon(state: string): Icon {
  switch (state) {
    case "done":
      return Icon.CheckCircle;
    case "canceled":
      return Icon.XMarkCircle;
    default:
      return Icon.Circle;
  }
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^- \[.\] /, "")
    .replace(/\*\*/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
