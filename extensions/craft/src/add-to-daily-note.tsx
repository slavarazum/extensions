import { Form, ActionPanel, Action, showToast, Toast, popToRoot } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useDailyNote, type Block } from "./api";

interface FormValues {
  content: string;
  listStyle: Block["listStyle"];
}

export default function Command() {
  const { addContent } = useDailyNote();

  async function handleSubmit(values: FormValues) {
    if (!values.content.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Content is required" });
      return;
    }

    const toast = await showToast({ style: Toast.Style.Animated, title: "Adding to daily note..." });

    try {
      await addContent(values.content, values.listStyle || "none");

      toast.style = Toast.Style.Success;
      toast.title = "Added to daily note";
      await popToRoot();
    } catch (error) {
      await showFailureToast(error, { title: "Failed to add to daily note" });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add to Daily Note" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="content" title="Content" placeholder="Enter text to add to today's daily note..." autoFocus />
      <Form.Separator />
      <Form.Dropdown id="listStyle" title="List Style" defaultValue="none">
        <Form.Dropdown.Item value="none" title="None" />
        <Form.Dropdown.Item value="bullet" title="Bullet" />
        <Form.Dropdown.Item value="numbered" title="Numbered" />
        <Form.Dropdown.Item value="task" title="Task" />
        <Form.Dropdown.Item value="toggle" title="Toggle" />
      </Form.Dropdown>
    </Form>
  );
}
