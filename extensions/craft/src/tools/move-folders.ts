import { Tool } from "@raycast/api";
import { moveFolders, type FolderDestination } from "../api";

type Input = {
  /**
   * Array of folder IDs to move.
   */
  folderIds: string[];

  /**
   * Move to root level. Set to true to move folders to root.
   */
  moveToRoot?: boolean;

  /**
   * ID of parent folder to move into. Use this to nest folders.
   */
  parentFolderId?: string;
};

/**
 * Move folders within the Craft space hierarchy.
 * Cannot move built-in locations (unsorted, trash, templates).
 */
export default async function (input: Input) {
  const { folderIds, moveToRoot, parentFolderId } = input;

  if (!folderIds || folderIds.length === 0) {
    return { error: "At least one folder ID is required" };
  }

  // Build destination object
  let destParam: FolderDestination;

  if (parentFolderId) {
    destParam = { parentFolderId };
  } else if (moveToRoot) {
    destParam = { destination: "root" };
  } else {
    return { error: "Either 'moveToRoot: true' or 'parentFolderId' must be provided" };
  }

  const movedFolders = await moveFolders(folderIds, destParam);

  return {
    success: true,
    movedCount: movedFolders.length,
    movedFolders: movedFolders.map((folder) => ({
      id: folder.id,
      destination: folder.destination,
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const target = input.parentFolderId
    ? `folder ${input.parentFolderId}`
    : "root";

  return {
    message: `Move ${input.folderIds.length} folder(s) to ${target}?`,
  };
};
