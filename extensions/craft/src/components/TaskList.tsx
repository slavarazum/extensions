import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useState } from "react";
import { useTasks, useTaskHandlers, type TaskScope } from "../api";
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
  const scope = fixedScope ?? dynamicScope;
  const config = SCOPE_CONFIG[scope];

  const { tasks, isLoading, revalidate } = useTasks({ scope });
  const { handleComplete, handleReopen, handleCancel, handleDelete } = useTaskHandlers(revalidate);

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
            onComplete={() => handleComplete(task)}
            onReopen={() => handleReopen(task)}
            onCancel={allowMutations ? () => handleCancel(task) : undefined}
            onDelete={allowMutations ? () => handleDelete(task) : undefined}
            onRefresh={revalidate}
            extraActions={createAction}
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
