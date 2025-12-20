import { ActionPanel, Action, List, Icon, Toast, showToast } from "@raycast/api";
import { useState, useCallback, useRef } from "react";
import { showFailureToast } from "@raycast/utils";
import { useTasks, useTaskActions, useTaskHandlers, type Task, type TaskScope } from "../api";
import { TaskListItem } from "./TaskListItem";
import { CreateTaskForm } from "./CreateTaskForm";

const SCOPE_CONFIG: Record<TaskScope, { title: string; icon: Icon; description: string }> = {
  active: { title: "Active", icon: Icon.Clock, description: "No active tasks" },
  upcoming: { title: "Upcoming", icon: Icon.Calendar, description: "No upcoming tasks found" },
  inbox: { title: "Inbox", icon: Icon.Tray, description: "No inbox tasks found" },
  logbook: { title: "Logbook", icon: Icon.CheckCircle, description: "No completed or canceled tasks found" },
  document: { title: "Document", icon: Icon.Document, description: "No document tasks found" },
};

const SCOPE_OPTIONS: TaskScope[] = ["active", "upcoming", "inbox", "logbook"];

/** Delay before removing completed task from list (ms) */
const COMPLETE_ANIMATION_DELAY = 3000;

export interface TaskListProps {
  /** Fixed scope - renders a simple list */
  scope?: TaskScope;
  /** Show scope dropdown - renders list with scope switcher */
  showScopeDropdown?: boolean;
  /** Default scope when using dropdown */
  defaultScope?: TaskScope;
  /** Enable task creation */
  allowCreate?: boolean;
  /** Enable cancel/delete actions */
  allowMutations?: boolean;
}

export function TaskList({
  scope: fixedScope,
  showScopeDropdown = false,
  defaultScope = "active",
  allowCreate = false,
  allowMutations = false,
}: TaskListProps) {
  const [dynamicScope, setDynamicScope] = useState<TaskScope>(defaultScope);
  // Track completing tasks - use object for reliable React state updates + ref for persistence
  const [completingTasks, setCompletingTasks] = useState<Record<string, boolean>>({});
  const completingTasksRef = useRef<Record<string, boolean>>({});
  const scope = fixedScope ?? dynamicScope;
  const config = SCOPE_CONFIG[scope];

  const { tasks, isLoading, revalidate } = useTasks({ scope });
  const actions = useTaskActions();
  const { handleReopen, handleCancel, handleDelete } = useTaskHandlers(revalidate);

  // Check if a task is completing (use ref for immediate access, state for re-renders)
  const isTaskCompleting = useCallback((taskId: string) => {
    return completingTasksRef.current[taskId] || completingTasks[taskId];
  }, [completingTasks]);

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
    [actions, revalidate]
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
          <List.Dropdown tooltip="Task Scope" value={scope} onChange={(value) => setDynamicScope(value as TaskScope)}>
            {SCOPE_OPTIONS.map((s) => (
              <List.Dropdown.Item key={s} title={SCOPE_CONFIG[s].title} value={s} icon={SCOPE_CONFIG[s].icon} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={createAction ? <ActionPanel>{createAction}</ActionPanel> : undefined}
    >
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
          />
        ))}
      </List.Section>
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
