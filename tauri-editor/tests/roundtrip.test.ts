import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import { createEditor, toMarkdown, setMarkdown } from "../src/editor";

/**
 * Round-trip fidelity: markdown → TipTap doc → markdown. These are the gate on
 * the markdown layer working (tiptap-markdown storage) and on the output
 * matching our vocabulary.
 *
 * Assertions are exact (toEqual), not toContain — a regression that adds
 * stray whitespace, swaps markers, or drops content must fail loudly. The
 * expected strings were captured from the live editor's actual output.
 */
describe("markdown round-trip", () => {
  let el: HTMLElement;
  let editor: Editor;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
    editor = createEditor(el, () => {});
  });

  afterEach(() => {
    editor.destroy();
    el.remove();
  });

  /** Round-trip a markdown string through the editor and return trimmed output. */
  const rt = (md: string): string => {
    setMarkdown(editor, md);
    return toMarkdown(editor).trim();
  };

  // ---- block structure ----

  it("headings h1, h3, h6", () => {
    expect(rt("# Title")).toBe("# Title");
    expect(rt("### Sub")).toBe("### Sub");
    expect(rt("###### Deepest")).toBe("###### Deepest");
  });

  it("paragraph", () => {
    expect(rt("Just some text.")).toBe("Just some text.");
  });

  it("two paragraphs", () => {
    expect(rt("First para.\n\nSecond para.")).toBe("First para.\n\nSecond para.");
  });

  it("empty document", () => {
    expect(rt("")).toBe("");
  });

  // ---- inline marks ----

  it("bold", () => {
    expect(rt("**bold**")).toBe("**bold**");
  });

  it("italic", () => {
    expect(rt("*italic*")).toBe("*italic*");
  });

  it("bold and italic together", () => {
    expect(rt("***both***")).toBe("***both***");
  });

  it("inline code", () => {
    expect(rt("Use `code` here.")).toBe("Use `code` here.");
  });

  it("mixed marks in one paragraph", () => {
    expect(rt("This has **bold** and *italic* and `code`.")).toBe(
      "This has **bold** and *italic* and `code`."
    );
  });

  // Sub/superscript must produce the actual mark, not just survive as plain text —
  // a `^` that is never parsed round-trips unchanged and gives a false positive.
  it("superscript", () => {
    setMarkdown(editor, "E=mc^2^");
    expect(editor.getHTML()).toContain("<sup>");
    expect(toMarkdown(editor).trim()).toBe("E=mc^2^");
  });

  it("subscript", () => {
    setMarkdown(editor, "H~2~O");
    expect(editor.getHTML()).toContain("<sub>");
    expect(toMarkdown(editor).trim()).toBe("H~2~O");
  });

  // ---- inline HTML exceptions ----
  // Raw HTML passthrough is part of official markdown, and GitHub-flavored files
  // routinely use these tags (GFM has no sub/sup syntax at all). Tags that map onto
  // vocabulary marks are parsed and serialize back as native markdown; anything
  // else stays visible literal text.

  it("html sub/sup tags parse to marks and save as native syntax", () => {
    setMarkdown(editor, "H<sub>2</sub>O and x<sup>2</sup>");
    expect(editor.getHTML()).toContain("<sub>");
    expect(editor.getHTML()).toContain("<sup>");
    expect(toMarkdown(editor).trim()).toBe("H~2~O and x^2^");
  });

  it("html bold/italic tags parse to marks", () => {
    setMarkdown(editor, "<b>bold</b> and <strong>strong</strong> and <i>it</i> and <em>em</em>");
    expect(toMarkdown(editor).trim()).toBe("**bold** and **strong** and *it* and *em*");
  });

  it("html strikethrough tags parse to marks", () => {
    setMarkdown(editor, "<s>gone</s> and <del>removed</del>");
    expect(toMarkdown(editor).trim()).toBe("~~gone~~ and ~~removed~~");
  });

  it("html code tag parses to inline code", () => {
    setMarkdown(editor, "run <code>npm test</code> now");
    expect(toMarkdown(editor).trim()).toBe("run `npm test` now");
  });

  it("html br becomes a hard break", () => {
    setMarkdown(editor, "line one<br>line two");
    expect(editor.getHTML()).toContain("<br");
    expect(toMarkdown(editor).trim()).toBe("line one\\\nline two");
  });

  it("other html tags stay literal text", () => {
    setMarkdown(editor, "<kbd>K</kbd> and <span>plain</span>");
    expect(editor.getText()).toContain("<kbd>K</kbd>");
    expect(editor.getText()).toContain("<span>plain</span>");
  });

  it("allowed tags inside backtick code spans stay literal", () => {
    expect(rt("`a <b> tag`")).toBe("`a <b> tag`");
  });

  // ---- container blocks ----

  it("bullet list", () => {
    expect(rt("- one\n- two")).toBe("- one\n- two");
  });

  it("ordered list", () => {
    expect(rt("1. first\n2. second")).toBe("1. first\n2. second");
  });

  it("nested list", () => {
    expect(rt("- one\n  - nested\n- two")).toBe("- one\n  - nested\n- two");
  });

  it("blockquote", () => {
    expect(rt("> quoted")).toBe("> quoted");
  });

  it("horizontal rule", () => {
    expect(rt("above\n\n---\n\nbelow")).toBe("above\n\n---\n\nbelow");
  });

  // ---- code & data ----

  it("fenced code block", () => {
    expect(rt("```\nline1\nline2\n```")).toBe("```\nline1\nline2\n```");
  });

  it("link", () => {
    expect(rt("[text](https://example.com)")).toBe("[text](https://example.com)");
  });

  it("image", () => {
    expect(rt("![alt](https://example.com/x.png)")).toBe(
      "![alt](https://example.com/x.png)"
    );
  });

  // Images are inline in markdown — an image inside a sentence must stay in its
  // paragraph. As a block node it split the paragraph on load and glued the
  // surrounding text back together (or swallowed a following heading) on save.
  // Image with a data: URI — allowBase64 defaults to false in the Image extension,
  // which silently DELETED such images (parsed to an empty paragraph, so a save
  // destroyed them). Must round-trip byte-identical.
  it("data-uri image survives", () => {
    const md =
      "![red dot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAE0lEQVR42mN44OCABzGMSmOTBgCFE4mBNIKX7AAAAABJRU5ErkJggg==)";
    expect(rt(md)).toBe(md);
  });

  it("image inside a sentence stays inline", () => {
    expect(rt("Before ![alt](https://example.com/x.png) after.")).toBe(
      "Before ![alt](https://example.com/x.png) after."
    );
  });

  it("image paragraph followed by a heading keeps them separate", () => {
    expect(rt("Look: ![alt](https://example.com/x.png)\n\n## Next section")).toBe(
      "Look: ![alt](https://example.com/x.png)\n\n## Next section"
    );
  });

  it("table", () => {
    expect(rt("| A | B |\n| --- | --- |\n| 1 | 2 |")).toBe(
      "| A | B |\n| --- | --- |\n| 1 | 2 |"
    );
  });
});
