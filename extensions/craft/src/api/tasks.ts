/**
 * Tasks API
 *
 * All types, parameters, and methods for working with Craft tasks.
 */

import { buildUrl, httpDelete, httpGet, httpPost, httpPut } from "./client";

// =============================================================================
// Endpoints
// =============================================================================

export const TaskEndpoints = {
  tasks: "/tasks",
} as const;

// =============================================================================
// Core Types
// =============================================================================

export interface Task {
  id: string;
  markdown: string;
  state: "todo" | "done" | "canceled";
  scheduleDate?: string;
  deadlineDate?: string;
}

// =============================================================================
// Location & Scope Types
// =============================================================================

export type TaskScope = "active" | "upcoming" | "inbox" | "logbook" | "document";

export type TaskLocation =
  | { type: "inbox" }
  | { type: "dailyNote"; date: string }
  | { type: "document"; documentId: string };

// =============================================================================
// Request Parameters
// =============================================================================

export interface GetTasksParams {
  scope?: TaskScope;
  documentId?: string; // Required when scope is "document"
  date?: string; // For upcoming scope filtering
}

export interface AddTasksParams {
  tasks: {
    blockId: string;
    taskInfo: {
      state?: "todo" | "done" | "canceled";
      scheduleDate?: string;
      deadlineDate?: string;
    };
  }[];
}

export interface UpdateTasksParams {
  tasks: {
    blockId: string;
    updates: {
      state?: "todo" | "done" | "canceled";
      scheduleDate?: string;
      deadlineDate?: string;
    };
  }[];
}

export interface DeleteTasksParams {
  blockIds: string[];
}

// =============================================================================
// Response Types
// =============================================================================

export interface GetTasksResponse {
  tasks: Task[];
}

export interface AddTasksResponse {
  addedTasks: Task[];
}

export interface UpdateTasksResponse {
  updatedTasks: Task[];
}

export interface DeleteTasksResponse {
  deletedTaskIds: string[];
}

// =============================================================================
// URL Builders
// =============================================================================

export function buildGetTasksUrl(params?: GetTasksParams): string {
  const builder = buildUrl(TaskEndpoints.tasks);
  if (params) {
    builder.params(params);
  }
  return builder.build();
}

// =============================================================================
// API Methods
// =============================================================================

export async function getTasks(params?: GetTasksParams): Promise<GetTasksResponse> {
  const url = buildGetTasksUrl(params);
  return httpGet<GetTasksResponse>(url);
}

export async function addTasks(params: AddTasksParams): Promise<AddTasksResponse> {
  const url = buildUrl(TaskEndpoints.tasks).build();
  return httpPost<AddTasksResponse>(url, params);
}

export async function updateTasks(params: UpdateTasksParams): Promise<UpdateTasksResponse> {
  const url = buildUrl(TaskEndpoints.tasks).build();
  return httpPut<UpdateTasksResponse>(url, params);
}

export async function deleteTasks(params: DeleteTasksParams): Promise<DeleteTasksResponse> {
  const url = buildUrl(TaskEndpoints.tasks).build();
  return httpDelete<DeleteTasksResponse>(url, params);
}
