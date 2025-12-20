import { ActionPanel, Action, Form, Icon, Toast, showToast, LaunchProps } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState, useEffect } from "react";
import { createTask, type CreateTaskParams } from "./api";

interface AddTaskArguments {
  task: string;
  schedule?: string;
  deadline?: string;
}

/**
 * Parse a date string in format YYYY-MM-DD or relative like "today", "tomorrow"
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (trimmed === "today") {
    return today;
  }
  if (trimmed === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Try parsing as YYYY-MM-DD
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export default function Command(props: LaunchProps<{ arguments: AddTaskArguments }>) {
  const { task: taskArgument, schedule: scheduleArgument, deadline: deadlineArgument } = props.arguments;

  const [markdown, setMarkdown] = useState(taskArgument || "");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(parseDate(scheduleArgument));
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(parseDate(deadlineArgument));
  const [location, setLocation] = useState<"inbox" | "dailyNote">("inbox");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If task argument is provided, auto-submit
  useEffect(() => {
    if (taskArgument?.trim()) {
      handleSubmit();
    }
  }, []);

  const handleSubmit = async () => {
    const taskContent = markdown.trim();
    if (!taskContent) {
      await showToast({ style: Toast.Style.Failure, title: "Task content is required" });
      return;
    }

    setIsSubmitting(true);

    try {
      const taskParams: CreateTaskParams = {
        markdown: taskContent,
        location: { type: location },
      };

      if (scheduleDate || deadlineDate) {
        taskParams.taskInfo = {};
        if (scheduleDate) {
          taskParams.taskInfo.scheduleDate = scheduleDate.toISOString().split("T")[0];
        }
        if (deadlineDate) {
          taskParams.taskInfo.deadlineDate = deadlineDate.toISOString().split("T")[0];
        }
      }

      await createTask(taskParams);
      await showToast({ style: Toast.Style.Success, title: "Task created", message: taskContent });

      // Clear form for next task
      setMarkdown("");
      setScheduleDate(null);
      setDeadlineDate(null);
    } catch (error) {
      showFailureToast(error, { title: "Failed to create task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Task" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="markdown"
        title="Task"
        placeholder="What needs to be done?"
        value={markdown}
        onChange={setMarkdown}
        autoFocus
      />
      <Form.Dropdown
        id="location"
        title="Location"
        value={location}
        onChange={(value) => setLocation(value as "inbox" | "dailyNote")}
      >
        <Form.Dropdown.Item value="inbox" title="Inbox" icon={Icon.Tray} />
        <Form.Dropdown.Item value="dailyNote" title="Daily Note" icon={Icon.Calendar} />
      </Form.Dropdown>
      <Form.DatePicker id="scheduleDate" title="Schedule" value={scheduleDate} onChange={setScheduleDate} />
      <Form.DatePicker id="deadlineDate" title="Deadline" value={deadlineDate} onChange={setDeadlineDate} />
    </Form>
  );
}
