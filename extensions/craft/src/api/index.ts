/**
 * Craft API
 *
 * Clean re-exports organized by domain.
 * Import from here for best DX.
 */

// Client utilities (shared across domains)
export { getDocumentsApiUrl, getDailyNotesAndTasksApiUrl } from "./client";

// Tasks domain
export {
  // Types
  type Task,
  type TaskScope,
  type TasksParams,
  type UseTasksResult,
  type TaskActions,
  // Hooks
  useTasks,
  useTaskActions,
  // Async functions (for tools)
  fetchTasks,
  updateTask,
  deleteTask,
} from "./tasks";

// Documents domain
export {
  // Types
  type Document,
  type VirtualLocation,
  type DocumentSearchMatch,
  type ListDocumentsParams,
  type SearchDocumentsParams,
  type UseDocumentsResult,
  type UseDocumentSearchResult,
  type UseRecentDocumentsResult,
  // Hooks
  useDocuments,
  useRecentDocuments,
  useDocumentSearch,
  // Async functions (for tools)
  fetchDocuments,
  searchDocuments,
  createDocument,
  deleteDocuments,
} from "./documents";

// Blocks domain
export {
  // Types
  type Block,
  type BlockType,
  type BlockMetadata,
  type BlockPosition,
  type TextStyle,
  type ListStyle,
  type TaskInfo,
  type SearchMatch,
  type GetBlocksParams,
  type SearchBlocksParams,
  type InsertBlockParams,
  type UseBlocksResult,
  type UseBlockSearchResult,
  type UseDailyNoteResult,
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
} from "./blocks";
