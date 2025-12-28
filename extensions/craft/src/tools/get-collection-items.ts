import { getCollectionItems } from "../api";

type Input = {
  /**
   * The ID of the collection to get items from.
   */
  collectionId: string;

  /**
   * The maximum depth of nested content to fetch for each item.
   * -1 for all descendants (default), 0 for only item properties.
   */
  maxDepth?: number;
};

/**
 * Get all items from a collection.
 * Returns items with their properties and optionally nested content.
 */
export default async function (input: Input) {
  const { collectionId, maxDepth = -1 } = input;

  const items = await getCollectionItems(collectionId, maxDepth);

  return {
    collectionId,
    totalItems: items.length,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      properties: item.properties,
      ...(item.content && { hasContent: true, contentCount: item.content.length }),
    })),
  };
}
