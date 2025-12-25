import { Tool } from "@raycast/api";
import { updateBlocks } from "../api";

type Input = {
  /**
   * Array of block updates. Each update should have:
   * - id: The block ID to update (required)
   * - markdown?: New markdown content
   * - taskInfo?: Task state updates { state?: "todo" | "done" | "canceled", scheduleDate?, deadlineDate? }
   */
  blocks: {
    id: string;
    markdown?: string;
    taskInfo?: {
      state?: "todo" | "done" | "canceled";
      scheduleDate?: string;
      deadlineDate?: string;
    };
  }[];
};

/**
 * Update existing blocks in a document.
 * Only the fields provided will be updated.
 */
export default async function (input: Input) {
  const { blocks } = input;

  if (!blocks || blocks.length === 0) {
    return { error: "At least one block update is required" };
  }

  const updatedBlocks = await updateBlocks(blocks);

  return {
    success: true,
    updatedCount: updatedBlocks.length,
    blocks: updatedBlocks.map((block) => ({
      id: block.id,
      type: block.type,
      content: block.markdown,
      ...(block.taskInfo && { taskInfo: block.taskInfo }),
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Update ${input.blocks.length} block(s)?`,
  };
};
