import { Tool } from "@raycast/api";
import { createFolders } from "../api";

type Input = {
  /**
   * Array of folders to create. Each folder should have:
   * - name: The folder name (required)
   * - parentFolderId?: ID of parent folder to create inside (optional, omit for root level)
   */
  folders: {
    name: string;
    parentFolderId?: string;
  }[];
};

/**
 * Create new folders in the Craft space.
 * Supports creating at root level or nested inside existing folders.
 * Cannot create inside built-in locations (unsorted, trash, templates).
 */
export default async function (input: Input) {
  const { folders } = input;

  if (!folders || folders.length === 0) {
    return { error: "At least one folder is required" };
  }

  const createdFolders = await createFolders(folders);

  return {
    success: true,
    createdCount: createdFolders.length,
    folders: createdFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      ...(folder.parentFolderId && { parentFolderId: folder.parentFolderId }),
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const names = input.folders.map((f) => f.name).join(", ");
  return {
    message: `Create ${input.folders.length} folder(s): ${names}?`,
  };
};
