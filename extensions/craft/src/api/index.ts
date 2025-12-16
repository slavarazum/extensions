/**
 * Craft API
 *
 * Clean re-exports organized by domain.
 * Import from here for best DX.
 */

// Types - shared across all domains
export type {
  Block,
  BlockType,
  BlockMetadata,
  BlockPosition,
  TextStyle,
  ListStyle,
  Document,
  DocumentSearchMatch,
  VirtualLocation,
  Task,
  TaskInfo,
  TaskScope,
  SearchMatch,
} from "./types";

export { API_BASE_URL, ApiError } from "./types";

// Tasks domain
export {
  // Hook
  useTasks,
  useTaskActions,
  // Async functions (for tools)
  fetchTasks,
  updateTask,
  deleteTask,
  // Types
  type TasksParams,
  type UseTasksResult,
  type TaskActions,
} from "./tasks";

// Documents domain
export {
  // Hooks
  useDocuments,
  useDocumentSearch,
  // Async functions (for tools)
  fetchDocuments,
  searchDocuments,
  createDocument,
  deleteDocuments,
  // Types
  type ListDocumentsParams,
  type SearchDocumentsParams,
  type UseDocumentsResult,
  type UseDocumentSearchResult,
} from "./documents";

// Blocks domain
export {
  // Hooks
  useBlocks,
  useBlockSearch,
  useDailyNote,
  // Async functions (for tools)
  fetchBlocks,
  searchBlocks,
  insertBlock,
  insertBlocks,
  updateBlocks,
  deleteBlocks,
  // Types
  type GetBlocksParams,
  type SearchBlocksParams,
  type InsertBlockParams,
  type UseBlocksResult,
  type UseBlockSearchResult,
  type UseDailyNoteResult,
} from "./blocks";
