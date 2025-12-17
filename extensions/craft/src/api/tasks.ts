/**
 * Tasks Domain
 *
 * Everything related to tasks in one place:
 * - Types
 * - Hook for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface Task {
  id: string;
  markdown: string;
  state: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
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

interface UpdateTasksResponse {
  items: Task[];
}

interface DeleteTasksResponse {
  items: string[];
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
// Async Functions (for tools)
// =============================================================================

/**
 * Fetch tasks (for tools/non-React code)
 */
export async function fetchTasks(params?: TasksParams): Promise<Task[]> {
  const response = await fetch(tasksUrl(params));
  if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  const data: TasksResponse = await response.json();
  return data.items;
}

/**
 * Update a task's state or dates
 */
export async function updateTask(taskId: string, updates: TaskUpdateInfo): Promise<void> {
  const response = await fetch(buildUrl(ENDPOINT), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasksToUpdate: [{ id: taskId, taskInfo: updates }] }),
  });
  if (!response.ok) throw new Error(`Failed to update task: ${response.statusText}`);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(buildUrl(ENDPOINT), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idsToDelete: [taskId] }),
  });
  if (!response.ok) throw new Error(`Failed to delete task: ${response.statusText}`);
}
