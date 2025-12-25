import { Tool } from "@raycast/api";
import { deleteFolders } from "../api";

type Input = {
  /**
   * Array of folder IDs to delete.
   * Documents and subfolders are moved to the parent folder, or Unsorted if deleting a top-level folder.
   * Cannot delete built-in locations (unsorted, trash, templates).
   */
  folderIds: string[];
};

/**
 * Delete folders from the Craft space.
 * Documents and subfolders inside will be moved to the parent folder or Unsorted.
 */
export default async function (input: Input) {
  const { folderIds } = input;

  if (!folderIds || folderIds.length === 0) {
    return { error: "At least one folder ID is required" };
  }

  const deletedIds = await deleteFolders(folderIds);

  return {
    success: true,
    deletedCount: deletedIds.length,
    deletedFolderIds: deletedIds,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Delete ${input.folderIds.length} folder(s)? Contents will be moved to parent or Unsorted.`,
  };
};
