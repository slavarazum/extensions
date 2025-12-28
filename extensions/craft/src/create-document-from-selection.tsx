import { getSelectedText, showToast, Toast, open } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { createDocument, insertBlocks, openLink } from "./api";

export default async function Command() {
  let text: string | undefined;

  try {
    text = await getSelectedText();
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "No text selected",
      message: "Please select some text first",
    });
    return;
  }

  if (!text?.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No text selected",
      message: "Please select some text first",
    });
    return;
  }

  const content = text.trim();

  // Extract first line as title (up to 100 chars)
  const lines = content.split("\n");
  const firstLine = lines[0].trim();
  const title = firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;

  // Use remaining content as body, or full content if it's a single line
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";

  try {
    // Create the document
    const document = await createDocument({
      title,
      destination: { destination: "unsorted" },
    });

    // If there's body content, insert it into the document
    if (body) {
      await insertBlocks([{ type: "text", markdown: body }], { position: "end", pageId: document.id });
    }

    // Get the open link and open the document in Craft
    const link = await openLink({ documentId: document.id });
    await open(link);

    await showToast({
      style: Toast.Style.Success,
      title: "Document created",
      message: title,
    });
  } catch (error) {
    showFailureToast(error, { title: "Failed to create document" });
  }
}
