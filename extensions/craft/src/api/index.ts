/**
 * Craft API
 *
 * Re-exports all API modules for convenient imports.
 * Each domain file contains all related types, parameters, responses, and methods.
 */

// Client utilities
export { API_BASE_URL, URLBuilder, buildUrl } from "./client";

// Blocks API - Block types, search matches, and block operations
export * from "./blocks";

// Documents API - Document types and document operations
export * from "./documents";

// Tasks API - Task types and task operations
export * from "./tasks";

// Folders API - Folder types and folder operations
export * from "./folders";

// Collections API - Collection types and collection operations
export * from "./collections";
