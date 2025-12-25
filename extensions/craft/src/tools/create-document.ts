import { Tool } from "@raycast/api";
import { createDocument } from "../api";

type Input = {
  /**
   * The title of the new document.
   */
  title: string;

  /**
   * Where to create the document. Provide one of:
   * - { destination: "unsorted" } - Create in unsorted (default)
   * - { destination: "templates" } - Create as a template
   * - { folderId: string } - Create in a specific folder
   */
  destination?: {
    destination?: "unsorted" | "templates";
    folderId?: string;
  };
};

/**
 * Create a new document in the Craft space.
 */
export default async function (input: Input) {
  const { title, destination } = input;

  // Build destination object
  let destParam: { destination: "unsorted" | "templates" } | { folderId: string } | undefined;

  if (destination?.folderId) {
    destParam = { folderId: destination.folderId };
  } else if (destination?.destination) {
    destParam = { destination: destination.destination };
  }

  const document = await createDocument({
    title,
    destination: destParam,
  });

  return {
    success: true,
    document: {
      id: document.id,
      title: document.title,
    },
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const location = input.destination?.folderId
    ? `folder ${input.destination.folderId}`
    : input.destination?.destination || "unsorted";

  return {
    message: `Create document "${input.title}" in ${location}?`,
  };
};
