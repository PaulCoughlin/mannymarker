# MannyMarker — Tauri editor

The active application. See the [root README](../README.md) for the project
overview, the WPF→Tauri pivot rationale, and the supported markdown vocabulary.

## Prerequisites

- **Rust** toolchain (`rustup`) — required to build the Tauri shell.
- **Node.js** — required for the Vite/TypeScript frontend.
- **Edge WebView2** runtime — standard on Windows 11; the WebView the app runs in.

## Develop

```bash
npm install
npm run tauri dev
```

Vite serves the frontend at `http://localhost:1420`; Tauri loads it in a native
window with hot reload.

## Test

```bash
npm test
```

Round-trip fidelity tests (Vitest + jsdom): each markdown construct is loaded
into a real TipTap editor, serialized back, and compared with **exact** string
matching. These are the gate on the `tiptap-markdown` layer preserving our
vocabulary.

## Build a release binary

```bash
npm run tauri build      # outputs src-tauri/target/release/MannyMarker.exe
```

Or use the helper, which closes any running instance first and offers to launch:

```powershell
./compile.ps1
```

## Layout

```
src/              frontend TS (editor, commands, state, context menu, preferences)
src-tauri/        Rust shell (lib.rs: window, menu, file I/O commands)
tests/            Vitest round-trip tests
index.html        editor shell + toolbar + status bar markup
styles.css        editor + page chrome
```

## Editable compiled defaults

Runtime preferences (font, size, page width, spellcheck) need no recompile. To
change compiled-in defaults instead, edit:

- `src-tauri/tauri.conf.json` — window default width/height/title
- `src/styles.css` — colours, toolbar look

(Noted in `compile.ps1`.)
