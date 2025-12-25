import { Tool } from "@raycast/api";
import { addCollectionItems } from "../api";

type Input = {
  /**
   * The ID of the collection to add items to.
   */
  collectionId: string;

  /**
   * Array of items to add. Each item should have:
   * - title: The item title (required)
   * - properties: JSON string of property key-value pairs matching the collection schema
   */
  items: {
    title: string;
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
 * Add new items to a collection.
 * Items must match the collection's schema. Use get-collection-schema first to understand the structure.
 */
export default async function (input: Input) {
  const { collectionId, items, allowNewSelectOptions } = input;

  if (!items || items.length === 0) {
    return { error: "At least one item is required" };
  }

  // Parse properties from JSON strings
  const parsedItems = items.map((item) => ({
    title: item.title,
    properties: item.properties ? JSON.parse(item.properties) : undefined,
  }));

  const addedItems = await addCollectionItems(collectionId, parsedItems, allowNewSelectOptions);

  return {
    success: true,
    collectionId,
    addedCount: addedItems.length,
    items: addedItems.map((item) => ({
      id: item.id,
      title: item.title,
      properties: item.properties,
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Add ${input.items.length} item(s) to collection?`,
  };
};
