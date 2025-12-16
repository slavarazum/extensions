/**
 * Tasks API
 *
 * API methods for working with Craft tasks.
 */

import { buildUrl, Endpoints, httpDelete, httpGet, httpPost, httpPut } from "./client";
import type {
  TaskInfo,
  GetTasksParams,
  AddTasksParams,
  UpdateTasksParams,
  DeleteTasksParams,
} from "./types";

// =============================================================================
// Response Types
// =============================================================================

export interface GetTasksResponse {
  tasks: TaskInfo[];
}

export interface AddTasksResponse {
  addedTasks: TaskInfo[];
}

export interface UpdateTasksResponse {
  updatedTasks: TaskInfo[];
}

export interface DeleteTasksResponse {
  deletedTaskIds: string[];
}

// =============================================================================
// URL Builders
// =============================================================================

/**
 * Build URL for getting tasks
 */
export function buildGetTasksUrl(params?: GetTasksParams): string {
  const builder = buildUrl(Endpoints.tasks);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * Get tasks with optional filtering
 */
export async function getTasks(params?: GetTasksParams): Promise<GetTasksResponse> {
  const url = buildGetTasksUrl(params);
  return httpGet<GetTasksResponse>(url);
}

/**
 * Add new tasks to blocks
 */
export async function addTasks(params: AddTasksParams): Promise<AddTasksResponse> {
  const url = buildUrl(Endpoints.tasks).build();
  return httpPost<AddTasksResponse>(url, params);
}

/**
 * Update existing tasks
 */
export async function updateTasks(params: UpdateTasksParams): Promise<UpdateTasksResponse> {
  const url = buildUrl(Endpoints.tasks).build();
  return httpPut<UpdateTasksResponse>(url, params);
}

/**
 * Delete tasks from blocks
 */
export async function deleteTasks(params: DeleteTasksParams): Promise<DeleteTasksResponse> {
  const url = buildUrl(Endpoints.tasks).build();
  return httpDelete<DeleteTasksResponse>(url, params);
}
