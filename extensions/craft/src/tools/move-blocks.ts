import { Tool } from "@raycast/api";
import { moveBlocks, type BlockPosition } from "../api";

type Input = {
  /**
   * Array of block IDs to move.
   * Use get-blocks tool to find block IDs within a document.
   */
  blockIds: string[];

  /**
   * New position for the blocks. Provide one of:
   * - { position: "start" | "end", pageId: string } - Move to a page
   * - { position: "start" | "end", date: string } - Move to a daily note
   * - { siblingId: string, position: "before" | "after" } - Move relative to a block
   */
  position: {
    position?: "start" | "end" | "before" | "after";
    pageId?: string;
    date?: string;
    siblingId?: string;
  };
};

/**
 * Move blocks to a new position within the same document or to a different document.
 */
export default async function (input: Input) {
  const { blockIds, position } = input;

  if (!blockIds || blockIds.length === 0) {
    return { error: "At least one block ID is required" };
  }

  // Build the position object based on provided fields
  let blockPosition: BlockPosition;

  if (position.siblingId) {
    blockPosition = {
      siblingId: position.siblingId,
      position: (position.position as "before" | "after") || "after",
    };
  } else if (position.date) {
    blockPosition = {
      date: position.date,
      position: (position.position as "start" | "end") || "end",
    };
  } else if (position.pageId) {
    blockPosition = {
      pageId: position.pageId,
      position: (position.position as "start" | "end") || "end",
    };
  } else {
    return { error: "Position must include either 'pageId', 'date', or 'siblingId'" };
  }

  const movedIds = await moveBlocks(blockIds, blockPosition);

  return {
    success: true,
    movedCount: movedIds.length,
    movedBlockIds: movedIds,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const target = input.position.date
    ? `daily note (${input.position.date})`
    : input.position.pageId
      ? `page ${input.position.pageId}`
      : `sibling ${input.position.siblingId}`;

  return {
    message: `Move ${input.blockIds.length} block(s) to ${target}?`,
  };
};
