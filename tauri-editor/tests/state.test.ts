import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// DocumentState talks to the Tauri IPC; stub the modules it imports so it can
// run under jsdom. invoke() serves a fake file; window/dialog are inert.
const invokeMock = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke: (...args: unknown[]) => invokeMock(...args) }));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn() }),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
  ask: vi.fn(),
}));

import { Editor } from "@tiptap/core";
import { createEditor, toMarkdown } from "../src/editor";
import { DocumentState } from "../src/state";

describe("DocumentState.openPath (startup file from 'Open with')", () => {
  let el: HTMLElement;
  let editor: Editor;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
    editor = createEditor(el, () => {});
    invokeMock.mockReset();
  });

  afterEach(() => {
    editor.destroy();
    el.remove();
  });

  it("loads the file contents into the editor", async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === "read_file") return "# From disk";
      if (cmd === "file_mtime") return 1751700000000;
      throw new Error(`unexpected invoke: ${cmd}`);
    });

    const state = new DocumentState(editor);
    state.init();
    await state.openPath("C:\\notes\\hello.md");

    expect(toMarkdown(editor).trim()).toBe("# From disk");
    expect(invokeMock).toHaveBeenCalledWith("read_file", { path: "C:\\notes\\hello.md" });
  });
});
