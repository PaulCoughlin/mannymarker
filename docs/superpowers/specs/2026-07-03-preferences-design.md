# Preferences, en-GB spellcheck, and clean startup — design

Adds a small preferences system to the editor, fixes the spellcheck dictionary to
English (UK), and fixes a startup bug where the blank document was marked dirty.

Scope is deliberately minimal: single user, personal tool.

## 1. Startup-dirty bug fix

**Problem.** The constructor assigns `Editor.Document = new FlowDocument(...)`, which
fires `TextChanged` before `_suppressDirty` is set, so the empty document is marked
dirty. Opening a file or closing the app then prompts "Save changes?" for an
untouched blank document.

**Fix.** Route the initial document through the same clean-load path `New` uses
(`LoadDocument` under the `_suppressDirty` guard, then `MarkClean`). A fresh blank
"Untitled" document is clean; Open/close prompt only after real edits.

**Startup state.** The app opens with a blank untitled document, ready to type
(matches Notepad). A single-window RichTextBox always needs *some* document; "no
document loaded" is not a meaningful state here.

## 2. Spellcheck language

WPF selects the spellcheck dictionary from the element's `Language`. It currently
defaults to the OS locale (en-US on this machine). Fix: drive it from the setting.

- `SpellcheckLanguage = "en-GB"` (default) → `Editor.Language = XmlLanguage.GetLanguage("en-GB")`, `SpellCheck.IsEnabled = true`
- `"en-US"` → `en-US`, enabled
- `"off"` → `SpellCheck.IsEnabled = false`

## 3. Preferences

### Settings model (`Settings.cs`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `FontFamily` | string | `"Segoe UI"` | Editor body font — **UI display only** |
| `FontSize` | double | `15` | Editor body size; headings scale relative to it |
| `SpellcheckLanguage` | string | `"en-GB"` | `en-GB` / `en-US` / `off` |
| `WindowWidth` | double? | null | null → use default |
| `WindowHeight` | double? | null | null → use default |
| `WindowLeft` | double? | null | null → center |
| `WindowTop` | double? | null | null → center |

**Font is a display preference only. It is never written to the `.md` file** —
markdown has no font concept, and the file must stay plain per SPEC.md. Changing the
font/size sets the *body default*; it does not rewrite existing per-run formatting
(bold, headings, inline code keep their styling).

### Storage (`SettingsStore.cs`)

- Location: `%APPDATA%\MdEditor\settings.json`
- Load once at startup; on missing/corrupt file, fall back to defaults (no crash).
- Save (serialize whole object) on each change and on window close.
- `System.Text.Json`, already in the runtime — no new dependency.

### Preferences dialog (`PreferencesWindow.xaml`)

Reached via **File → Preferences…**. A small modal, owned by the main window:

- **Font family** — ComboBox of installed system fonts (`Fonts.SystemFontFamilies`).
- **Font size** — ComboBox of common sizes (10, 11, 12, 13, 14, 15, 16, 18, 20, 24),
  editable so any value can be typed.
- **Spellcheck** — ComboBox: English (UK) / English (US) / Off.
- **Close** button. No OK/Cancel.

**Apply immediately + persist:** each control's change event (a) applies the change
to the live editor and (b) writes settings.json. Closing the dialog changes nothing
further.

### Wiring (`MainWindow`)

- **Startup:** load settings → apply font, size, spellcheck language to the editor →
  restore window bounds if present (validate they're on-screen; ignore if off-screen).
- **Preferences… click:** open the modal, passing a reference to apply changes live.
- **On close:** save current window bounds into settings, then persist.

## Components

| Unit | Responsibility | Depends on |
|---|---|---|
| `Settings` | plain data record of preferences | — |
| `SettingsStore` | load/save `Settings` to `%APPDATA%` JSON | `Settings`, `System.Text.Json` |
| `PreferencesWindow` | the modal UI; raises "apply" as settings change | `Settings` |
| `MainWindow` | owns settings; applies them to the editor; window bounds | all of the above |

## Out of scope

- Themes / colours, per-document settings, syncing.
- Reopen-last-file (considered, not chosen — blank startup selected).
- Font is not persisted into documents (by design).

## Verification

- **Bug:** launch → immediately Open a file → **no** save prompt. Type a char →
  Open now **does** prompt. (Manual, plus a unit check that a fresh document is clean.)
- **Spellcheck:** type "colour" and "color"; with en-GB, "color" is flagged and
  "colour" is not.
- **Preferences:** change font/size/language → editor updates live; reopen app →
  settings persisted; resize/move → bounds restored next launch.
- Existing 12 round-trip tests still pass (font/size must not leak into markdown).
