import { ActionPanel, Action, List, Icon, Color, Alert, confirmAlert, showToast, Toast, Form, useNavigation } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { useDocuments, deleteDocuments, moveDocuments, useFolders, type Document, type FlatFolder } from "./api";

export default function Command() {
  const { documents, isLoading, revalidate } = useDocuments({
    location: "trash",
    fetchMetadata: true,
  });
  const { userFolders, isLoading: isLoadingFolders } = useFolders();

  // Sort by last modified (most recently deleted first)
  const sortedDocs = [...documents].sort((a, b) => {
    const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
    const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
    return dateB - dateA;
  });

  async function handleRestore(doc: Document) {
    try {
      await moveDocuments([doc.id], { destination: "unsorted" });
      await showToast({ style: Toast.Style.Success, title: "Restored", message: doc.title });
      revalidate();
    } catch (error) {
      showFailureToast(error, { title: "Failed to restore" });
    }
  }

  async function handlePermanentDelete(doc: Document) {
    const confirmed = await confirmAlert({
      title: "Permanently Delete",
      message: `Are you sure you want to permanently delete "${doc.title}"? This cannot be undone.`,
      primaryAction: {
        title: "Delete Permanently",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      await deleteDocuments([doc.id]);
      await showToast({ style: Toast.Style.Success, title: "Deleted permanently" });
      revalidate();
    } catch (error) {
      showFailureToast(error, { title: "Failed to delete" });
    }
  }

  async function handleEmptyTrash() {
    if (sortedDocs.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "Trash is empty" });
      return;
    }

    const confirmed = await confirmAlert({
      title: "Empty Trash",
      message: `Are you sure you want to permanently delete all ${sortedDocs.length} items in trash? This cannot be undone.`,
      primaryAction: {
        title: "Empty Trash",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      const ids = sortedDocs.map((doc) => doc.id);

      await deleteDocuments(ids);
      await showToast({ style: Toast.Style.Success, title: `Deleted ${ids.length} items` });
      revalidate();
    } catch (error) {
      showFailureToast(error, { title: "Failed to empty trash" });
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <List
      isLoading={isLoading || isLoadingFolders}
      searchBarPlaceholder="Filter deleted documents..."
      actions={
        <ActionPanel>
          <Action
            title="Empty Trash"
            icon={{ source: Icon.Trash, tintColor: Color.Red }}
            style={Action.Style.Destructive}
            onAction={handleEmptyTrash}
          />
          <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
        </ActionPanel>
      }
    >
      <List.Section title="Recently Deleted" subtitle={`${sortedDocs.length}`}>
        {sortedDocs.map((doc) => (
          <List.Item
            key={doc.id}
            icon={{ source: Icon.Trash, tintColor: Color.Red }}
            title={doc.title || "Untitled"}
            subtitle={formatDate(doc.lastModifiedAt)}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title="Restore to Unsorted"
                    icon={Icon.ArrowCounterClockwise}
                    onAction={() => handleRestore(doc)}
                  />
                  <Action.Push
                    title="Restore to Folder"
                    icon={Icon.Folder}
                    shortcut={{ modifiers: ["cmd"], key: "m" }}
                    target={
                      <RestoreToFolderForm
                        document={doc}
                        allFolders={userFolders}
                        onRestored={revalidate}
                      />
                    }
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Delete Permanently"
                    icon={{ source: Icon.Trash, tintColor: Color.Red }}
                    style={Action.Style.Destructive}
                    onAction={() => handlePermanentDelete(doc)}
                  />
                  <Action
                    title="Empty Trash"
                    icon={{ source: Icon.Trash, tintColor: Color.Red }}
                    style={Action.Style.Destructive}
                    onAction={handleEmptyTrash}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {!isLoading && sortedDocs.length === 0 && (
        <List.EmptyView
          icon={Icon.Trash}
          title="Trash is empty"
          description="Deleted documents will appear here"
        />
      )}
    </List>
  );
}

function RestoreToFolderForm({
  document,
  allFolders,
  onRestored,
}: {
  document: Document;
  allFolders: FlatFolder[];
  onRestored: () => void;
}) {
  const { pop } = useNavigation();
  const [destination, setDestination] = useState<string>("unsorted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (destination === "unsorted" || destination === "templates") {
        await moveDocuments([document.id], { destination });
      } else {
        await moveDocuments([document.id], { folderId: destination });
      }
      await showToast({ style: Toast.Style.Success, title: "Restored", message: document.title });
      onRestored();
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to restore" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Restore" icon={Icon.ArrowCounterClockwise} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Restoring" text={document.title || "Untitled"} />
      <Form.Dropdown id="destination" title="Restore to" value={destination} onChange={setDestination}>
        <Form.Dropdown.Section title="Locations">
          <Form.Dropdown.Item value="unsorted" title="Unsorted" icon={Icon.Document} />
          <Form.Dropdown.Item value="templates" title="Templates" icon={Icon.BlankDocument} />
        </Form.Dropdown.Section>
        {allFolders.length > 0 && (
          <Form.Dropdown.Section title="Folders">
            {allFolders.map((f) => (
              <Form.Dropdown.Item key={f.id} value={f.id} title={"  ".repeat(f.depth) + f.name} icon={Icon.Folder} />
            ))}
          </Form.Dropdown.Section>
        )}
      </Form.Dropdown>
    </Form>
  );
}
