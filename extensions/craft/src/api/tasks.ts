/**
 * Tasks Domain
 *
 * Everything related to tasks in one place:
 * - Types (params, responses)
 * - Hook for React components
 * - Async functions for tools
 */

import { useFetch } from "@raycast/utils";
import { buildUrl, httpGet, httpPost, httpPut, httpDelete } from "./client";
import type { Task, TaskScope } from "./types";

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
  date?: string;
}

interface TasksResponse {
  tasks: Task[];
}

interface UpdateTaskPayload {
  state?: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
}

interface UpdateTasksResponse {
  updatedTasks: Task[];
}

interface DeleteTasksResponse {
  deletedTaskIds: string[];
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
    tasks: data?.tasks ?? [],
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
  update: (taskId: string, updates: UpdateTaskPayload) => Promise<void>;
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
  const response = await httpGet<TasksResponse>(tasksUrl(params));
  return response.tasks;
}

/**
 * Update a task's state or dates
 */
export async function updateTask(taskId: string, updates: UpdateTaskPayload): Promise<void> {
  await httpPut<UpdateTasksResponse>(buildUrl(ENDPOINT), {
    tasks: [{ blockId: taskId, updates }],
  });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  await httpDelete<DeleteTasksResponse>(buildUrl(ENDPOINT), {
    blockIds: [taskId],
  });
}
