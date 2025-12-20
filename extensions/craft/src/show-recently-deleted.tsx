import { ActionPanel, Action, List, Icon, Color, Alert, confirmAlert, showToast, Toast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useDocuments, deleteDocuments, type Document } from "./api";

export default function Command() {
  const { documents, isLoading, revalidate } = useDocuments({
    location: "trash",
    fetchMetadata: true,
  });

  // Sort by last modified (most recently deleted first)
  const sortedDocs = [...documents].sort((a, b) => {
    const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
    const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
    return dateB - dateA;
  });

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
      console.log(await deleteDocuments([doc.id]));
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
      console.log(sortedDocs);

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
      isLoading={isLoading}
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
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
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
