import { fetchTasks, type TaskScope } from "../api";

type Input = {
  /**
   * The scope of tasks to retrieve.
   * - "active": Tasks due before now that are not completed/cancelled
   * - "upcoming": Tasks scheduled after now
   * - "inbox": Tasks in the task inbox
   * - "logbook": Completed and cancelled tasks
   * - "document": Tasks in a specific document (requires documentId)
   */
  scope: TaskScope;

  /**
   * Required when scope is "document".
   * The ID of the document to list tasks from.
   */
  documentId?: string;
};

export default async function (input: Input) {
  const { scope, documentId } = input;

  const tasks = await fetchTasks({
    scope,
    documentId: scope === "document" ? documentId : undefined,
  });

  // Format results for better readability
  const formattedTasks = tasks.map((task) => ({
    id: task.id,
    content: task.markdown,
    state: task.taskInfo.state,
    ...(task.taskInfo.scheduleDate && { scheduled: task.taskInfo.scheduleDate }),
    ...(task.taskInfo.deadlineDate && { deadline: task.taskInfo.deadlineDate }),
  }));

  return {
    scope,
    totalTasks: formattedTasks.length,
    tasks: formattedTasks,
  };
}
