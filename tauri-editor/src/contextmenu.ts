import { Editor } from "@tiptap/core";
import { commands } from "./commands";

/**
 * Right-click behaviour.
 *
 * WebView2 shows its own native spelling menu (real OS suggestions + Ignore + Add to
 * dictionary) when you right-click a word. That is the best spelling experience, and
 * the browser sandbox will not let us read those suggestions to merge them into a
 * custom menu. So we ONLY show a custom menu inside a table (for row/column/header
 * ops) — everywhere else we let the native menu appear untouched.
 */
export function installContextMenu(editor: Editor, root: HTMLElement, menuEl: HTMLElement): void {
  const editable = root.querySelector(".ProseMirror") as HTMLElement;

  editable.addEventListener("contextmenu", (e: MouseEvent) => {
    // Not in a table → let the native spelling/clipboard menu show.
    if (!commands.inTable(editor)) return;

    e.preventDefault();
    buildMenu(menuEl, e.clientX, e.clientY, [
      { label: "Insert Row Above", action: () => commands.addRowBefore(editor) },
      { label: "Insert Row Below", action: () => commands.addRowAfter(editor) },
      { label: "Delete Row", action: () => commands.deleteRow(editor) },
      { separator: true as const },
      { label: "Insert Column Left", action: () => commands.addColumnBefore(editor) },
      { label: "Insert Column Right", action: () => commands.addColumnAfter(editor) },
      { label: "Delete Column", action: () => commands.deleteColumn(editor) },
      { separator: true as const },
      { label: "Toggle Header Row", action: () => commands.toggleHeaderRow(editor) },
    ]);
  });

  // Dismiss the custom menu on any outside click / Escape.
  document.addEventListener("click", () => hide(menuEl));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide(menuEl);
  });
}

type Item = { label: string; action: () => void } | { separator: true };

function buildMenu(menuEl: HTMLElement, x: number, y: number, items: Item[]): void {
  menuEl.innerHTML = "";
  for (const item of items) {
    if ("separator" in item) {
      const sep = document.createElement("div");
      sep.className = "ctx-sep";
      menuEl.appendChild(sep);
    } else {
      const btn = document.createElement("div");
      btn.className = "ctx-item";
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        item.action();
        hide(menuEl);
      });
      menuEl.appendChild(btn);
    }
  }
  menuEl.style.left = `${x}px`;
  menuEl.style.top = `${y}px`;
  menuEl.hidden = false;
}

function hide(menuEl: HTMLElement): void {
  menuEl.hidden = true;
}
