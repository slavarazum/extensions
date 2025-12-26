/**
 * Craft API
 *
 * Clean re-exports organized by domain.
 * Import from here for best DX.
 */

// Client utilities (shared across domains)
export { getDocumentsApiUrl, getDailyNotesAndTasksApiUrl, getCurrentSpace } from "./client";

// Spaces management
export {
  type Space,
  type UseCurrentSpaceResult,
  getDefaultSpace,
  getAllSpaces,
  getAdditionalSpaces,
  addSpace,
  updateSpace,
  deleteSpace,
  getCurrentSpaceId,
  setCurrentSpaceId,
  useCurrentSpace,
} from "./spaces";

// Tasks domain
export {
  // Types
  type Task,
  type TaskInfo,
  type TaskLocation,
  type TaskRepeat,
  type TaskScope,
  type TasksParams,
  type UseTasksResult,
  type TaskActions,
  type TaskHandlers,
  type CreateTaskParams,
  // Hooks
  useTasks,
  useTaskActions,
  useTaskHandlers,
  // Async functions (for tools)
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./tasks";

// Documents domain
export {
  // Types
  type Document,
  type VirtualLocation,
  type DocumentSearchMatch,
  type DailyNoteSearchMatch,
  type ListDocumentsParams,
  type SearchDocumentsParams,
  type SearchDailyNotesParams,
  type UseDocumentsResult,
  type UseDocumentSearchResult,
  type UseRecentDocumentsResult,
  type DocumentDestination,
  // Hooks
  useDocuments,
  useRecentDocuments,
  useDocumentSearch,
  // Async functions (for tools)
  fetchDocuments,
  searchDocuments,
  searchDailyNotes,
  createDocument,
  deleteDocuments,
  moveDocuments,
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
  type SearchMatch,
  type GetBlocksParams,
  type SearchBlocksParams,
  type InsertBlockParams,
  type UseBlocksResult,
  type UseBlocksOptions,
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
  moveBlocks,
} from "./blocks";

// Folders domain
export {
  // Types
  type Folder,
  type FolderDestination,
  // Async functions (for tools)
  fetchFolders,
  createFolders,
  deleteFolders,
  moveFolders,
} from "./folders";

// Collections domain
export {
  // Types
  type Collection,
  type CollectionProperty,
  type CollectionSchema,
  type CollectionItem,
  type ListCollectionsParams,
  // Async functions (for tools)
  listCollections,
  getCollectionSchema,
  getCollectionItems,
  addCollectionItems,
  updateCollectionItems,
  deleteCollectionItems,
} from "./collections";

// Deep links
export {
  // Types
  type OpenLinkParams,
  type SearchLinkParams,
  // Link builders
  openLink,
  blockLink,
  documentLink,
  appendBlockId,
  searchLink,
  newDocumentLink,
} from "./links";
