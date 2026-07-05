# Test 1: Headings, inline marks, links

## Headings

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Inline marks

Plain text. **Bold text.** *Italic text.* ***Bold and italic together.***

Inline `code span`, and code with backticks inside: `` a `tick` inside ``.

Subscript: H~2~O and CO~2~. Superscript: E = mc^2^ and x^10^.

A mix in one sentence: **bold**, *italic*, `code`, H~2~O, x^2^, and a [link](https://example.com).

## Inline HTML exceptions

These tags are official-markdown HTML passthrough and map onto editor marks:

Subscript tag: H<sub>2</sub>O. Superscript tag: x<sup>2</sup>.

Bold tags: <b>with b</b> and <strong>with strong</strong>.

Italic tags: <i>with i</i> and <em>with em</em>.

Strikethrough tags: <s>with s</s> and <del>with del</del>.

Code tag: <code>npm test</code>.

A line break here<br>via a br tag.

Not on the exception list, so these stay literal: <kbd>Ctrl</kbd> and <span>a span</span>.

Inside a code span they stay literal too: `a <b> tag`.

## Links

Bare link text: [MannyMarker on GitHub](https://github.com/PaulCoughlin/mannymarker)

Link with title: [Typora](https://typora.io "The inspiration")

Autolink: <https://example.com/autolink>
