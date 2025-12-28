import { fetchFolders, flattenFolders } from "../api";

/**
 * List all folders in the Craft space with document counts.
 * Returns built-in locations (Unsorted, Trash, Templates) and user-created folders
 * with their hierarchical structure.
 */
export default async function () {
  const folders = await fetchFolders();
  const flatFolders = flattenFolders(folders);

  return {
    totalFolders: flatFolders.length,
    folders: flatFolders,
  };
}
