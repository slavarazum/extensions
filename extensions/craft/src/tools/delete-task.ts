import { Tool } from "@raycast/api";
import { deleteTask } from "../api";

type Input = {
  /**
   * The ID of the task to delete.
   * Use use-tasks tool to find task IDs.
   */
  taskId: string;
};

/**
 * Delete a task from Craft.
 * Only tasks in inbox, logbook, or daily notes can be deleted.
 * Tasks in regular documents cannot be deleted via this tool.
 */
export default async function (input: Input) {
  const { taskId } = input;

  await deleteTask(taskId);

  return {
    success: true,
    deletedTaskId: taskId,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Delete task ${input.taskId}? This action cannot be undone.`,
  };
};
