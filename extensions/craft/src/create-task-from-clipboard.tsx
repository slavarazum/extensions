import { Clipboard, showToast, Toast, launchCommand, LaunchType } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { createTask } from "./api";

export default async function Command() {
  let text: string | undefined;

  try {
    const clipboardText = await Clipboard.readText();
    text = clipboardText ?? undefined;
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clipboard empty",
      message: "Please copy some text first",
    });
    return;
  }

  if (!text?.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clipboard empty",
      message: "Please copy some text first",
    });
    return;
  }

  const taskContent = text.trim();

  try {
    await createTask({
      markdown: taskContent,
      location: { type: "inbox" },
    });

    await showToast({
      style: Toast.Style.Success,
      title: "Task created",
      message: taskContent.length > 50 ? taskContent.substring(0, 50) + "..." : taskContent,
    });

    // Open inbox tasks to show the new task
    await launchCommand({ name: "inbox-tasks", type: LaunchType.UserInitiated });
  } catch (error) {
    showFailureToast(error, { title: "Failed to create task" });
  }
}
