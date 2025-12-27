import { ActionPanel, Action, Form, Icon, Toast, showToast, popToRoot, open } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { createDocument, getCurrentSpaceId, openLink } from "./api";

type Destination = "unsorted" | "templates";

export default function Command() {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState<Destination>("unsorted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const docTitle = title.trim();
    if (!docTitle) {
      await showToast({ style: Toast.Style.Failure, title: "Title is required" });
      return;
    }

    setIsSubmitting(true);

    try {
      const document = await createDocument({
        title: docTitle,
        destination: { destination },
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Document created",
        message: docTitle,
        primaryAction: {
          title: "Open in Craft",
          onAction: async () => {
            open(openLink({ documentId: document.id, spaceId: await getCurrentSpaceId() }));
          },
        },
      });

      await popToRoot();
    } catch (error) {
      showFailureToast(error, { title: "Failed to create document" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Document" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Document title"
        value={title}
        onChange={setTitle}
        autoFocus
      />
      <Form.Dropdown
        id="destination"
        title="Destination"
        value={destination}
        onChange={(value) => setDestination(value as Destination)}
      >
        <Form.Dropdown.Item value="unsorted" title="Unsorted" icon={Icon.Document} />
        <Form.Dropdown.Item value="templates" title="Templates" icon={Icon.BlankDocument} />
      </Form.Dropdown>
    </Form>
  );
}
