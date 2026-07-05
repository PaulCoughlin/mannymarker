# Fast native markdown editor (Tauri + TipTap) — design

A second markdown editor with the **same functionality as the WPF app** — live
WYSIWYG editing of a *rendered* markdown document, saved as native `.md`, no preview
pane — but **faster and smoother**. This fills a gap the user's other tools don't:
EditPlus edits raw markdown, the Python app covers cross-platform, the WPF app is the
current native rendered editor but feels sluggish (jerky window move, not-instant
launch). This targets the smooth/fast native niche.

## Goals

- Feature parity with the WPF app: headings H1–H6, bold/italic/bold-italic,
  subscript/superscript, ordered & unordered lists, inline & fenced code, links,
  inline images, blockquotes, horizontal rules, paragraphs, tables + table editing.
- Live WYSIWYG rendered document (a table is a real grid, bold *is* bold, no `**`
  ever shown). No source/preview pane.
- Native `.md` on disk. Font is a display preference only, never written to the file.
- Preferences (font family, size, spellcheck language), window bounds, print.
- **Smooth and fast** — this is the acceptance criterion, judged against the WPF app
  and eyeballed against EditPlus. **All goals are UI/UX; functionality is already
  solved by the WPF app.** The three concrete criteria are:
  1. **Fast load** — cold-start to editable window (high confidence of beating WPF).
  2. **Responsiveness** — no typing/scroll lag, especially on large docs (high conf.).
  3. **Smooth window drag/move/resize** — the specific thing that feels bad in WPF
     (medium confidence: window frame is OS/WebView-drawn, generally smoother than
     WPF but not guaranteed to match a hand-tuned Win32 app like EditPlus).

## Build sequencing — de-risk the window feel first

Criterion 3 (smooth drag/resize) is the make-or-break and the least certain, and it
depends on the *window frame* (OS + WebView2), not the editor inside. So **phase 0 is
a minimal empty Tauri window** the user physically drags/moves/resizes against WPF and
EditPlus to judge the feel BEFORE investing in the full editor. If the shell feel
isn't there, we learn it in an hour; if it is, the editor is built on a validated
foundation.

