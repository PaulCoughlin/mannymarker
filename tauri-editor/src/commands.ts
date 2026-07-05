import { Editor } from "@tiptap/core";

/**
 * Formatting actions invoked by the toolbar and keyboard. Thin wrappers over TipTap's
 * chained commands — the editor already ships keyboard shortcuts (Ctrl+B/I, etc.);
 * these back the toolbar buttons and any custom bindings.
 */
export const commands = {
  heading: (e: Editor, level: 1 | 2 | 3 | 4 | 5 | 6) =>
    e.chain().focus().toggleHeading({ level }).run(),
  paragraph: (e: Editor) => e.chain().focus().setParagraph().run(),
  bold: (e: Editor) => e.chain().focus().toggleBold().run(),
  italic: (e: Editor) => e.chain().focus().toggleItalic().run(),
  code: (e: Editor) => e.chain().focus().toggleCode().run(),
  codeBlock: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),
  subscript: (e: Editor) => e.chain().focus().toggleSubscript().run(),
  superscript: (e: Editor) => e.chain().focus().toggleSuperscript().run(),
  bulletList: (e: Editor) => e.chain().focus().toggleBulletList().run(),
  orderedList: (e: Editor) => e.chain().focus().toggleOrderedList().run(),
  blockquote: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
  rule: (e: Editor) => e.chain().focus().setHorizontalRule().run(),

  link: (e: Editor) => {
    const prev = e.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      e.chain().focus().unsetLink().run();
    } else {
      e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  },

  image: (e: Editor) => {
    const url = window.prompt("Image URL", "https://");
    if (url) e.chain().focus().setImage({ src: url }).run();
  },

  // Table insert + structural edits (TipTap's table extension).
  insertTable: (e: Editor, rows: number, cols: number) =>
    e.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(),
  addRowBefore: (e: Editor) => e.chain().focus().addRowBefore().run(),
  addRowAfter: (e: Editor) => e.chain().focus().addRowAfter().run(),
  deleteRow: (e: Editor) => e.chain().focus().deleteRow().run(),
  addColumnBefore: (e: Editor) => e.chain().focus().addColumnBefore().run(),
  addColumnAfter: (e: Editor) => e.chain().focus().addColumnAfter().run(),
  deleteColumn: (e: Editor) => e.chain().focus().deleteColumn().run(),
  toggleHeaderRow: (e: Editor) => e.chain().focus().toggleHeaderRow().run(),

  inTable: (e: Editor) => e.isActive("table"),
};
