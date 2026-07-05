# Native Markdown Editor — Spec & Architecture

> **⚠ SUPERSEDED (2026-07-03).** This spec describes the original **WPF + C#**
> editor, which shipped but was retired in favour of the **Tauri + TipTap** app
> in `tauri-editor/` (now named **Manny Marker**). The WPF build was too heavy
> (~150 MB exe, ~1.5 s warm launch, jerky window movement); the Tauri rewrite
> delivers the same feature set in ~8.6 MB with ~0.55 s warm launch. See
> [`README.md`](README.md) for the current app and
> [`docs/superpowers/specs/2026-07-03-tauri-tiptap-editor-design.md`](docs/superpowers/specs/2026-07-03-tauri-tiptap-editor-design.md)
> for the Tauri design. The WPF code is preserved at the `wpf-legacy` git tag.
>
> This document is kept as historical context — the design thinking that led to
> the product, even though the implementation changed underneath.

---

A simple, native Windows markdown editor. You edit a **rendered** view (headings
look like headings, bold looks bold), but the file on disk is always plain
`.md`. No server, no browser, no terminal. Double-click a `.exe`, edit, save.

Reference product: **Typora**. This is that category of app, deliberately kept
minimal.

---

## Goals

- **Native Windows program.** A single `.exe`. No Python, no Flask, no localhost,
  no batch files.
- **Edit rendered, store markdown.** The editing surface shows formatting
  (headings, bold, italic, lists…). The file underneath is always plain
  markdown. Save writes native `.md`.
- **Small, fixed vocabulary.** Only what markdown can express — nothing more.
  This constraint is what keeps the app simple.
- **Open / edit / save.** That's the whole app.

## Non-goals (explicitly out — keep it simple)

- No cross-platform. Windows-only. (The existing Flask app already covers
  cross-platform if ever needed.)
- No web view, no HTML preview pane, no server of any kind.
- No arbitrary rich text (colours, fonts, tables of contents, etc.) — only
  markdown-expressible formatting.
- No plugins, no cloud, no collaboration, no extensions.

---

## Stack

- **C# + WPF** on **.NET 8**. WPF is the native Windows desktop UI framework and
  is Windows-only by design — a perfect fit.
- **Editing surface:** WPF `RichTextBox`, backed by a native `FlowDocument`
  (WPF's built-in rich-text document model). No HTML, no web engine involved.
- **One dependency:** [Markdig](https://github.com/xoofx/markdig) — the standard,
  mature C# markdown parser. Used on the *open* path only.

That's the entire dependency list. Deliberately tiny.

---

## The core idea: two-way translation

The whole app is a text file wearing a rich-text costume. Two translations do
all the real work:

**1. Open — Markdown → rendered view**
```
read .md file  →  Markdig parses to an AST  →  map AST nodes to FlowDocument
elements (Paragraph, bold/italic Run, List, code block…)  →  show in RichTextBox
```

**2. Save — rendered view → Markdown**
```
walk the FlowDocument's block/inline tree  →  emit markdown text  →  write .md file
```

The `FlowDocument → markdown` serializer is **custom code and is the real
substance of the project.** It's bounded — because only a small vocabulary is
allowed — but it's where the effort lives. Everything else is plumbing.

### Supported markdown vocabulary (the fixed set)

- Headings H1–H6
- **Bold**, *italic*, ***bold italic***, subscript and superscript
- Unordered and ordered lists (with nesting)
- `inline code` and fenced ``` code blocks ```
- Links
- Blockquotes
- Horizontal rules
- Paragraphs
- inline images
- tables



---

## Editing model — an honest choice

There are two grades of "edit a rendered view," and they differ a lot in build
effort:

| Grade | What it feels like | Build cost |
|---|---|---|
| **A — Constrained rich-text** | A tiny word processor: toolbar + shortcuts (Ctrl+B, Ctrl+1 for H1) apply formatting; syntax chars never shown; save writes markdown. | Moderate |
| **B — True inline WYSIWYG (Typora-grade)** | Typing `# ` or `**x**` transforms live as you type; caret/selection behave exactly like Typora. | Higher — caret handling and live syntax recognition are fiddly |

**Recommendation:** ship **A** as the MVP (it already delivers "edit rendered,
save markdown"), then layer **B**'s live-typing shortcuts on top as polish. This
keeps the first working version small and reachable.

---

## Build order

1. **WPF shell** — window, menu (New / Open / Save / Save As), a `RichTextBox`.
2. **File I/O** — open and save plain text; wire up dirty-state and "save before
   close" prompt.
3. **Open path** — Markdown → FlowDocument via Markdig (rendered view on load).
4. **Save path** — FlowDocument → Markdown serializer (the core work).
5. **Formatting commands** — toolbar + keyboard shortcuts for the vocabulary.
6. **Live typing shortcuts** — `# ` → heading, `**x**` → bold, etc. (grade B).
7. **Polish** — the rendered view's styling/theme, find & replace, recent files.
8. **Package** — build the single `.exe`.

Steps 1–5 are a usable editor. 6–8 are refinement.

---

## Packaging

Ship as a self-contained single-file executable so the user needs nothing
pre-installed:

```
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

- Produces one `.exe` that bundles the .NET runtime — double-click and it runs on
  any Windows 11 machine with nothing else installed.
- Trade-off: file size is larger (~150 MB) because the runtime is embedded. A
  framework-dependent build is tiny but requires .NET installed on the machine.
  For a personal tool, self-contained single-file is the right call.
- Optional later: an installer (Inno Setup) for a Start-menu entry and file
  associations, so double-clicking a `.md` opens it in this editor.

---

## Honest risks

- **The save-path serializer is the project.** FlowDocument → markdown has edge
  cases (nested lists, mixed inline formatting, whitespace fidelity). Budget the
  real time here, not on the UI.
- **Full Typora-grade inline editing (grade B) is polish, not MVP.** Don't let it
  block a working grade-A editor.
- **Tables and nested/mixed lists** are the fiddliest bits of the vocabulary —
  deferred on purpose.

---

## Summary

A single-window WPF app: a `RichTextBox` over a `FlowDocument`, Markdig on open,
a custom markdown serializer on save, packaged as one self-contained `.exe`.
Native, no server, no browser, deliberately small. Open, edit, save — markdown
underneath the whole time.
