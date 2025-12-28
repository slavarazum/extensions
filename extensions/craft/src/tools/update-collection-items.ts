import { Tool } from "@raycast/api";
import { updateCollectionItems } from "../api";

type Input = {
  /**
   * The ID of the collection containing the items.
   * Use list-collections tool to discover available collections.
   */
  collectionId: string;

  /**
   * Array of items to update. Each item should have:
   * - id: The item ID (required)
   * - title?: New title
   * - properties?: JSON string of property key-value pairs to update
   */
  items: {
    id: string;
    title?: string;
    properties?: string;
  }[];

  /**
   * Allow adding new options to select properties.
   * When true, new values will be automatically added to the collection schema.
   * Never add new option values without explicit user intent.
   */
  allowNewSelectOptions?: boolean;
};

/**
 * Update items in a collection.
 * Only the fields provided will be updated.
 */
export default async function (input: Input) {
  const { collectionId, items, allowNewSelectOptions } = input;

  if (!items || items.length === 0) {
    return { error: "At least one item is required" };
  }

  // Parse properties from JSON strings
  const parsedItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    properties: item.properties ? JSON.parse(item.properties) : undefined,
  }));

  const updatedItems = await updateCollectionItems(collectionId, parsedItems, allowNewSelectOptions);

  return {
    success: true,
    collectionId,
    updatedCount: updatedItems.length,
    items: updatedItems.map((item) => ({
      id: item.id,
      title: item.title,
      properties: item.properties,
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Update ${input.items.length} item(s) in collection?`,
  };
};
