import { Tool } from "@raycast/api";
import { insertBlocks, type BlockPosition, type Block } from "../api";

type Input = {
  /**
   * Array of blocks to insert. Each block should have:
   * - markdown: The content in markdown format
   * - type?: Block type (default: "text")
   * - textStyle?: Style like "body", "h1", "h2", etc.
   * - listStyle?: "none", "bullet", "numbered", "toggle", "task"
   */
  blocks: {
    markdown: string;
    type?: string;
    textStyle?: string;
    listStyle?: string;
  }[];

  /**
   * Position where to insert blocks. Provide one of:
   * - { position: "start" | "end", pageId: string } - Insert in a page
   * - { position: "start" | "end", date: string } - Insert in a daily note
   * - { siblingId: string, position: "before" | "after" } - Insert relative to a block
   */
  position: {
    position?: "start" | "end" | "before" | "after";
    pageId?: string;
    date?: string;
    siblingId?: string;
  };
};

/**
 * Insert new blocks into a document or daily note.
 * Returns the inserted blocks with their assigned IDs.
 */
export default async function (input: Input) {
  const { blocks, position } = input;

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

  const blocksToInsert: Partial<Block>[] = blocks.map((b) => ({
    type: (b.type as Block["type"]) || "text",
    markdown: b.markdown,
    ...(b.textStyle && { textStyle: b.textStyle as Block["textStyle"] }),
    ...(b.listStyle && { listStyle: b.listStyle as Block["listStyle"] }),
  }));

  const insertedBlocks = await insertBlocks(blocksToInsert, blockPosition);

  return {
    success: true,
    insertedCount: insertedBlocks.length,
    blocks: insertedBlocks.map((block) => ({
      id: block.id,
      type: block.type,
      content: block.markdown,
    })),
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const blockCount = input.blocks.length;
  const target = input.position.date
    ? `daily note (${input.position.date})`
    : input.position.pageId
      ? `page ${input.position.pageId}`
      : `sibling ${input.position.siblingId}`;

  return {
    message: `Insert ${blockCount} block(s) into ${target}?`,
  };
};
