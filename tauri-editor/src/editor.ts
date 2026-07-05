import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";

/**
 * Builds the TipTap editor — the rendered-document surface. The enabled extensions
 * ARE the fixed markdown vocabulary (headings, bold/italic, lists, code, links,
 * images, blockquote, rule, sub/sup, tables). The Markdown extension provides the
 * markdown ⇄ document translation on load and save.
 */
export function createEditor(element: HTMLElement, onUpdate: () => void): Editor {
  return new Editor({
    element,
    extensions: [
      // StarterKit (v3) bundles headings, bold, italic, lists, code, blockquote, hr,
      // paragraph, AND link — so link is configured here rather than added separately.
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Subscript,
      Superscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: false, // stay within the markdown vocabulary; no raw HTML
        tightLists: true,
        bulletListMarker: "-",
        linkify: false,
        breaks: false,
      }),
    ],
    content: "",
    autofocus: true,
    onUpdate,
  });
}

/** Serializes the current document to markdown. */
export function toMarkdown(editor: Editor): string {
  return (editor.storage as any).markdown.getMarkdown();
}

/** Replaces the document with the parsed markdown (used on open / new). */
export function setMarkdown(editor: Editor, markdown: string): void {
  editor.commands.setContent(markdown);
}
