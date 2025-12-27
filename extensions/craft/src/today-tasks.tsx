import { ActionPanel, Action, List, Icon, Color, Toast, showToast, confirmAlert, Alert } from "@raycast/api";
import { useState, useCallback, useRef, useMemo } from "react";
import { showFailureToast } from "@raycast/utils";
import { useTasks, useTaskActions, blockLink, formatLocalDate, type Task } from "./api";

/** Delay before removing completed task from list (ms) */
const COMPLETE_ANIMATION_DELAY = 3000;

/**
 * Group tasks by their location
 */
function groupTasksByLocation(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const locationType = task.location?.type || "inbox";
    const locationTitle = task.location?.title;

    let groupKey: string;
    if (locationType === "document" && locationTitle) {
      groupKey = locationTitle;
    } else if (locationType === "dailyNote") {
      groupKey = "Daily Note";
    } else {
      groupKey = "Inbox";
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(task);
  }

  return groups;
}

export default function Command() {
  const { tasks, isLoading, revalidate } = useTasks({ scope: "active" });
  const actions = useTaskActions();

  // Track completing tasks
  const [completingTasks, setCompletingTasks] = useState<Record<string, boolean>>({});
  const completingTasksRef = useRef<Record<string, boolean>>({});

  // Group by location
  const groupedTasks = useMemo(() => groupTasksByLocation(tasks), [tasks]);

  // Check if a task is completing
  const isTaskCompleting = useCallback(
    (taskId: string) => {
      return completingTasksRef.current[taskId] || completingTasks[taskId];
    },
    [completingTasks],
  );

  // Handle complete with animation
  const handleComplete = useCallback(
    async (task: Task) => {
      completingTasksRef.current[task.id] = true;
      setCompletingTasks((prev) => ({ ...prev, [task.id]: true }));

      try {
        await actions.complete(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task completed" });
      } catch (error) {
        delete completingTasksRef.current[task.id];
        setCompletingTasks((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        showFailureToast(error, { title: "Failed to complete task" });
        return;
      }

      setTimeout(() => {
        delete completingTasksRef.current[task.id];
        setCompletingTasks((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        revalidate();
      }, COMPLETE_ANIMATION_DELAY);
    },
    [actions, revalidate],
  );

  const handleReopen = useCallback(
    async (task: Task) => {
      try {
        await actions.reopen(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task reopened" });
        revalidate();
      } catch (error) {
        showFailureToast(error, { title: "Failed to reopen task" });
      }
    },
    [actions, revalidate],
  );

  // Sort groups: Inbox first, then Daily Note, then documents alphabetically
  const sortedGroups = useMemo(() => {
    const entries = Array.from(groupedTasks.entries());
    return entries.sort(([a], [b]) => {
      if (a === "Inbox") return -1;
      if (b === "Inbox") return 1;
      if (a === "Daily Note") return -1;
      if (b === "Daily Note") return 1;
      return a.localeCompare(b);
    });
  }, [groupedTasks]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter tasks...">
      {sortedGroups.map(([groupKey, groupTasks]) => (
        <List.Section key={groupKey} title={groupKey} subtitle={`${groupTasks.length}`}>
          {groupTasks.map((task) => (
            <TodayTaskItem
              key={task.id}
              task={task}
              isCompleting={isTaskCompleting(task.id)}
              onComplete={() => handleComplete(task)}
              onReopen={() => handleReopen(task)}
              onRefresh={revalidate}
            />
          ))}
        </List.Section>
      ))}
      {!isLoading && tasks.length === 0 && (
        <List.EmptyView icon={Icon.CheckCircle} title="No active tasks" description="All caught up! Enjoy your day." />
      )}
    </List>
  );
}

interface TodayTaskItemProps {
  task: Task;
  isCompleting: boolean;
  onComplete: () => void;
  onReopen: () => void;
  onRefresh: () => void;
}

function TodayTaskItem({ task, isCompleting, onComplete, onReopen, onRefresh }: TodayTaskItemProps) {
  const stateIcon = isCompleting
    ? { source: Icon.CheckCircle, tintColor: Color.Green }
    : getStateIcon(task.taskInfo.state);

  const accessories: List.Item.Accessory[] = [];
  const today = formatLocalDate(new Date());

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

  // Add deadline if present
  if (task.taskInfo.deadlineDate) {
    accessories.push({
      tag: { value: task.taskInfo.deadlineDate, color: Color.Red },
      tooltip: "Deadline",
    });
  }

  // Add repeat indicator
  if (task.repeat) {
    accessories.push({ icon: Icon.ArrowClockwise, tooltip: `Repeats ${task.repeat.frequency}` });
  }

  return (
    <List.Item
      icon={stateIcon}
      title={cleanMarkdown(task.markdown)}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {task.taskInfo.state === "todo" ? (
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
            ) : (
              <Action title="Reopen" icon={Icon.Circle} onAction={onReopen} />
            )}
            <Action.OpenInBrowser
              title="Open in Craft"
              url={blockLink(task.id)}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
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
