import { Editor } from "@tiptap/core";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog, save as saveDialog, ask } from "@tauri-apps/plugin-dialog";
import { toMarkdown, setMarkdown } from "./editor";

const MD_FILTER = [{ name: "Markdown", extensions: ["md"] }, { name: "All files", extensions: ["*"] }];

/**
 * Owns document lifecycle: current path, dirty state, and the New/Open/Save/SaveAs
 * flows. Mirrors the WPF app's dirty-state logic — a fresh document is clean, and
 * New/Open/close prompt to save only when there are unsaved edits.
 */
export class DocumentState {
  private currentPath: string | null = null;
  private dirty = false;
  private suppressDirty = false;

  constructor(private editor: Editor) {}

  /** Call from the editor's onUpdate. */
  markDirtyFromEdit(): void {
    if (this.suppressDirty) return;
    if (!this.dirty) {
      this.dirty = true;
      this.updateTitle();
    }
  }

  private markClean(): void {
    this.dirty = false;
    this.updateTitle();
  }

  private fileName(): string {
    if (!this.currentPath) return "Untitled";
    return this.currentPath.replace(/^.*[\\/]/, "");
  }

  private updateTitle(): void {
    const title = `${this.dirty ? "* " : ""}${this.fileName()} — MannyMarker`;
    getCurrentWindow().setTitle(title);

    // The status bar shows the full path (or a placeholder when unsaved).
    const pathEl = document.getElementById("status-path");
    if (pathEl) {
      pathEl.textContent = this.currentPath ?? "Unsaved document";
    }
  }

  /** Shows a "last saved" time in the status bar, or clears it (ms since epoch, or null). */
  private setSaved(epochMs: number | null): void {
    const el = document.getElementById("status-saved");
    if (!el) return;
    if (epochMs === null) {
      el.textContent = "";
      return;
    }
    const d = new Date(epochMs);
    const date = d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    el.textContent = `Saved ${date} ${time}`;
  }

  /** Load content without marking dirty (the initial blank doc, and after open/new). */
  private loadClean(markdown: string): void {
    this.suppressDirty = true;
    setMarkdown(this.editor, markdown);
    this.suppressDirty = false;
    this.markClean();
  }

  init(): void {
    this.loadClean("");
  }

  /**
   * Standard Windows unsaved-changes flow: Save / Don't Save / Cancel (native
   * three-button dialog via the Rust shell). Returns true when it is safe to
   * proceed — the document was saved or explicitly not saved. Choosing Save on
   * an unnamed document opens Save As; cancelling that aborts too.
   */
  private async confirmDiscard(): Promise<boolean> {
    if (!this.dirty) return true;
    const choice = await invoke<string>("confirm_save", { fileName: this.fileName() });
    if (choice === "save") return await this.save();
    return choice === "discard";
  }

  async newDocument(): Promise<void> {
    if (!(await this.confirmDiscard())) return;
    this.currentPath = null;
    this.loadClean("");
    this.setSaved(null);
  }

  async open(): Promise<void> {
    if (!(await this.confirmDiscard())) return;
    const selected = await openDialog({ multiple: false, filters: MD_FILTER });
    if (typeof selected !== "string") return;
    await this.openPath(selected);
  }

  /** Load a known path directly (Open dialog result, or a file passed on launch). */
  async openPath(path: string): Promise<void> {
    try {
      const text = await invoke<string>("read_file", { path });
      this.currentPath = path;
      this.loadClean(text);
      const mtime = await invoke<number | null>("file_mtime", { path });
      this.setSaved(mtime ?? null);
    } catch (e) {
      await ask(`Could not open file:\n${e}`, { title: "Markdown Editor", kind: "error" });
    }
  }

  async save(): Promise<boolean> {
    if (!this.currentPath) return this.saveAs();
    return this.writeTo(this.currentPath);
  }

  async saveAs(): Promise<boolean> {
    const selected = await saveDialog({
      defaultPath: this.currentPath ?? "Untitled.md",
      filters: MD_FILTER,
    });
    if (typeof selected !== "string") return false;
    if (await this.writeTo(selected)) {
      this.currentPath = selected;
      this.updateTitle();
      return true;
    }
    return false;
  }

  private async writeTo(path: string): Promise<boolean> {
    try {
      await invoke("write_file", { path, contents: toMarkdown(this.editor) });
      this.markClean();
      this.setSaved(Date.now());
      return true;
    } catch (e) {
      await ask(`Could not save file:\n${e}`, { title: "Markdown Editor", kind: "error" });
      return false;
    }
  }

  /** Used by the close handler. Returns true if the window may close. */
  async canClose(): Promise<boolean> {
    return this.confirmDiscard();
  }
}
