import {
  ActionPanel,
  Action,
  List,
  Icon,
  Form,
  useNavigation,
  showToast,
  Toast,
  Alert,
  confirmAlert,
  Color,
  updateCommandMetadata,
} from "@raycast/api";
import { usePromise, showFailureToast } from "@raycast/utils";
import {
  type Space,
  getAllSpaces,
  addSpace,
  updateSpace,
  deleteSpace,
  getCurrentSpaceId,
  setCurrentSpaceId,
} from "./api";

export default function Command() {
  const { data: spaces, isLoading, revalidate } = usePromise(getAllSpaces);
  const { data: currentSpaceId, isLoading: isLoadingCurrentId, revalidate: revalidateCurrentId } = usePromise(getCurrentSpaceId);

  const handleSetCurrent = async (space: Space) => {
    try {
      await setCurrentSpaceId(space.id);
      revalidateCurrentId();
      if (!space.isDefault) {
        await updateCommandMetadata({ subtitle: `Craft (${space.name})` });
      } else {
        await updateCommandMetadata({ subtitle: undefined });
      }
      await showToast({
        style: Toast.Style.Success,
        title: "Space Selected",
        message: `"${space.name}" is now the active space`,
      });
    } catch (error) {
      showFailureToast(error, { title: "Failed to set current space" });
    }
  };

  const handleDelete = async (space: Space) => {
    if (space.isDefault) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Cannot Delete",
        message: "Default space cannot be deleted. Update it in extension preferences.",
      });
      return;
    }

    const confirmed = await confirmAlert({
      title: "Delete Space",
      message: `Are you sure you want to delete "${space.name}"?`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await deleteSpace(space.id);
        revalidate();
        revalidateCurrentId();
        await showToast({
          style: Toast.Style.Success,
          title: "Space Deleted",
          message: `"${space.name}" has been removed`,
        });
      } catch (error) {
        showFailureToast(error, { title: "Failed to delete space" });
      }
    }
  };

  // Don't render items until currentSpaceId is available so selectedItemId works correctly
  const isReady = !isLoading && !isLoadingCurrentId && currentSpaceId;

  return (
    <List isLoading={!isReady} selectedItemId={currentSpaceId}>
      {isReady && (
        <>
          <List.Section title="Spaces" subtitle={spaces?.length ? `${spaces.length} space${spaces.length > 1 ? "s" : ""}` : undefined}>
            {spaces?.map((space) => (
              <List.Item
                key={space.id}
                id={space.id}
                icon={space.id === currentSpaceId ? { source: Icon.CircleFilled, tintColor: Color.Green } : undefined}
                title={space.name}
                subtitle={space.isDefault ? "from preferences" : undefined}
            accessories={[
              space.id === currentSpaceId ? { tag: { value: "Active", color: Color.Green } } : {},
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  {space.id !== currentSpaceId && (
                    <Action
                      title="Set as Current Space"
                      icon={Icon.CheckCircle}
                      onAction={() => handleSetCurrent(space)}
                    />
                  )}
                  {!space.isDefault && (
                    <Action.Push
                      title="Edit Space"
                      icon={Icon.Pencil}
                      target={<EditSpaceForm space={space} onEdit={revalidate} />}
                    />
                  )}
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action.Push
                    title="Add New Space"
                    icon={Icon.Plus}
                    target={<AddSpaceForm onAdd={revalidate} />}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  {!space.isDefault && (
                    <Action
                      title="Delete Space"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["ctrl"], key: "x" }}
                      onAction={() => handleDelete(space)}
                    />
                  )}
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section>
        <List.Item
          icon={Icon.Plus}
          title="Add New Space"
          actions={
            <ActionPanel>
              <Action.Push
                title="Add New Space"
                icon={Icon.Plus}
                target={<AddSpaceForm onAdd={revalidate} />}
              />
            </ActionPanel>
          }
        />
      </List.Section>
        </>
      )}
    </List>
  );
}

interface AddSpaceFormProps {
  onAdd: () => void;
}

function AddSpaceForm({ onAdd }: AddSpaceFormProps) {
  const { pop } = useNavigation();

  const handleSubmit = async (values: { name: string; documentsApiUrl: string; dailyNotesAndTasksApiUrl: string; documentsApiKey?: string; dailyNotesAndTasksApiKey?: string }) => {
    try {
      if (!values.name.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Name is required" });
        return;
      }
      if (!values.documentsApiUrl.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Documents API URL is required" });
        return;
      }
      if (!values.dailyNotesAndTasksApiUrl.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Daily Notes & Tasks API URL is required" });
        return;
      }

      await addSpace({
        name: values.name.trim(),
        documentsApiUrl: values.documentsApiUrl.trim(),
        dailyNotesAndTasksApiUrl: values.dailyNotesAndTasksApiUrl.trim(),
        documentsApiKey: values.documentsApiKey?.trim() || undefined,
        dailyNotesAndTasksApiKey: values.dailyNotesAndTasksApiKey?.trim() || undefined,
      });

      onAdd();
      pop();
      await showToast({
        style: Toast.Style.Success,
        title: "Space Added",
        message: `"${values.name}" has been created`,
      });
    } catch (error) {
      showFailureToast(error, { title: "Failed to add space" });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Space" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Space Name"
        placeholder="Work Space"
        info="A friendly name to identify this space"
      />
      <Form.TextField
        id="documentsApiUrl"
        title="Documents API URL"
        placeholder="https://connect.craft.do/links/YOUR_LINK_ID/api/v1"
        info="Get this from Craft Settings > API Access"
      />
      <Form.TextField
        id="dailyNotesAndTasksApiUrl"
        title="Daily Notes & Tasks API URL"
        placeholder="https://connect.craft.do/links/YOUR_LINK_ID/api/v1"
        info="Get this from Craft Settings > API Access"
      />
      <Form.Separator />
      <Form.Description text="API Keys (Optional)" />
      <Form.PasswordField
        id="documentsApiKey"
        title="Documents API Key"
        placeholder="Optional - for enhanced security"
        info="Create an API key in Craft API connection settings if Access Mode is set to API Key"
      />
      <Form.PasswordField
        id="dailyNotesAndTasksApiKey"
        title="Daily Notes & Tasks API Key"
        placeholder="Optional - for enhanced security"
        info="Create an API key in Craft API connection settings if Access Mode is set to API Key"
      />
    </Form>
  );
}

interface EditSpaceFormProps {
  space: Space;
  onEdit: () => void;
}

function EditSpaceForm({ space, onEdit }: EditSpaceFormProps) {
  const { pop } = useNavigation();

  const handleSubmit = async (values: { name: string; documentsApiUrl: string; dailyNotesAndTasksApiUrl: string; documentsApiKey?: string; dailyNotesAndTasksApiKey?: string }) => {
    try {
      if (!values.name.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Name is required" });
        return;
      }
      if (!values.documentsApiUrl.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Documents API URL is required" });
        return;
      }
      if (!values.dailyNotesAndTasksApiUrl.trim()) {
        await showToast({ style: Toast.Style.Failure, title: "Daily Notes & Tasks API URL is required" });
        return;
      }

      await updateSpace(space.id, {
        name: values.name.trim(),
        documentsApiUrl: values.documentsApiUrl.trim(),
        dailyNotesAndTasksApiUrl: values.dailyNotesAndTasksApiUrl.trim(),
        documentsApiKey: values.documentsApiKey?.trim() || undefined,
        dailyNotesAndTasksApiKey: values.dailyNotesAndTasksApiKey?.trim() || undefined,
      });

      onEdit();
      pop();
      await showToast({
        style: Toast.Style.Success,
        title: "Space Updated",
        message: `"${values.name}" has been updated`,
      });
    } catch (error) {
      showFailureToast(error, { title: "Failed to update space" });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Changes" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Space Name"
        defaultValue={space.name}
        placeholder="Work Space"
        info="A friendly name to identify this space"
      />
      <Form.TextField
        id="documentsApiUrl"
        title="Documents API URL"
        defaultValue={space.documentsApiUrl}
        placeholder="https://connect.craft.do/links/YOUR_LINK_ID/api/v1"
        info="Get this from Craft Settings > API Access"
      />
      <Form.TextField
        id="dailyNotesAndTasksApiUrl"
        title="Daily Notes & Tasks API URL"
        defaultValue={space.dailyNotesAndTasksApiUrl}
        placeholder="https://connect.craft.do/links/YOUR_LINK_ID/api/v1"
        info="Get this from Craft Settings > API Access"
      />
      <Form.Separator />
      <Form.Description text="API Keys (Optional)" />
      <Form.PasswordField
        id="documentsApiKey"
        title="Documents API Key"
        defaultValue={space.documentsApiKey}
        placeholder="Optional - for enhanced security"
        info="Create an API key in Craft API connection settings if Access Mode is set to API Key"
      />
      <Form.PasswordField
        id="dailyNotesAndTasksApiKey"
        title="Daily Notes & Tasks API Key"
        defaultValue={space.dailyNotesAndTasksApiKey}
        placeholder="Optional - for enhanced security"
        info="Create an API key in Craft API connection settings if Access Mode is set to API Key"
      />
    </Form>
  );
}
