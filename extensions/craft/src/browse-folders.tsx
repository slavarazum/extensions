import {
  ActionPanel,
  Action,
  List,
  Icon,
  useNavigation,
  showToast,
  Toast,
  Alert,
  confirmAlert,
  Form,
  Color,
  Detail,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState, useMemo } from "react";
import {
  useFolders,
  useDocuments,
  useBlocks,
  createFolders,
  deleteFolders,
  moveFolders,
  moveDocuments,
  deleteDocuments,
  isSystemFolder,
  type Folder,
  type FlatFolder,
  type Document,
  type VirtualLocation,
  SYSTEM_FOLDER_IDS,
  type SystemFolderId,
} from "./api";

export default function Command() {
  const { folders, userFolders, isLoading, revalidate } = useFolders();

  // Separate root-level folders from system folders
  const rootFolders = folders.filter((f) => !SYSTEM_FOLDER_IDS.includes(f.id as SystemFolderId));
  const systemFolderItems = folders.filter((f) => SYSTEM_FOLDER_IDS.includes(f.id as SystemFolderId));

  return (
    <List isLoading={isLoading} selectedItemId="create-new-folder">
      <List.Section>
        <List.Item
          id="create-new-folder"
          icon={Icon.Plus}
          title="Create New Folder"
          actions={
            <ActionPanel>
              <Action.Push
                title="Create New Folder"
                icon={Icon.Plus}
                target={<CreateFolderForm onCreated={revalidate} />}
              />
            </ActionPanel>
          }
        />
      </List.Section>
      {rootFolders.length > 0 && (
        <List.Section title="Folders" subtitle={`${rootFolders.length}`}>
          {rootFolders.map((folder) => (
            <List.Item
              key={folder.id}
              icon={folder.folders.length > 0 ? Icon.Folder : Icon.Folder}
              title={folder.name}
              accessories={[
                ...(folder.folders.length > 0 ? [{ tag: `${folder.folders.length} subfolders` }] : []),
                {
                  text: `${folder.documentCount} doc${folder.documentCount !== 1 ? "s" : ""}`,
                  tooltip: "Document count",
                },
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action.Push
                      title="Open Folder"
                      icon={Icon.Folder}
                      target={
                        <FolderContents folder={folder} allFolders={userFolders} revalidateFolders={revalidate} />
                      }
                    />
                    <Action.Push
                      title="Create Subfolder"
                      icon={Icon.Plus}
                      shortcut={{ modifiers: ["cmd"], key: "n" }}
                      target={<CreateFolderForm parentFolderId={folder.id} onCreated={revalidate} />}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action.Push
                      title="Move Folder"
                      icon={Icon.ArrowRight}
                      shortcut={{ modifiers: ["cmd"], key: "m" }}
                      target={
                        <MoveFolderForm
                          folderId={folder.id}
                          folderName={folder.name}
                          allFolders={userFolders}
                          onMoved={revalidate}
                        />
                      }
                    />
                    <Action.Push
                      title="Rename Folder"
                      icon={Icon.Pencil}
                      target={<RenameFolderForm folder={folder} />}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Delete Folder"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["ctrl"], key: "x" }}
                      onAction={() => handleDeleteFolder(folder, revalidate)}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      <List.Section title="System Locations" subtitle={`${systemFolderItems.length}`}>
        {[...systemFolderItems].reverse().map((folder) => (
          <List.Item
            key={folder.id}
            icon={getSystemFolderIcon(folder.id)}
            title={folder.name}
            accessories={[
              {
                text: `${folder.documentCount} doc${folder.documentCount !== 1 ? "s" : ""}`,
                tooltip: "Document count",
              },
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.Push
                    title="Open Location"
                    icon={Icon.Folder}
                    target={<FolderContents folder={folder} allFolders={userFolders} revalidateFolders={revalidate} />}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function getSystemFolderIcon(folderId: string): Icon {
  switch (folderId) {
    case "unsorted":
      return Icon.Document;
    case "daily_notes":
      return Icon.Calendar;
    case "trash":
      return Icon.Trash;
    case "templates":
      return Icon.BlankDocument;
    default:
      return Icon.Folder;
  }
}

async function handleDeleteFolder(folder: { id: string; name: string }, revalidate: () => void) {
  const confirmed = await confirmAlert({
    title: "Delete Folder",
    message: `Are you sure you want to delete "${folder.name}"? Documents inside will be moved to Unsorted.`,
    primaryAction: {
      title: "Delete",
      style: Alert.ActionStyle.Destructive,
    },
  });

  if (confirmed) {
    try {
      await deleteFolders([folder.id]);
      revalidate();
      await showToast({
        style: Toast.Style.Success,
        title: "Folder Deleted",
        message: folder.name,
      });
    } catch (error) {
      showFailureToast(error, { title: "Failed to delete folder" });
    }
  }
}

function FolderContents({
  folder,
  allFolders,
  revalidateFolders,
}: {
  folder: Folder;
  allFolders: FlatFolder[];
  revalidateFolders: () => void;
}) {
  // System folders (unsorted, trash, templates, daily_notes) use `location` param,
  // regular folders use `folderId` param
  const isSystem = isSystemFolder(folder.id);
  const params = isSystem
    ? { location: folder.id as VirtualLocation, fetchMetadata: true }
    : { folderId: folder.id, fetchMetadata: true };
  const { documents, isLoading, revalidate } = useDocuments(params);

  const handleRevalidate = () => {
    revalidate();
    revalidateFolders();
  };

  return (
    <List isLoading={isLoading} navigationTitle={folder.name}>
      {folder.folders.length > 0 && (
        <List.Section title="Subfolders" subtitle={`${folder.folders.length}`}>
          {folder.folders.map((subfolder) => (
            <List.Item
              key={subfolder.id}
              icon={Icon.Folder}
              title={subfolder.name}
              accessories={[{ text: `${subfolder.documentCount} docs` }]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Open Folder"
                    icon={Icon.Folder}
                    target={
                      <FolderContents
                        folder={subfolder}
                        allFolders={allFolders}
                        revalidateFolders={revalidateFolders}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      <List.Section title="Documents" subtitle={documents.length > 0 ? `${documents.length}` : undefined}>
        {[...documents].reverse().map((doc) => (
          <DocumentItem
            key={doc.id}
            document={doc}
            currentFolderId={folder.id}
            allFolders={allFolders}
            onRevalidate={handleRevalidate}
          />
        ))}
      </List.Section>

      {documents.length === 0 && folder.folders.length === 0 && (
        <List.EmptyView icon={Icon.Folder} title="Empty folder" description="No documents or subfolders" />
      )}
    </List>
  );
}

function DocumentItem({
  document,
  currentFolderId,
  allFolders,
  onRevalidate,
}: {
  document: Document;
  currentFolderId: string;
  allFolders: FlatFolder[];
  onRevalidate: () => void;
}) {
  const lastModified = document.lastModifiedAt ? new Date(document.lastModifiedAt).toLocaleDateString() : undefined;

  return (
    <List.Item
      title={document.title || "Untitled"}
      accessories={lastModified ? [{ text: lastModified, tooltip: "Last modified" }] : []}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Show Preview"
              icon={Icon.Eye}
              target={
                <DocumentPreview
                  documentId={document.id}
                  title={document.title}
                  clickableLink={document.clickableLink}
                />
              }
            />
            {document.clickableLink && (
              <Action.Open title="Open in App" target={document.clickableLink} icon={Icon.AppWindow} />
            )}
            <Action.CopyToClipboard
              title="Copy Document ID"
              content={document.id}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.Push
              title="Move to Folder"
              icon={Icon.ArrowRight}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={
                <MoveDocumentForm
                  document={document}
                  currentFolderId={currentFolderId}
                  allFolders={allFolders}
                  onMoved={onRevalidate}
                />
              }
            />
            <Action
              title="Move to Unsorted"
              icon={Icon.Document}
              onAction={async () => {
                try {
                  await moveDocuments([document.id], { destination: "unsorted" });
                  onRevalidate();
                  await showToast({ style: Toast.Style.Success, title: "Moved to Unsorted" });
                } catch (error) {
                  showFailureToast(error, { title: "Failed to move" });
                }
              }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Move to Trash"
              icon={{ source: Icon.Trash, tintColor: Color.Red }}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: "Move to Trash",
                  message: `Move "${document.title || "Untitled"}" to trash?`,
                  primaryAction: { title: "Move to Trash", style: Alert.ActionStyle.Destructive },
                });
                if (!confirmed) return;
                try {
                  await deleteDocuments([document.id]);
                  onRevalidate();
                  await showToast({ style: Toast.Style.Success, title: "Moved to trash" });
                } catch (error) {
                  showFailureToast(error, { title: "Failed to delete" });
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function DocumentPreview({
  documentId,
  title,
  clickableLink,
}: {
  documentId: string;
  title?: string;
  clickableLink?: string;
}) {
  const { isLoading, blocks } = useBlocks({ id: documentId, maxDepth: -1 });

  // Convert blocks to markdown for display
  const markdown = useMemo(() => {
    if (isLoading) return "loading document...";
    if (!blocks || blocks.length === 0) return "No content";

    const renderBlock = (block: { markdown?: string; content?: typeof blocks }): string => {
      let result = block.markdown || "";
      if (block.content && block.content.length > 0) {
        result += "\n" + block.content.map(renderBlock).join("\n");
      }
      return result;
    };

    return blocks.map(renderBlock).join("\n\n");
  }, [blocks, isLoading]);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={title || "Document Preview"}
      actions={
        <ActionPanel>
          {clickableLink && <Action.Open title="Open in App" target={clickableLink} icon={Icon.AppWindow} />}
          <Action.CopyToClipboard title="Copy Document ID" content={documentId} />
        </ActionPanel>
      }
    />
  );
}

function CreateFolderForm({ parentFolderId, onCreated }: { parentFolderId?: string; onCreated: () => void }) {
  const { pop } = useNavigation();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const folderName = name.trim();
    if (!folderName) {
      await showToast({ style: Toast.Style.Failure, title: "Name is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFolders([{ name: folderName, parentFolderId }]);
      onCreated();
      await showToast({ style: Toast.Style.Success, title: "Folder Created", message: folderName });
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to create folder" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Folder" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Folder Name" placeholder="My Folder" value={name} onChange={setName} autoFocus />
      {parentFolderId && <Form.Description title="Parent" text="Will be created as a subfolder" />}
    </Form>
  );
}

function RenameFolderForm({ folder }: { folder: { id: string; name: string } }) {
  const { pop } = useNavigation();

  // Note: Craft API doesn't have a direct rename endpoint
  // We need to create a new folder and move documents, then delete old
  // For now, show a message that rename isn't directly supported
  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Close" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Rename Folder"
        text="Folder renaming is not directly supported by the Craft API. To rename, create a new folder, move documents to it, then delete the old folder."
      />
      <Form.Description title="Current Name" text={folder.name} />
    </Form>
  );
}

function MoveFolderForm({
  folderId,
  folderName,
  allFolders,
  onMoved,
}: {
  folderId: string;
  folderName: string;
  allFolders: FlatFolder[];
  onMoved: () => void;
}) {
  const { pop } = useNavigation();
  const [destination, setDestination] = useState<string>("root");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out the current folder and its children from destination options
  const availableFolders = allFolders.filter((f) => {
    if (f.id === folderId) return false;
    // Check if this folder is a child of the folder being moved
    const currentFolder = allFolders.find((ff) => ff.id === folderId);
    if (currentFolder && f.path.startsWith(currentFolder.path + "/")) return false;
    return true;
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (destination === "root") {
        await moveFolders([folderId], { destination: "root" });
      } else {
        await moveFolders([folderId], { parentFolderId: destination });
      }
      onMoved();
      await showToast({ style: Toast.Style.Success, title: "Folder Moved", message: folderName });
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to move folder" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Move Folder" icon={Icon.ArrowRight} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Moving" text={folderName} />
      <Form.Dropdown id="destination" title="Destination" value={destination} onChange={setDestination}>
        <Form.Dropdown.Item value="root" title="Root (Top Level)" icon={Icon.Folder} />
        {availableFolders.map((f) => (
          <Form.Dropdown.Item key={f.id} value={f.id} title={"  ".repeat(f.depth) + f.name} icon={Icon.Folder} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

function MoveDocumentForm({
  document,
  currentFolderId,
  allFolders,
  onMoved,
}: {
  document: Document;
  currentFolderId: string;
  allFolders: FlatFolder[];
  onMoved: () => void;
}) {
  const { pop } = useNavigation();
  const [destination, setDestination] = useState<string>("unsorted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out the current folder from destination options
  const availableFolders = allFolders.filter((f) => f.id !== currentFolderId);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (destination === "unsorted" || destination === "templates") {
        await moveDocuments([document.id], { destination });
      } else {
        await moveDocuments([document.id], { folderId: destination });
      }
      onMoved();
      await showToast({ style: Toast.Style.Success, title: "Document Moved", message: document.title });
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to move document" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Move Document" icon={Icon.ArrowRight} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Moving" text={document.title || "Untitled"} />
      <Form.Dropdown id="destination" title="Destination" value={destination} onChange={setDestination}>
        <Form.Dropdown.Section title="Locations">
          <Form.Dropdown.Item value="unsorted" title="Unsorted" icon={Icon.Document} />
          <Form.Dropdown.Item value="templates" title="Templates" icon={Icon.BlankDocument} />
        </Form.Dropdown.Section>
        <Form.Dropdown.Section title="Folders">
          {availableFolders.map((f) => (
            <Form.Dropdown.Item key={f.id} value={f.id} title={"  ".repeat(f.depth) + f.name} icon={Icon.Folder} />
          ))}
        </Form.Dropdown.Section>
      </Form.Dropdown>
    </Form>
  );
}
