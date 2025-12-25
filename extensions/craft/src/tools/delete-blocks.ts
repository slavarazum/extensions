import { Tool } from "@raycast/api";
import { deleteBlocks } from "../api";

type Input = {
  /**
   * Array of block IDs to delete.
   */
  blockIds: string[];
};

/**
 * Delete blocks from a document.
 * This action cannot be undone.
 */
export default async function (input: Input) {
  const { blockIds } = input;

  if (!blockIds || blockIds.length === 0) {
    return { error: "At least one block ID is required" };
  }

  const deletedIds = await deleteBlocks(blockIds);

  return {
    success: true,
    deletedCount: deletedIds.length,
    deletedBlockIds: deletedIds,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Delete ${input.blockIds.length} block(s)? This action cannot be undone.`,
  };
};
