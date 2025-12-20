/**
 * Tasks Domain
 *
 * Everything related to tasks in one place:
 * - Types
 * - Hook for React components
 * - Async functions for tools
 */

import { Toast, showToast } from "@raycast/api";
import { useFetch, showFailureToast } from "@raycast/utils";
import { buildUrl, fetch } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface TaskInfo {
  state: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
}

export interface TaskLocation {
  type: "inbox" | "document" | "dailyNote";
  title?: string; // Document title if type is "document"
}

export interface TaskRepeat {
  type: "fixed";
  frequency: "daily" | "weekly" | "monthly";
  interval?: number;
  startDate?: string;
  daily?: {
    skipWeekends: boolean;
  };
  reminder?: {
    enabled: boolean;
    dateOffset: number;
  };
}

export interface Task {
  id: string;
  markdown: string;
  taskInfo: TaskInfo;
  location?: TaskLocation;
  repeat?: TaskRepeat;
}

export type TaskScope = "active" | "upcoming" | "inbox" | "logbook" | "document";

// =============================================================================
// Endpoint
// =============================================================================

const ENDPOINT = "/tasks";

// =============================================================================
// Parameters & Responses
// =============================================================================

export interface TasksParams {
  scope?: TaskScope;
  documentId?: string;
}

interface TasksResponse {
  items: Task[];
}

interface TaskUpdateInfo {
  state?: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
}

export interface CreateTaskParams {
  markdown: string;
  taskInfo?: {
    scheduleDate?: string;
    deadlineDate?: string;
  };
  location: {
    type: "inbox" | "dailyNote";
  };
}

interface UpdateTasksResponse {
  items: Task[];
}

interface DeleteTasksResponse {
  items: { id: string }[];
}

// =============================================================================
// Internal: URL Builder
// =============================================================================

function tasksUrl(params?: TasksParams): string {
  return buildUrl(ENDPOINT, params as Record<string, string | undefined>);
}

// =============================================================================
// Hook: useTasks
// =============================================================================

export interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Fetch tasks with automatic caching and revalidation
 *
 * @example
 * ```tsx
 * const { tasks, isLoading } = useTasks({ scope: "active" });
 * ```
 */
export function useTasks(params?: TasksParams): UseTasksResult {
  const { data, isLoading, error, revalidate } = useFetch<TasksResponse>(tasksUrl(params), {
    keepPreviousData: true,
  });

  return {
    tasks: data?.items ?? [],
    isLoading,
    error,
    revalidate,
  };
}

// =============================================================================
// Hook: useTaskActions
// =============================================================================

export interface TaskActions {
  complete: (taskId: string) => Promise<void>;
  reopen: (taskId: string) => Promise<void>;
  cancel: (taskId: string) => Promise<void>;
  update: (taskId: string, updates: TaskUpdateInfo) => Promise<void>;
  remove: (taskId: string) => Promise<void>;
}

/**
 * Task mutation actions
 *
 * @example
 * ```tsx
 * const { tasks, revalidate } = useTasks({ scope: "active" });
 * const actions = useTaskActions();
 *
 * const handleComplete = async (task: Task) => {
 *   await actions.complete(task.id);
 *   revalidate();
 * };
 * ```
 */
export function useTaskActions(): TaskActions {
  return {
    complete: (taskId) => updateTask(taskId, { state: "done" }),
    reopen: (taskId) => updateTask(taskId, { state: "todo" }),
    cancel: (taskId) => updateTask(taskId, { state: "canceled" }),
    update: updateTask,
    remove: deleteTask,
  };
}

// =============================================================================
// Hook: useTaskHandlers
// =============================================================================

export interface TaskHandlers {
  handleComplete: (task: Task) => Promise<void>;
  handleReopen: (task: Task) => Promise<void>;
  handleCancel: (task: Task) => Promise<void>;
  handleDelete: (task: Task) => Promise<void>;
}

/**
 * Task handlers with toast notifications
 * Combines useTaskActions with toast feedback and revalidation
 *
 * @example
 * ```tsx
 * const { tasks, isLoading, revalidate } = useTasks({ scope: "active" });
 * const handlers = useTaskHandlers(revalidate);
 *
 * <TaskListItem task={task} {...handlers} onRefresh={revalidate} />
 * ```
 */
export function useTaskHandlers(revalidate: () => void): TaskHandlers {
  const actions = useTaskActions();

  return {
    handleComplete: async (task: Task) => {
      try {
        await actions.complete(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task completed" });
        revalidate();
      } catch (error) {
        showFailureToast(error, { title: "Failed to complete task" });
      }
    },
    handleReopen: async (task: Task) => {
      try {
        await actions.reopen(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task reopened" });
        revalidate();
      } catch (error) {
        showFailureToast(error, { title: "Failed to reopen task" });
      }
    },
    handleCancel: async (task: Task) => {
      try {
        await actions.cancel(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task canceled" });
        revalidate();
      } catch (error) {
        showFailureToast(error, { title: "Failed to cancel task" });
      }
    },
    handleDelete: async (task: Task) => {
      try {
        await deleteTask(task.id);
        await showToast({ style: Toast.Style.Success, title: "Task deleted" });
        revalidate();
      } catch (error) {
        showFailureToast(error, { title: "Failed to delete task" });
      }
    },
  };
}

// =============================================================================
// Async Functions (for tools)
// =============================================================================

/**
 * Fetch tasks (for tools/non-React code)
 */
export async function fetchTasks(params?: TasksParams): Promise<Task[]> {
  const data = await fetch<TasksResponse>(tasksUrl(params));
  return data.items;
}

/**
 * Create a new task
 */
export async function createTask(task: CreateTaskParams): Promise<Task> {
  const data = await fetch<{ items: Task[] }>(buildUrl(ENDPOINT), {
    method: "POST",
    body: JSON.stringify({ tasks: [task] }),
  });
  return data.items[0];
}

/**
 * Update a task's state or dates
 */
export async function updateTask(taskId: string, updates: TaskUpdateInfo): Promise<void> {
  await fetch<UpdateTasksResponse>(buildUrl(ENDPOINT), {
    method: "PUT",
    body: JSON.stringify({ tasksToUpdate: [{ id: taskId, taskInfo: updates }] }),
  });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  await fetch<DeleteTasksResponse>(buildUrl(ENDPOINT), {
    method: "DELETE",
    body: JSON.stringify({ idsToDelete: [taskId] }),
  });
}