**Phase 0 result (2026-07-03): PASSED.** Empty Tauri shell built (8.6 MB binary).
Measured: cold launch ~2.0s (one-time WebView2 init), warm launch ~0.55s (~3× faster
than WPF's ~1.5s). User tested drag/move/resize physically vs WPF + EditPlus: "much
more responsive — like I'd expect. good enough for sure." Sub-second warm launch
confirmed. Proceeding to build the full editor on this shell. (Note: the earlier
"cold load beats WPF" prediction was wrong — corrected by measurement; the practical
win is the warm-launch path, which the user will almost always hit.)

## Non-goals (first version)

- Multiple documents / tabs — single document, matching WPF. (Noted as a likely
  follow-up given the user's interest in EditPlus's multi-doc feel.)
- Cross-platform packaging — Windows-first (Tauri is cross-platform, but not a goal).
- Plugins, cloud, collaboration.

## Stack

- **Shell:** Tauri (Rust backend + WebView2 frontend). Small binary, fast cold-start,
  native window/menu/dialogs, uses the already-installed Edge WebView2.
- **Editor:** TipTap (on ProseMirror) — a true rendered-document WYSIWYG editor, the
  closest analogue to WPF's FlowDocument/RichTextBox. Markdown mode + table extension.
- **Frontend build:** Vite + vanilla TypeScript (no UI framework — leanest for a
  single-window editor).
- Requires installing the Rust toolchain (not currently present).

## Architecture

```
Tauri shell (Rust): window, native menu, file dialogs,
  read_file / write_file / set_title commands, window-bounds persistence
  └─ WebView2: Vite + TypeScript
       TipTap editor (rendered document) + markdown ⇄ doc + toolbar +
       context menu + dialogs + preferences
```

Rust owns OS concerns (the role WPF's code-behind played for window/disk/menu);
TipTap owns the rendered document (the role of RichTextBox/FlowDocument). The
markdown⇄document translation — the heart of the WPF app — is mostly provided by
TipTap's markdown support, so far less serializer code is hand-written.

## Components

| Unit | Responsibility | WPF analogue |
|---|---|---|
| `src-tauri/main.rs` + commands | Window, menu, file open/save dialogs, read/write/title, bounds | `MainWindow` OS parts |
| Rust menu + accelerators | File menu (New/Open/Save/Save As/Print) + Ctrl shortcuts → events | `Menu` + `CommandBindings` |
| `editor.ts` | TipTap instance: which extensions (nodes/marks) = the fixed vocabulary | `RichTextBox` config |
| `markdown.ts` | Document ⇄ markdown; config for sub/sup and images where needed | `MarkdownToFlowDocument` + `FlowDocumentToMarkdown` |
| `commands.ts` | Toolbar + shortcut actions (bold, H1–H6, lists, quote, rule, link, table) | formatting handlers |
| `contextmenu.ts` | Right-click: native spelling, clipboard, table ops in a table | `Editor_ContextMenuOpening` |
| `state.ts` | Dirty tracking, current-path, save-before-discard, title | dirty-state logic |
| `preferences.ts` | Font/size/spellcheck + window bounds, persisted to app-config JSON | `Settings`/`SettingsStore`/`PreferencesWindow` |

Boundaries match the WPF app: OS in Rust, document in TS, translation isolated.

## Feature mapping

- Headings, bold, italic, lists, code, links, images, blockquotes, rules → built-in
  TipTap nodes/marks.
- Subscript/superscript → TipTap `Subscript`/`Superscript` marks.
- Tables + row/column/header editing → TipTap `Table` extension (insert/delete row &
  column, toggle header) — upstream equivalent of our `TableOperations`.
- Spellcheck (en-GB) → WebView native: `spellcheck="true"` + `lang="en-GB"`;
  right-click spelling suggestions come from the OS/WebView for free. **Custom words:
  Windows keeps a per-user custom dictionary that WebView2 reads automatically — it is
  external, hand-editable, and shared across all Windows apps.** The user's existing
  additions live in the language-neutral file
  `%APPDATA%\Microsoft\Spelling\neutral\default.dic` (words here are accepted in every
  language). Format is UTF-16LE, one word per line. The app adds a right-click
  **"Add to Dictionary"** that appends the word to that neutral file via a Rust command
  (the WebView sandbox cannot write it directly), so new additions sit alongside the
  user's existing ones. Effect: the word is un-flagged in this app and every other
  Windows app, permanently — solving the "every file picks up the same errors" pain.
  The native menu's own suggestions + session "Ignore" remain available; we add the
  persistent "Add to Dictionary" on top.

  **Revised after testing (2026-07-03):** the native and custom menus cannot be
  merged — the browser sandbox will not expose the OS suggestion list to JS, so a
  custom menu can offer "Add to Dictionary" but no suggestions/Ignore. Suggestions are
  the more valuable feature, so the app now shows the **native** spelling menu
  everywhere (real suggestions + Ignore + the OS's own Add-to-dictionary, all free) and
  only shows a custom menu **inside a table** (row/column/header ops). The custom
  "Add to Dictionary" command and its Rust helper were removed as redundant — the
  native menu already writes to the same OS dictionary.

  **Corrected finding (2026-07-03, after user testing):** the assumption that the
  native menu offers "Add to dictionary" was WRONG. WebView2 uses Chromium's
  spellchecker, whose embedded context menu shows **suggestions + Ignore only — no
  "Add to dictionary."** And wry (Tauri's webview layer) exposes only an all-or-nothing
  `with_default_context_menus` toggle — it does NOT surface WebView2's
  `ContextMenuRequested` event, so we cannot inject items into the native menu. Net:
  you can have native *suggestions* OR a custom *Add to Dictionary*, but not both in
  one right-click menu (the sandbox also hides the native suggestion list from JS).
  **Decision: keep native suggestions** (the more valuable feature); permanent custom
  words are added by hand-editing `%APPDATA%\Microsoft\Spelling\neutral\default.dic`.
  A toolbar "add current word" button remains a possible future addition if wanted.
- Print → `window.print()` → native print dialog renders the document.
- Preferences → persisted JSON in the Tauri app-config dir (same idea as
  `%APPDATA%\MdEditor\settings.json`). Font/size applied to the editor surface only.

Wins over WPF: spelling suggestions, print, and most of the serializer come from the
platform. Risk: TipTap's emitted markdown must match our vocabulary/round-trip —
locked by ported tests.

## Data flow

- **Open:** menu/Ctrl+O → Rust file dialog → `read_file` → TS parses markdown → TipTap
  document. Set current path, mark clean, update title.
- **Save:** Ctrl+S → TS serializes TipTap doc → markdown → Rust `write_file`. Save As
  prompts for a path. Mark clean.
- **Dirty/close:** edits set dirty (title `*`); New/Open/close prompt to save when
  dirty. Fresh document is clean (the bug we fixed in WPF — designed in from the start).

## Testing & verification

- Round-trip tests (Vitest): markdown → TipTap doc → markdown, porting the 12 WPF
  cases (headings, bold/italic, inline code, lists, blockquote, rule, link, code
  block, table, empty doc). Locks fidelity.
- Table-ops tests: build → edit → serialize → assert.
- Runtime verification: launch the real app; measure launch time and typing/scroll
  smoothness against the WPF app and eyeball vs EditPlus (smooth is the whole point);
  insert/edit a table; save and reopen a file for round-trip fidelity.

## Honest risks

1. Rust first-compile is slow (minutes); incremental fine after.
2. "Smooth" is the acceptance criterion, not a feature — measured against WPF/EditPlus.
   If it doesn't clearly beat WPF, that is a finding to surface, not hide.
3. TipTap's default markdown may differ from our exact output (`*` vs `_`, list
   markers); tests pin it, may need small serializer tweaks.
4. Full parity is a larger first build than the WPF MVP — a fresh app, not an edit.

## Layout

```
tauri-editor/            (new subfolder in the repo)
  src/                   frontend TS (editor.ts, markdown.ts, commands.ts, …)
  src-tauri/             Rust shell (main.rs, commands, menu)
  tests/                 Vitest round-trip + table tests
  index.html, package.json, vite.config.ts
```

Kept in a separate top-level subfolder so it stands alongside the WPF app (`src/`,
`tests/`) without entangling the two builds.
