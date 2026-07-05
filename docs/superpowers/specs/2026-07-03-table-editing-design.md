# Table insert & edit — design

Adds the ability to insert a table and edit its structure (rows, columns, header).
The app already renders tables on open and serializes them on save, but offers no
way to create or modify one.

## Header-row fix (prerequisite)

Currently the serializer assumes **row 0** is the header (it always emits the
`| --- |` separator after the first row), while the *bold* header styling comes
from Markdig's `IsHeader` on open. Nothing persists "this row is the header" on
the WPF table.

Fix: tag the header row with `TableRow.Tag = "header"`. Both the bold styling and
the separator placement follow the tag, so a toggle-able header round-trips. On
open, the row Markdig marks `IsHeader` gets the tag; on save, the row with the tag
(or row 0 if none is tagged, for safety) is the header.

## 1. Insert (dialog: rows × columns)

- New `InsertTableWindow`: two numeric inputs (rows, columns), OK/Cancel. Default
  2×2. Clamp 1–20 each.
- Builds a WPF `Table`: a tagged bold header row plus the requested body rows, all
  empty cells, inserted at the caret.
- Reached via a **"Table" toolbar button** (insert must be clickable when the caret
  is not yet in a table; the toolbar is where the other content buttons live).

## 2. Edit ops (right-click context menu in a cell)

A `ContextMenu` on the RichTextBox, table-aware — enabled only when the caret is
inside a table cell:

- **Insert Row Above / Below**
- **Delete Row** — guarded: refuses to delete the last body row
- **Insert Column Left / Right**
- **Delete Column** — guarded: refuses to delete the last column
- **Toggle Header Row** — marks/unmarks row 0 as header (flips bold + the tag that
  drives the `---` separator)

When the caret is not in a table, these items are disabled so the menu stays clean.

## 3. Components

| Unit | Responsibility |
|---|---|
| `InsertTableWindow` | the rows×cols dialog |
| `TableOperations` | pure structure edits on WPF `Table`: build empty table, insert/delete row, insert/delete column, toggle header. Unit-testable. |
| `MainWindow` | wires the toolbar insert button + context menu; locates the caret's table/row/column |
| serializer | header driven by row `Tag`, not position |

`TableOperations` holds all table logic so `MainWindow` does not grow and the edits
can be tested without a window (build → edit → serialize → assert markdown).

### Locating the caret's cell

`Editor.CaretPosition.Paragraph` → walk `.Parent` up: `TableCell` → `TableRow` →
`TableRowGroup` → `Table`. Column index = the cell's index within its row. Row
index = the row's index within the row group. Null if not in a table.

## 4. Column operations detail

- **Insert column at index i**: for every row, insert a new empty `TableCell` at
  position i (clamped to the row's cell count).
- **Delete column at index i**: remove the cell at i from every row.
- Cells are plain (one empty `Paragraph`); header-row cells get bold like the rest
  of that row.

## Out of scope

- Cell merging / splitting, alignment markers (`:---:`), per-column width.
- Multiple header rows (markdown supports exactly one).

## Verification

- Unit tests (STA, same pattern as round-trip tests): build 2×2 → insert row below →
  serialize → assert an extra `| |` row; insert column → assert wider rows; delete
  guards hold; toggle header changes which row precedes the `---` separator.
- Runtime: drive the real app — insert a 2×2 via toolbar, add a row via right-click,
  confirm it renders and saves correct markdown.
- Existing 15 tests still pass.
