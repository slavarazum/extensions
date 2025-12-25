import { Tool } from "@raycast/api";
import { deleteCollectionItems } from "../api";

type Input = {
  /**
   * The ID of the collection containing the items.
   */
  collectionId: string;

  /**
   * Array of item IDs to delete.
   */
  itemIds: string[];
};

/**
 * Delete items from a collection.
 * This also deletes any content inside the items.
 */
export default async function (input: Input) {
  const { collectionId, itemIds } = input;

  if (!itemIds || itemIds.length === 0) {
    return { error: "At least one item ID is required" };
  }

  const deletedIds = await deleteCollectionItems(collectionId, itemIds);

  return {
    success: true,
    collectionId,
    deletedCount: deletedIds.length,
    deletedItemIds: deletedIds,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Delete ${input.itemIds.length} item(s) from collection? This also deletes content inside items.`,
  };
};
