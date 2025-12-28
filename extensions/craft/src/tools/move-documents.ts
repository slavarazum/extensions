import { Tool } from "@raycast/api";
import { moveDocuments, type DocumentDestination } from "../api";

type Input = {
  /**
   * Array of document IDs to move.
   * Use search-documents or list-documents tools to find document IDs.
   */
  documentIds: string[];

  /**
   * Destination for the documents. Provide one of:
   * - { destination: "unsorted" } - Move to unsorted
   * - { destination: "templates" } - Move to templates
   * - { folderId: string } - Move to a specific folder
   * Use list-folders tool to find available folder IDs.
   */
  destination: {
    destination?: "unsorted" | "templates";
    folderId?: string;
  };
};

/**
 * Move documents between locations in the Craft space.
 * Cannot move to trash - use delete-documents instead.
 * Use this to restore documents from trash.
 * Note: Daily notes cannot be moved.
 */
export default async function (input: Input) {
  const { documentIds, destination } = input;

  if (!documentIds || documentIds.length === 0) {
    return { error: "At least one document ID is required" };
  }

  // Build destination object
  let destParam: DocumentDestination;

  if (destination.folderId) {
    destParam = { folderId: destination.folderId };
  } else if (destination.destination) {
    destParam = { destination: destination.destination };
  } else {
    return { error: "Destination must include either 'destination' or 'folderId'" };
  }

  const movedDocs = await moveDocuments(documentIds, destParam);

  return {
    success: true,
    movedCount: movedDocs.length,
    movedDocuments: movedDocs.map((doc) => ({
      id: doc.id,
      destination: doc.destination,
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const target = input.destination.folderId
    ? `folder ${input.destination.folderId}`
    : input.destination.destination || "unsorted";

  return {
    message: `Move ${input.documentIds.length} document(s) to ${target}?`,
  };
};
