import { ActionPanel, Action, List, Icon, Color, Toast, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { useTasks, useTaskActions, type Task, type TaskScope } from "./api";

const SCOPE_OPTIONS: { value: TaskScope; title: string; icon: Icon }[] = [
  { value: "active", title: "Active", icon: Icon.Clock },
  { value: "upcoming", title: "Upcoming", icon: Icon.Calendar },
  { value: "inbox", title: "Inbox", icon: Icon.Tray },
  { value: "logbook", title: "Logbook", icon: Icon.CheckCircle },
];

export default function Command() {
  const [scope, setScope] = useState<TaskScope>("active");
  const { tasks, isLoading, revalidate } = useTasks({ scope });
  const actions = useTaskActions();

  const handleComplete = async (task: Task) => {
    try {
      await actions.complete(task.id);
      await showToast({ style: Toast.Style.Success, title: "Task completed" });
      revalidate();
    } catch (error) {
      showFailureToast(error, { title: "Failed to complete task" });
    }
  };

  const handleReopen = async (task: Task) => {
    try {
      await actions.reopen(task.id);
      await showToast({ style: Toast.Style.Success, title: "Task reopened" });
      revalidate();
    } catch (error) {
      showFailureToast(error, { title: "Failed to reopen task" });
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter tasks..."
      searchBarAccessory={
        <List.Dropdown tooltip="Task Scope" value={scope} onChange={(value) => setScope(value as TaskScope)}>
          {SCOPE_OPTIONS.map((option) => (
            <List.Dropdown.Item key={option.value} title={option.title} value={option.value} icon={option.icon} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title={`${scope.charAt(0).toUpperCase() + scope.slice(1)} Tasks`} subtitle={`${tasks.length}`}>
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onReopen={() => handleReopen(task)}
            onRefresh={revalidate}
          />
        ))}
      </List.Section>
      {!isLoading && tasks.length === 0 && (
        <List.EmptyView icon={Icon.CheckCircle} title="No tasks" description={`No ${scope} tasks found`} />
      )}
    </List>
  );
}

interface TaskListItemProps {
  task: Task;
  onComplete: () => void;
  onReopen: () => void;
  onRefresh: () => void;
}

function TaskListItem({ task, onComplete, onReopen, onRefresh }: TaskListItemProps) {
  const stateIcon = getStateIcon(task.state);
  const accessories: List.Item.Accessory[] = [];

  if (task.scheduleDate) {
    accessories.push({ date: new Date(task.scheduleDate), tooltip: "Scheduled" });
  }
  if (task.deadlineDate) {
    accessories.push({ tag: { value: task.deadlineDate, color: Color.Red }, tooltip: "Deadline" });
  }

  return (
    <List.Item
      icon={stateIcon}
      title={cleanMarkdown(task.markdown)}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {task.state === "todo" ? (
              <Action title="Complete Task" icon={Icon.CheckCircle} onAction={onComplete} />
            ) : (
              <Action title="Reopen Task" icon={Icon.Circle} onAction={onReopen} />
            )}
            <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${task.id}`} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard title="Copy Task" content={task.markdown} />
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

function getStateIcon(state: Task["state"]): Icon {
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
  return markdown.replace(/\*\*/g, "").replace(/<[^>]+>/g, "").trim();
}
