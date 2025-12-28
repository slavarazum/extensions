import { ActionPanel, Action, Form, Icon, Toast, showToast, useNavigation } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { createTask, formatLocalDate, type CreateTaskParams } from "../api";

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const { pop } = useNavigation();
  const [markdown, setMarkdown] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [location, setLocation] = useState<"inbox" | "dailyNote">("inbox");

  const handleSubmit = async () => {
    if (!markdown.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Task content is required" });
      return;
    }

    try {
      const taskParams: CreateTaskParams = {
        markdown: markdown.trim(),
        location: { type: location },
      };

      if (scheduleDate || deadlineDate) {
        taskParams.taskInfo = {};
        if (scheduleDate) {
          taskParams.taskInfo.scheduleDate = formatLocalDate(scheduleDate);
        }
        if (deadlineDate) {
          taskParams.taskInfo.deadlineDate = formatLocalDate(deadlineDate);
        }
      }

      await createTask(taskParams);
      await showToast({ style: Toast.Style.Success, title: "Task created" });
      onTaskCreated();
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to create task" });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="markdown"
        title="Task"
        placeholder="Enter task description"
        value={markdown}
        onChange={setMarkdown}
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
