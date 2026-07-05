import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { createEditor } from "./editor";
import { DocumentState } from "./state";
import { commands } from "./commands";
import { installContextMenu } from "./contextmenu";
import {
  loadSettings,
  saveSettings,
  applySettings,
  Settings,
} from "./preferences";

async function bootstrap() {
  const root = document.getElementById("editor")!;
  const doc = new DocumentStateHolder();

  const editor = createEditor(root, () => {
    doc.state?.markDirtyFromEdit();
    updateWordCount();
  });
  const state = new DocumentState(editor);
  doc.state = state;
  state.init();

  // A file passed on the command line ("Open with" / file association) loads at start.
  const startupFile = await invoke<string | null>("startup_file");
  if (startupFile) await state.openPath(startupFile);
  updateWordCount();

  function updateWordCount() {
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/).length : 0;
    const el = document.getElementById("status-count");
    if (el) el.textContent = `${words} word${words === 1 ? "" : "s"}`;
  }

  // Settings: load, apply, wire the preferences dialog.
  let settings = await loadSettings();
  applySettings(root, settings);
  installContextMenu(editor, root, document.getElementById("ctxmenu")!);
  setupToolbar(editor, state);
  setupPreferences(root, () => settings, (s) => (settings = s));


  // Native menu events from Rust.
  await listen<string>("menu", async (e) => {
    switch (e.payload) {
      case "new": await state.newDocument(); break;
      case "open": await state.open(); break;
      case "save": await state.save(); break;
      case "save_as": await state.saveAs(); break;
      case "print": window.print(); break;
      case "preferences": (document.getElementById("prefs") as HTMLDialogElement).showModal(); break;
    }
  });

  // Save-before-close. The close-requested handler must decide synchronously, so we
  // always prevent the default close, run the (async) discard check, then destroy the
  // window ourselves if it is safe. A plain `async` handler that awaits before calling
  // preventDefault() races the event and can leave the window unable to close.
  const win = getCurrentWindow();

  // Remember window geometry: saved (debounced) into settings.json on every
  // resize/move; the Rust shell reads it at startup and restores before show.
  let geomTimer: number | undefined;
  const persistWindowState = () => {
    clearTimeout(geomTimer);
    geomTimer = window.setTimeout(async () => {
      try {
        // Physical units throughout — scaleFactor() reads stale after a
        // cross-DPI move, and restoring to the same monitor position makes
        // logical conversion unnecessary anyway.
        const size = await win.innerSize();
        const pos = await win.outerPosition();
        settings = {
          ...settings,
          window: { width: size.width, height: size.height, x: pos.x, y: pos.y },
        };
        await saveSettings(settings);
      } catch {
        // best-effort; never disturb editing
      }
    }, 500);
  };
  await win.onResized(persistWindowState);
  await win.onMoved(persistWindowState);

  let closing = false;
  await win.onCloseRequested(async (event) => {
    if (closing) return; // our own destroy() re-fires this; let it through
    event.preventDefault();
    if (await state.canClose()) {
      closing = true;
      await win.destroy();
    }
  });
}

/** Small holder so the editor's onUpdate can reach state created just after it. */
class DocumentStateHolder {
  state: DocumentState | null = null;
}

function setupToolbar(editor: ReturnType<typeof createEditor>, _state: DocumentState) {
  document.getElementById("toolbar")!.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    const cmd = btn.dataset.cmd!;
    switch (cmd) {
      case "h1": commands.heading(editor, 1); break;
      case "h2": commands.heading(editor, 2); break;
      case "h3": commands.heading(editor, 3); break;
      case "p": commands.paragraph(editor); break;
      case "bold": commands.bold(editor); break;
      case "italic": commands.italic(editor); break;
      case "code": commands.code(editor); break;
      case "strike": commands.strike(editor); break;
      case "subscript": commands.subscript(editor); break;
      case "superscript": commands.superscript(editor); break;
      case "codeBlock": commands.codeBlock(editor); break;
      case "image": commands.image(editor); break;
      case "bulletList": commands.bulletList(editor); break;
      case "orderedList": commands.orderedList(editor); break;
      case "blockquote": commands.blockquote(editor); break;
      case "rule": commands.rule(editor); break;
      case "link": commands.link(editor); break;
      case "table": insertTablePrompt(editor); break;
      case "dictionary": invoke("open_dictionary").catch(() => {}); break;
    }
  });
}

function insertTablePrompt(editor: ReturnType<typeof createEditor>) {
  const rows = parseInt(window.prompt("Rows", "2") ?? "", 10);
  const cols = parseInt(window.prompt("Columns", "2") ?? "", 10);
  if (rows >= 1 && rows <= 20 && cols >= 1 && cols <= 20) {
    commands.insertTable(editor, rows, cols);
  }
}

function setupPreferences(
  root: HTMLElement,
  get: () => Settings,
  set: (s: Settings) => void
) {
  const dialog = document.getElementById("prefs") as HTMLDialogElement;
  const fontSel = document.getElementById("pref-font") as HTMLSelectElement;
  const sizeInput = document.getElementById("pref-size") as HTMLInputElement;
  const spellSel = document.getElementById("pref-spell") as HTMLSelectElement;
  const widthInput = document.getElementById("pref-width") as HTMLInputElement;
  const marginInput = document.getElementById("pref-margin") as HTMLInputElement;

  // A small, safe font list (system fonts are not enumerable from the WebView).
  const fonts = ["Segoe UI", "Calibri", "Arial", "Georgia", "Times New Roman", "Consolas", "Verdana"];
  fontSel.innerHTML = fonts.map((f) => `<option>${f}</option>`).join("");

  const s = get();
  fontSel.value = s.fontFamily;
  sizeInput.value = String(s.fontSize);
  spellSel.value = s.spellcheckLanguage;
  widthInput.value = String(s.editorWidth);
  marginInput.value = String(s.editorMargin);

  const apply = () => {
    const next: Settings = {
      ...get(), // preserve fields the dialog doesn't own (window geometry)
      fontFamily: fontSel.value,
      fontSize: Number(sizeInput.value) || 15,
      spellcheckLanguage: spellSel.value,
      editorWidth: Number(widthInput.value) || 820,
      editorMargin: Number(marginInput.value) || 56,
    };
    set(next);
    applySettings(root, next);
    saveSettings(next);
  };

  fontSel.addEventListener("change", apply);
  sizeInput.addEventListener("change", apply);
  spellSel.addEventListener("change", apply);
  widthInput.addEventListener("change", apply);
  marginInput.addEventListener("change", apply);
  dialog.addEventListener("close", apply);
}

bootstrap();
