import { ActionPanel, Action, List, Icon, Detail, Color } from "@raycast/api";
import { useState } from "react";
import { useDocuments, useBlocks, type Block } from "./api";

export default function Command() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");

  const { documents, isLoading: isLoadingDocuments } = useDocuments();
  const { blocks, isLoading: isLoadingBlocks } = useBlocks({
    pageId: selectedDocumentId,
    includeContent: true,
    includeMetadata: true,
  });

  const isLoading = isLoadingDocuments || (selectedDocumentId.length > 0 && isLoadingBlocks);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter blocks..."
      searchBarAccessory={
        <List.Dropdown tooltip="Select Document" value={selectedDocumentId} onChange={setSelectedDocumentId}>
          <List.Dropdown.Item title="Select a document..." value="" icon={Icon.Document} />
          <List.Dropdown.Section title="Documents">
            {documents.map((doc) => (
              <List.Dropdown.Item key={doc.id} title={doc.title || "Untitled"} value={doc.id} icon={Icon.Document} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {!selectedDocumentId ? (
        <List.EmptyView
          icon={Icon.Document}
          title="Select a document"
          description="Choose a document from the dropdown to view its blocks"
        />
      ) : blocks.length === 0 && !isLoading ? (
        <List.EmptyView icon={Icon.TextDocument} title="No blocks" description="This document has no blocks" />
      ) : (
        <List.Section title="Blocks" subtitle={`${blocks.length}`}>
          {blocks.map((block, index) => (
            <BlockListItem key={block.id || index} block={block} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function BlockListItem({ block }: { block: Block }) {
  const displayText = block.markdown ? cleanMarkdown(block.markdown) : `[${block.type}]`;
  const truncatedText = displayText.length > 80 ? displayText.substring(0, 80) + "..." : displayText;

  const accessories: List.Item.Accessory[] = [{ tag: { value: block.type, color: getTypeColor(block.type) } }];

  if (block.listStyle && block.listStyle !== "none") {
    accessories.unshift({ icon: getListStyleIcon(block.listStyle) });
  }

  return (
    <List.Item
      icon={getBlockIcon(block)}
      title={truncatedText || "Empty block"}
      subtitle={block.textStyle}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action.Push title="View Details" icon={Icon.Eye} target={<BlockDetailView block={block} />} />
          <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${block.id}`} />
          {block.markdown && <Action.CopyToClipboard title="Copy Content" content={block.markdown} />}
          <Action.CopyToClipboard
            title="Copy Block ID"
            content={block.id}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

function BlockDetailView({ block }: { block: Block }) {
  let markdown = `# ${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block\n\n`;

  if (block.markdown) {
    markdown += "## Content\n\n" + block.markdown + "\n\n";
  }

  if (block.content && block.content.length > 0) {
    markdown += "## Nested Blocks\n\n";
    for (const child of block.content) {
      markdown += `- ${child.markdown || `[${child.type}]`}\n`;
    }
  }

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Block ID" text={block.id} />
          <Detail.Metadata.Label title="Type" text={block.type} />
          {block.textStyle && <Detail.Metadata.Label title="Style" text={block.textStyle} />}
          {block.listStyle && block.listStyle !== "none" && (
            <Detail.Metadata.Label title="List Style" text={block.listStyle} />
          )}
          {block.indentationLevel !== undefined && (
            <Detail.Metadata.Label title="Indentation" text={String(block.indentationLevel)} />
          )}
          {block.metadata?.createdAt && (
            <Detail.Metadata.Label title="Created" text={new Date(block.metadata.createdAt).toLocaleString()} />
          )}
          {block.metadata?.lastModifiedAt && (
            <Detail.Metadata.Label title="Modified" text={new Date(block.metadata.lastModifiedAt).toLocaleString()} />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open in Craft" url={`craftdocs://open?blockId=${block.id}`} />
          {block.markdown && <Action.CopyToClipboard title="Copy Content" content={block.markdown} />}
          <Action.CopyToClipboard title="Copy Block ID" content={block.id} />
        </ActionPanel>
      }
    />
  );
}

function getBlockIcon(block: Block): Icon {
  switch (block.type) {
    case "page":
      return Icon.Document;
    case "image":
      return Icon.Image;
    case "video":
      return Icon.Video;
    case "file":
      return Icon.Paperclip;
    case "code":
      return Icon.Code;
    case "table":
      return Icon.AppWindowGrid3x3;
    case "drawing":
      return Icon.Pencil;
    default:
      return Icon.TextDocument;
  }
}

function getTypeColor(type: Block["type"]): Color {
  switch (type) {
    case "page":
      return Color.Blue;
    case "image":
      return Color.Green;
    case "code":
      return Color.Purple;
    case "table":
      return Color.Orange;
    default:
      return Color.SecondaryText;
  }
}

function getListStyleIcon(listStyle: Block["listStyle"]): Icon {
  switch (listStyle) {
    case "bullet":
      return Icon.Dot;
    case "numbered":
      return Icon.List;
    case "toggle":
      return Icon.ChevronRight;
    case "task":
      return Icon.CheckCircle;
    default:
      return Icon.Minus;
  }
}

function cleanMarkdown(markdown: string): string {
  return markdown.replace(/\*\*/g, "").replace(/<[^>]+>/g, "").trim();
}
