import { ActionPanel, Action, List, Icon, Toast, showToast } from "@raycast/api";
import { useState, useCallback, useRef, useMemo } from "react";
import { showFailureToast } from "@raycast/utils";
import { useTasks, useTaskActions, useTaskHandlers, type Task, type TaskScope } from "../api";
import { TaskListItem } from "./TaskListItem";
import { CreateTaskForm } from "./CreateTaskForm";

/** Extended scope type that includes "today" for grouped view */
type ViewScope = TaskScope | "today";

const SCOPE_CONFIG: Record<ViewScope, { title: string; icon: Icon; description: string; apiScope?: TaskScope }> = {
  inbox: { title: "Inbox", icon: Icon.Tray, description: "No inbox tasks found" },
  today: { title: "Today", icon: Icon.Sun, description: "No tasks for today", apiScope: "active" },
  upcoming: { title: "Upcoming", icon: Icon.Calendar, description: "No upcoming tasks found" },
  active: { title: "All", icon: Icon.List, description: "No active tasks" },
  logbook: { title: "Logbook", icon: Icon.CheckCircle, description: "No completed or canceled tasks found" },
  document: { title: "Document", icon: Icon.Document, description: "No document tasks found" },
};

const SCOPE_OPTIONS: ViewScope[] = ["inbox", "today", "upcoming", "active"];

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

/**
 * Sort groups: Inbox first, then Daily Note, then documents alphabetically
 */
function sortGroups(groups: Map<string, Task[]>): [string, Task[]][] {
  const entries = Array.from(groups.entries());
  return entries.sort(([a], [b]) => {
    if (a === "Inbox") return -1;
    if (b === "Inbox") return 1;
    if (a === "Daily Note") return -1;
    if (b === "Daily Note") return 1;
    return a.localeCompare(b);
  });
}

/** Delay before removing completed task from list (ms) */
const COMPLETE_ANIMATION_DELAY = 3000;

export interface TaskListProps {
  /** Fixed scope - renders a simple list */
  scope?: TaskScope;
  /** Show scope dropdown - renders list with scope switcher */
  showScopeDropdown?: boolean;
  /** Default scope when using dropdown */
  defaultScope?: ViewScope;
  /** Enable task creation */
  allowCreate?: boolean;
  /** Enable cancel/delete actions */
  allowMutations?: boolean;
}

export function TaskList({
  scope: fixedScope,
  showScopeDropdown = false,
  defaultScope = "inbox",
  allowCreate = false,
  allowMutations = false,
}: TaskListProps) {
  const [dynamicScope, setDynamicScope] = useState<ViewScope>(defaultScope);
  // Track completing tasks - use object for reliable React state updates + ref for persistence
  const [completingTasks, setCompletingTasks] = useState<Record<string, boolean>>({});
  const completingTasksRef = useRef<Record<string, boolean>>({});

  // Determine the view scope and API scope
  const viewScope: ViewScope = fixedScope ?? dynamicScope;
  const apiScope: TaskScope = SCOPE_CONFIG[viewScope].apiScope ?? (viewScope as TaskScope);
  const config = SCOPE_CONFIG[viewScope];
  const isGroupedView = viewScope === "today";

  const { tasks, isLoading, revalidate } = useTasks({ scope: apiScope });
  const actions = useTaskActions();
  const { handleReopen, handleCancel, handleDelete } = useTaskHandlers(revalidate);

  // Group tasks for "today" view
  const groupedTasks = useMemo(() => {
    if (!isGroupedView) return null;
    return sortGroups(groupTasksByLocation(tasks));
  }, [tasks, isGroupedView]);

  // Check if a task is completing (use ref for immediate access, state for re-renders)
  const isTaskCompleting = useCallback(
    (taskId: string) => {
      return completingTasksRef.current[taskId] || completingTasks[taskId];
    },
    [completingTasks],
  );

  // Wrap handleComplete to show animation before removing
  const handleCompleteWithAnimation = useCallback(
    async (task: Task) => {
      // Mark as completing (shows green checkmark) - update both ref and state
      completingTasksRef.current[task.id] = true;
      setCompletingTasks((prev) => ({ ...prev, [task.id]: true }));

      try {
        // Complete the task on the server (without immediate revalidation)
        await actions.complete(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task completed" });
      } catch (error) {
        // On error, remove from completing state immediately
        delete completingTasksRef.current[task.id];
        setCompletingTasks((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        showFailureToast(error, { title: "Failed to complete task" });
        return;
      }

      // Wait before removing from list
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

  const createAction = allowCreate ? (
    <Action.Push
      title="Create"
      icon={Icon.Plus}
      target={<CreateTaskForm onTaskCreated={revalidate} />}
      shortcut={{ modifiers: ["cmd"], key: "n" }}
    />
  ) : null;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={`Filter ${config.title.toLowerCase()} tasks...`}
      searchBarAccessory={
        showScopeDropdown ? (
          <List.Dropdown
            tooltip="Task Scope"
            value={viewScope}
            onChange={(value) => setDynamicScope(value as ViewScope)}
          >
            {SCOPE_OPTIONS.map((s) => (
              <List.Dropdown.Item key={s} title={SCOPE_CONFIG[s].title} value={s} icon={SCOPE_CONFIG[s].icon} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={createAction ? <ActionPanel>{createAction}</ActionPanel> : undefined}
    >
      {isGroupedView && groupedTasks ? (
        // Grouped view for "today"
        groupedTasks.map(([groupKey, groupTasks]) => (
          <List.Section key={groupKey} title={groupKey} subtitle={`${groupTasks.length}`}>
            {groupTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onComplete={() => handleCompleteWithAnimation(task)}
                onReopen={() => handleReopen(task)}
                onCancel={allowMutations ? () => handleCancel(task) : undefined}
                onDelete={allowMutations ? () => handleDelete(task) : undefined}
                onRefresh={revalidate}
                extraActions={createAction}
                isCompleting={isTaskCompleting(task.id)}
                hideLocation
              />
            ))}
          </List.Section>
        ))
      ) : (
        // Flat list view for other scopes
        <List.Section title={`${config.title} Tasks`} subtitle={`${tasks.length}`}>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onComplete={() => handleCompleteWithAnimation(task)}
              onReopen={() => handleReopen(task)}
              onCancel={allowMutations ? () => handleCancel(task) : undefined}
              onDelete={allowMutations ? () => handleDelete(task) : undefined}
              onRefresh={revalidate}
              extraActions={createAction}
              isCompleting={isTaskCompleting(task.id)}
              hideLocation={viewScope === "inbox"}
            />
          ))}
        </List.Section>
      )}
      {!isLoading && tasks.length === 0 && (
        <List.EmptyView
          icon={config.icon}
          title={`No ${config.title.toLowerCase()} tasks`}
          description={config.description}
          actions={createAction ? <ActionPanel>{createAction}</ActionPanel> : undefined}
        />
      )}
    </List>
  );
}
