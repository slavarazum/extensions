import { Tool } from "@raycast/api";
import { createTask, type CreateTaskParams } from "../api";

type Input = {
  /**
   * The task content in markdown format.
   */
  markdown: string;

  /**
   * Task scheduling info:
   * - scheduleDate?: When the task is scheduled (YYYY-MM-DD or 'today', 'tomorrow', 'yesterday')
   * - deadlineDate?: Task deadline (YYYY-MM-DD or 'today', 'tomorrow', 'yesterday')
   */
  taskInfo?: {
    scheduleDate?: string;
    deadlineDate?: string;
  };

  /**
   * Where to create the task:
   * - "inbox" - Create in task inbox (default)
   * - "dailyNote" - Create in a daily note
   */
  locationType: "inbox" | "dailyNote";
};

/**
 * Create a new task in Craft.
 * Tasks can be created in the inbox or daily notes.
 */
export default async function (input: Input) {
  const { markdown, taskInfo, locationType = "inbox" } = input;

  const params: CreateTaskParams = {
    markdown,
    location: { type: locationType },
    ...(taskInfo && { taskInfo }),
  };

  const task = await createTask(params);

  return {
    success: true,
    task: {
      id: task.id,
      content: task.markdown,
      state: task.taskInfo?.state,
      ...(task.taskInfo?.scheduleDate && { scheduled: task.taskInfo.scheduleDate }),
      ...(task.taskInfo?.deadlineDate && { deadline: task.taskInfo.deadlineDate }),
    },
  };
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const preview = input.markdown.length > 50 ? input.markdown.slice(0, 50) + "..." : input.markdown;
  return {
    message: `Create task "${preview}" in ${input.locationType || "inbox"}?`,
  };
};
