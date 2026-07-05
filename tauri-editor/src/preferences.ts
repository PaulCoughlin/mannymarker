import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";

export interface Settings {
  fontFamily: string;
  fontSize: number;
  /** "en-GB" | "en-US" | "off" */
  spellcheckLanguage: string;
  /** Max width of the writing page, in px. */
  editorWidth: number;
  /** Horizontal padding inside the page, in px. */
  editorMargin: number;
}

const DEFAULTS: Settings = {
  fontFamily: "Segoe UI",
  fontSize: 15,
  spellcheckLanguage: "en-GB",
  editorWidth: 960,
  editorMargin: 56,
};

const FILE = "settings.json";
const DIR_OPTS = { baseDir: BaseDirectory.AppConfig } as const;

/** Loads settings from the app-config dir, falling back to defaults on any error. */
export async function loadSettings(): Promise<Settings> {
  try {
    if (await exists(FILE, DIR_OPTS)) {
      const text = await readTextFile(FILE, DIR_OPTS);
      return { ...DEFAULTS, ...JSON.parse(text) };
    }
  } catch {
    // corrupt/unreadable → defaults
  }
  return { ...DEFAULTS };
}

/** Persists settings (best-effort). */
export async function saveSettings(s: Settings): Promise<void> {
  try {
    await mkdir("", { ...DIR_OPTS, recursive: true });
    await writeTextFile(FILE, JSON.stringify(s, null, 2), DIR_OPTS);
  } catch {
    // never surface as a crash
  }
}

/**
 * Applies settings to the editing surface. Font is a *display* preference only — it
 * is never written into the .md. Spellcheck language drives the native WebView
 * spellchecker via the element's lang + spellcheck attributes.
 */
export function applySettings(editorRoot: HTMLElement, s: Settings): void {
  editorRoot.style.fontFamily = s.fontFamily;
  editorRoot.style.fontSize = `${s.fontSize}px`;

  // Width and horizontal margin are driven by CSS variables so they can change live.
  document.documentElement.style.setProperty("--editor-width", `${s.editorWidth}px`);
  document.documentElement.style.setProperty("--editor-margin", `${s.editorMargin}px`);

  const editable = editorRoot.querySelector(".ProseMirror") as HTMLElement | null;
  const target = editable ?? editorRoot;
  if (s.spellcheckLanguage === "off") {
    target.setAttribute("spellcheck", "false");
  } else {
    target.setAttribute("spellcheck", "true");
    target.setAttribute("lang", s.spellcheckLanguage);
  }
}
