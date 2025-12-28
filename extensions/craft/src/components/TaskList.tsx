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
  active: { title: "Active", icon: Icon.List, description: "No active tasks" },
  logbook: { title: "Logbook", icon: Icon.CheckCircle, description: "No completed or canceled tasks found" },
  document: { title: "Document", icon: Icon.Document, description: "No document tasks found" },
};

const SCOPE_OPTIONS: ViewScope[] = ["inbox", "today", "upcoming", "active"];

/**
 * Format a daily note date as "Today, Sun, Dec 28" style
 */
function formatDailyNoteDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays === 0) {
    return `Today, ${dayName}, ${monthDay}`;
  } else if (diffDays === 1) {
    return `Tomorrow, ${dayName}, ${monthDay}`;
  } else if (diffDays === -1) {
    return `Yesterday, ${dayName}, ${monthDay}`;
  } else {
    return `${dayName}, ${monthDay}`;
  }
}

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
    } else if (locationType === "dailyNote" && task.location?.date) {
      groupKey = formatDailyNoteDate(task.location.date);
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
 * Check if a group key is a daily note (starts with Today, Tomorrow, Yesterday, or a weekday)
 */
function isDailyNoteGroup(key: string): boolean {
  const dailyNotePrefixes = ["Today,", "Tomorrow,", "Yesterday,", "Sun,", "Mon,", "Tue,", "Wed,", "Thu,", "Fri,", "Sat,"];
  return dailyNotePrefixes.some(prefix => key.startsWith(prefix));
}

/**
 * Sort groups: Inbox first, then Daily Notes (with "Today" first), then documents alphabetically
 */
function sortGroups(groups: Map<string, Task[]>): [string, Task[]][] {
  const entries = Array.from(groups.entries());
  return entries.sort(([a], [b]) => {
    if (a === "Inbox") return -1;
    if (b === "Inbox") return 1;

    const aIsDailyNote = isDailyNoteGroup(a);
    const bIsDailyNote = isDailyNoteGroup(b);

    // Daily notes come after Inbox but before documents
    if (aIsDailyNote && !bIsDailyNote) return -1;
    if (!aIsDailyNote && bIsDailyNote) return 1;

    // If both are daily notes, prioritize Today > Tomorrow > Yesterday > others
    if (aIsDailyNote && bIsDailyNote) {
      if (a.startsWith("Today,")) return -1;
      if (b.startsWith("Today,")) return 1;
      if (a.startsWith("Tomorrow,")) return -1;
      if (b.startsWith("Tomorrow,")) return 1;
      if (a.startsWith("Yesterday,")) return -1;
      if (b.startsWith("Yesterday,")) return 1;
    }

    return a.localeCompare(b);
  });
}

/**
 * Group upcoming tasks by time period: This Week, This Month, then by month name
 */
function groupTasksByTimePeriod(tasks: Task[]): [string, Task[]][] {
  const groups = new Map<string, Task[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate end of this week (Sunday)
  // If today is Sunday (day 0), end of week is today; otherwise calculate days until Sunday
  const endOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  endOfWeek.setDate(today.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  // Calculate end of this month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const task of tasks) {
    const scheduleDate = task.taskInfo.scheduleDate;
    if (!scheduleDate) continue;

    const taskDate = new Date(scheduleDate + "T00:00:00");
    let groupKey: string;

    if (taskDate <= endOfWeek) {
      groupKey = "This Week";
    } else if (taskDate <= endOfMonth) {
      groupKey = "This Month";
    } else {
      // Group by month name (e.g., "January", "February 2026")
      const monthName = taskDate.toLocaleDateString("en-US", { month: "long" });
      const year = taskDate.getFullYear();
      if (year === today.getFullYear()) {
        groupKey = monthName;
      } else {
        groupKey = `${monthName} ${year}`;
      }
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(task);
  }

  // Sort groups in chronological order
  const order = ["This Week", "This Month"];
  const entries = Array.from(groups.entries());

  return entries.sort(([a], [b]) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    // Both are in the predefined order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    // Only a is in predefined order
    if (aIndex !== -1) return -1;
    // Only b is in predefined order
    if (bIndex !== -1) return 1;

    // Both are month names - parse and compare dates
    const parseMonthGroup = (s: string) => {
      const parts = s.split(" ");
      const month = new Date(Date.parse(parts[0] + " 1, 2000")).getMonth();
      const year = parts[1] ? parseInt(parts[1]) : new Date().getFullYear();
      return new Date(year, month, 1);
    };

    return parseMonthGroup(a).getTime() - parseMonthGroup(b).getTime();
  });
}

/** Delay before removing completed task from list (ms) */
const COMPLETE_ANIMATION_DELAY = 3000;

export interface TaskListProps {
  /** Fixed scope - renders a simple list. Use "today" for grouped today view */
  scope?: ViewScope;
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
  const isLocationGroupedView = viewScope === "today";
  const isTimeGroupedView = viewScope === "upcoming";

  const { tasks, isLoading, revalidate } = useTasks({ scope: apiScope });
  const actions = useTaskActions();
  const { handleReopen, handleCancel, handleDelete } = useTaskHandlers(revalidate);

  // Group tasks for "today" view (by location)
  const locationGroupedTasks = useMemo(() => {
    if (!isLocationGroupedView) return null;
    return sortGroups(groupTasksByLocation(tasks));
  }, [tasks, isLocationGroupedView]);

  // Group tasks for "upcoming" view (by time period)
  const timeGroupedTasks = useMemo(() => {
    if (!isTimeGroupedView) return null;
    return groupTasksByTimePeriod(tasks);
  }, [tasks, isTimeGroupedView]);

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
              <List.Dropdown.Item key={s} title={SCOPE_CONFIG[s].title} value={s} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={createAction ? <ActionPanel>{createAction}</ActionPanel> : undefined}
    >
      {isLocationGroupedView && locationGroupedTasks ? (
        // Grouped view for "today" (by location)
        locationGroupedTasks.map(([groupKey, groupTasks]) => (
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
                hideTodaySchedule
              />
            ))}
          </List.Section>
        ))
      ) : isTimeGroupedView && timeGroupedTasks ? (
        // Grouped view for "upcoming" (by time period)
        timeGroupedTasks.map(([groupKey, groupTasks]) => (
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
              />
            ))}
          </List.Section>
        ))
      ) : (
        // Flat list view for other scopes
        tasks.map((task) => (
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
        ))
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
