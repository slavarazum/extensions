import { fetchFolders } from "../api";

/**
 * List all folders in the Craft space with document counts.
 * Returns built-in locations (Unsorted, Trash, Templates) and user-created folders
 * with their hierarchical structure.
 */
export default async function () {
  const folders = await fetchFolders();

  // Flatten folder hierarchy for easier consumption
  const flattenFolders = (
    items: typeof folders,
    parentPath: string = "",
  ): { id: string; name: string; path: string; documentCount: number; hasChildren: boolean }[] => {
    const result: { id: string; name: string; path: string; documentCount: number; hasChildren: boolean }[] = [];

    for (const folder of items) {
      const path = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      result.push({
        id: folder.id,
        name: folder.name,
        path,
        documentCount: folder.documentCount,
        hasChildren: folder.folders.length > 0,
      });

      if (folder.folders.length > 0) {
        result.push(...flattenFolders(folder.folders, path));
      }
    }

    return result;
  };

  const flatFolders = flattenFolders(folders);

  return {
    totalFolders: flatFolders.length,
    folders: flatFolders,
  };
}
