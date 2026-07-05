# MannyMarker — User Guide

MannyMarker is a small, fast, native Windows markdown editor. You edit a
**rendered** view — headings look like headings, bold looks bold — but the file
on disk is always plain `.md`. Open, edit, save. That's the whole app.

## Opening and saving files

- **Double-click any `.md` file** (or right-click → Open with → MannyMarker)
  and it opens directly in the editor.
- **File → Open…** (`Ctrl+O`) and **File → Save** (`Ctrl+S`) do what they say.
  **Save As…** is `Ctrl+Shift+S`, **New** is `Ctrl+N`, **Print** is `Ctrl+P`.
- The title bar shows the file name, with a `*` when there are unsaved changes.
  Closing with unsaved changes asks first.
- The status bar shows the full file path, the last-saved time, and a live
  word count.

## Formatting

Everything on the toolbar, with common keyboard shortcuts:

| Action | Toolbar | Shortcut |
| --- | --- | --- |
| Headings 1–3 / body text | H1 H2 H3 P | `Ctrl+Alt+1…3` / `Ctrl+Alt+0` |
| Bold / italic | **B** / *I* | `Ctrl+B` / `Ctrl+I` |
| Strikethrough | ~~S~~ | `Ctrl+Shift+S`* |
| Subscript / superscript | x₂ / x² | `Ctrl+,` / `Ctrl+.` |
| Inline code / code block | `</>` / `{ }` | `Ctrl+E` / `Ctrl+Alt+C` |
| Bulleted / numbered list | • List / 1. List | `Ctrl+Shift+8` / `Ctrl+Shift+7` |
| Blockquote | " Quote | `Ctrl+Shift+B` |
| Horizontal rule | ― Rule | — |
| Link / image | Link / Image | — |
| Table | Table | — |

\* When Save As is remapped; otherwise use the toolbar button.

Markdown shortcuts also work as you type: `# ` for a heading, `- ` for a list,
`> ` for a quote, `**bold**`, backticks for code, and so on.

## Tables

Insert a table from the toolbar (choose rows and columns). **Right-click inside
a table** for structural edits: add/delete rows and columns, toggle the header
row. Column alignment written in the file (`:---`, `:---:`, `---:`) renders
and is preserved when you save.

## Supported markdown

Headings H1–H6, bold / italic / bold-italic, strikethrough, subscript (`~x~`),
superscript (`^x^`), nested ordered & unordered lists, inline code, fenced code
blocks, links, images (remote URLs and embedded base64 `data:` URIs),
blockquotes (nested), horizontal rules, tables with column alignment.

**Inline HTML.** Files written for GitHub often use raw HTML tags. Tags that
map onto the editor's vocabulary are rendered and saved back as native
markdown: `<sub>`, `<sup>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<s>`, `<del>`,
`<code>`, `<br>`. Any other HTML stays visible as literal text — nothing is
silently dropped on save.

## Preferences

**File → Preferences…** — font, text size, spellcheck language (UK/US/off),
page width, and page margin. These are display preferences: they change how
the document looks on screen, never what is written to the `.md` file.
Settings persist in `%APPDATA%` per user.

Spellcheck uses Windows' native spellchecker. Right-click a squiggled word for
suggestions; the 📖 Dictionary toolbar button opens your personal custom
dictionary for editing.

## Window

The window remembers its size and position between launches. On first run (or
if the remembered position is off-screen) it opens centered on the monitor
where your mouse cursor is.

## About

**Help → About MannyMarker** shows the version you're running. The app is a
single portable exe (Tauri 2 + TipTap); source, issues, and releases live at
<https://github.com/PaulCoughlin/mannymarker>.
