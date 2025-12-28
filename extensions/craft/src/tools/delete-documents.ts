import { Tool } from "@raycast/api";
import { deleteDocuments } from "../api";

type Input = {
  /**
   * Array of document IDs to delete.
   * Use search-documents or list-documents tools to find document IDs.
   * Documents will be moved to trash. If already in trash, they will be permanently deleted.
   */
  documentIds: string[];
};

/**
 * Delete documents by moving them to trash.
 * If documents are already in trash, they will be permanently deleted.
 */
export default async function (input: Input) {
  const { documentIds } = input;

  if (!documentIds || documentIds.length === 0) {
    return { error: "At least one document ID is required" };
  }

  const deletedIds = await deleteDocuments(documentIds);

  return {
    success: true,
    deletedCount: deletedIds.length,
    deletedDocumentIds: deletedIds,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Delete ${input.documentIds.length} document(s)? Documents will be moved to trash.`,
  };
};
