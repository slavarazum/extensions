import { Form, ActionPanel, Action, showToast, Toast, popToRoot, Icon } from "@raycast/api";
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
      <Form.TextArea id="content" title="Content" placeholder="Enter text to add to today's daily note..." autoFocus enableMarkdown info="You can use Markdown to format the note. Pressing (⌘/ctrl + B) will add **bold** around the selected text, (⌘/ctrl + I) will make the selected text italic, etc." />
      <Form.Separator />
      <Form.Dropdown id="listStyle" title="List Style" defaultValue="none" storeValue={true}>
        <Form.Dropdown.Item value="none" title="none" icon={Icon.Text} />
        <Form.Dropdown.Item value="bullet" title="Bullet" icon={Icon.BulletPoints} />
        <Form.Dropdown.Item value="numbered" title="Numbered" icon={Icon.NumberList} />
        <Form.Dropdown.Item value="task" title="Task" icon={Icon.CheckCircle} />
        <Form.Dropdown.Item value="toggle" title="Toggle" icon={Icon.ChevronRightSmall} />
      </Form.Dropdown>
    </Form>
  );
}
