import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
// @ts-expect-error no type definitions published
import markdownItSub from "markdown-it-sub";
// @ts-expect-error no type definitions published
import markdownItSup from "markdown-it-sup";

/**
 * Inline HTML exceptions. Raw HTML passthrough is official markdown, and files
 * authored for GitHub use these tags routinely (GFM has no sub/sup syntax at all).
 * We parse ONLY tags that map onto vocabulary marks — they render properly and
 * serialize back as native markdown. Everything else (<details>, <span>, …) stays
 * visible literal text, honest about what a save will keep. `html: false` below
 * remains the general rule; this inline rule runs before markdown-it's text
 * handling and never fires inside code spans/fences (those tokenize earlier).
 */
const ALLOWED_TAG_RE = /^<(\/?)(sub|sup|b|strong|i|em|s|del|code|br)\s*\/?>/i;

function allowedInlineHtml(md: any): void {
  md.inline.ruler.before("html_inline", "allowed_html", (state: any, silent: boolean) => {
    if (state.src.charCodeAt(state.pos) !== 0x3c /* < */) return false;
    const m = ALLOWED_TAG_RE.exec(state.src.slice(state.pos));
    if (!m) return false;
    if (!silent) {
      const closing = m[1] === "/";
      const tag = m[2].toLowerCase();
      if (tag === "br") {
        state.push("hardbreak", "br", 0);
      } else {
        // TipTap's extensions parse the alias tags directly (<b>, <i>, <del>, …),
        // so the token just re-emits the tag for the HTML the editor ingests.
        const token = state.push(closing ? "allowed_html_close" : "allowed_html_open", tag, closing ? -1 : 1);
        token.markup = m[0];
      }
    }
    state.pos += m[0].length;
    return true;
  });
  md.renderer.rules.allowed_html_open = (tokens: any[], i: number) => `<${tokens[i].tag}>`;
  md.renderer.rules.allowed_html_close = (tokens: any[], i: number) => `</${tokens[i].tag}>`;
}

/**
 * tiptap-markdown knows nothing about sub/superscript: markdown-it has no ~x~ / ^x^
 * syntax built in, and the marks had no serializer rule — so `H~2~O` in a file
 * arrived as literal text. Each mark declares its markdown spec here: a markdown-it
 * plugin for parsing, and open/close tokens for serializing. The allowedInlineHtml
 * rule is registered here too (setup hooks only exist on extensions with a
 * markdown spec, and this one always loads).
 */
/**
 * Table serializer with column alignment. markdown-it parses the delimiter row
 * (`:---`, `:---:`, `---:`) into an `align` attr on each cell, and the editor
 * renders it — but tiptap-markdown's stock serializer hard-codes `---`, stripping
 * alignment on every save. Same row/cell walk as upstream, plus the delimiter row
 * derived from the header cells' align attrs.
 *
 * Upstream also falls back to an HTML placeholder for tables it deems
 * non-serializable (merged cells, multi-block cells) — with html:false that
 * writes a literal `[table]`, destroying the table. Merged cells cannot occur
 * here (markdown can't express them; the UI has no merge), and for the one
 * reachable case — a second paragraph typed into a cell — serializing the first
 * paragraph beats destroying the table, so the fallback is dropped.
 */
const DELIMITER: Record<string, string> = {
  left: ":---",
  center: ":---:",
  right: "---:",
};

const MarkdownTable = Table.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.inTable = true;
          node.forEach((row: any, _p: number, i: number) => {
            state.write("| ");
            row.forEach((col: any, _p2: number, j: number) => {
              if (j) state.write(" | ");
              const cellContent = col.firstChild;
              if (cellContent.textContent.trim()) {
                state.renderInline(cellContent);
              }
            });
            state.write(" |");
            state.ensureNewLine();
            if (!i) {
              const delimiterRow: string[] = [];
              row.forEach((col: any) => {
                delimiterRow.push(DELIMITER[col.attrs.align] ?? "---");
              });
              state.write(`| ${delimiterRow.join(" | ")} |`);
              state.ensureNewLine();
            }
          });
          state.closeBlock(node);
          state.inTable = false;
        },
        parse: {}, // handled by markdown-it
      },
    };
  },
});

const MarkdownSubscript = Subscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: "~", close: "~", mixable: true, expelEnclosingWhitespace: true },
        parse: {
          setup: (markdownit: any) => {
            markdownit.use(markdownItSub);
            markdownit.use(allowedInlineHtml);
          },
        },
      },
    };
  },
});

const MarkdownSuperscript = Superscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: "^", close: "^", mixable: true, expelEnclosingWhitespace: true },
        parse: { setup: (markdownit: any) => markdownit.use(markdownItSup) },
      },
    };
  },
});

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
      // Images are inline content in markdown; as a block node (the default) an
      // image split its paragraph on load and merged adjacent text on save.
      // allowBase64: the default (false) silently DELETES data: images on load,
      // so a subsequent save destroys them.
      Image.configure({ inline: true, allowBase64: true }),
      MarkdownSubscript,
      MarkdownSuperscript,
      MarkdownTable.configure({ resizable: false }),
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
