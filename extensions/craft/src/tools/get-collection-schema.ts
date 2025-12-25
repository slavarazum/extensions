import { getCollectionSchema } from "../api";

type Input = {
  /**
   * The ID of the collection to get the schema for.
   */
  collectionId: string;

  /**
   * The format to return the schema in.
   * - 'schema': Returns the collection schema structure that can be edited
   * - 'json-schema-items': Returns JSON Schema for validation (default)
   */
  format?: "schema" | "json-schema-items";
};

/**
 * Get the schema of a collection.
 * Useful for understanding what properties are available before adding or updating items.
 */
export default async function (input: Input) {
  const { collectionId, format = "json-schema-items" } = input;

  const schema = await getCollectionSchema(collectionId, format);

  return {
    collectionId,
    format,
    schema: {
      key: schema.key,
      name: schema.name,
      ...(schema.contentPropDetails && { contentPropDetails: schema.contentPropDetails }),
      properties: schema.properties.map((prop) => ({
        key: prop.key,
        name: prop.name,
        type: prop.type,
        ...(prop.options && { options: prop.options }),
      })),
    },
  };
}
