import { ActionPanel, Action, Form, Icon, Toast, showToast, popToRoot, open } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { createDocument, openLink, useFolders } from "./api";

type DestinationType = "unsorted" | "templates" | "folder";

export default function Command() {
  const [title, setTitle] = useState("");
  const [destinationType, setDestinationType] = useState<DestinationType>("unsorted");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userFolders, isLoading: isLoadingFolders } = useFolders();

  const handleSubmit = async (openAfterCreate: boolean) => {
    const docTitle = title.trim();
    if (!docTitle) {
      await showToast({ style: Toast.Style.Failure, title: "Title is required" });
      return;
    }

    if (destinationType === "folder" && !selectedFolderId) {
      await showToast({ style: Toast.Style.Failure, title: "Please select a folder" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build destination based on type
      const destination =
        destinationType === "folder"
          ? { folderId: selectedFolderId }
          : { destination: destinationType as "unsorted" | "templates" };

      const document = await createDocument({
        title: docTitle,
        destination,
      });

      const link = await openLink({ documentId: document.id });

      if (openAfterCreate) {
        await open(link);
        await showToast({
          style: Toast.Style.Success,
          title: "Document created and opened",
          message: docTitle,
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Document created",
          message: docTitle,
          primaryAction: {
            title: "Open in App",
            onAction: () => open(link),
          },
        });
      }

      await popToRoot();
    } catch (error) {
      showFailureToast(error, { title: "Failed to create document" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting || isLoadingFolders}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Document" icon={Icon.Plus} onSubmit={() => handleSubmit(false)} />
          <Action.SubmitForm
            title="Create and Open in App"
            icon={Icon.AppWindowSidebarRight}
            onSubmit={() => handleSubmit(true)}
          />
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
        id="destinationType"
        title="Destination"
        value={destinationType}
        onChange={(value) => setDestinationType(value as DestinationType)}
      >
        <Form.Dropdown.Item value="unsorted" title="Unsorted" icon={Icon.Document} />
        <Form.Dropdown.Item value="templates" title="Templates" icon={Icon.BlankDocument} />
        <Form.Dropdown.Item value="folder" title="Folder..." icon={Icon.Folder} />
      </Form.Dropdown>
      {destinationType === "folder" && (
        <Form.Dropdown id="folderId" title="Folder" value={selectedFolderId} onChange={setSelectedFolderId}>
          <Form.Dropdown.Item value="" title="Select a folder..." icon={Icon.Folder} />
          {userFolders.map((folder) => (
            <Form.Dropdown.Item
              key={folder.id}
              value={folder.id}
              title={"  ".repeat(folder.depth) + folder.name}
              icon={Icon.Folder}
            />
          ))}
        </Form.Dropdown>
      )}
    </Form>
  );
}
