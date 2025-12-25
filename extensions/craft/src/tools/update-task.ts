import { Tool } from "@raycast/api";
import { updateTask } from "../api";

type Input = {
  /**
   * The ID of the task to update.
   */
  taskId: string;

  /**
   * Updates to apply to the task:
   * - state?: "todo" | "done" | "canceled"
   * - scheduleDate?: New schedule date (YYYY-MM-DD or 'today', 'tomorrow', 'yesterday')
   * - deadlineDate?: New deadline (YYYY-MM-DD or 'today', 'tomorrow', 'yesterday')
   */
  updates: {
    state?: "todo" | "done" | "canceled";
    scheduleDate?: string;
    deadlineDate?: string;
  };
};

/**
 * Update an existing task.
 * Can modify task state, schedule date, and deadline.
 * Marking tasks as done or canceled moves them to logbook.
 */
export default async function (input: Input) {
  const { taskId, updates } = input;

  await updateTask(taskId, updates);

  return {
    success: true,
    taskId,
    updates,
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const changes = [];
  if (input.updates.state) changes.push(`state → ${input.updates.state}`);
  if (input.updates.scheduleDate) changes.push(`scheduled → ${input.updates.scheduleDate}`);
  if (input.updates.deadlineDate) changes.push(`deadline → ${input.updates.deadlineDate}`);

  return {
    message: `Update task? Changes: ${changes.join(", ")}`,
  };
};
