# Kitchen Sink — MannyMarker feature test

A single document exercising every markdown feature the editor supports, plus a
section of common features *outside* the vocabulary, to see how they are handled.

---

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

## Links

Bare link text: [MannyMarker on GitHub](https://github.com/PaulCoughlin/mannymarker)

Link with title: [Typora](https://typora.io "The inspiration")

Autolink: <https://example.com/autolink>

## Images

Inline image (remote): ![placeholder alt text](https://via.placeholder.com/120x40.png)

Image with title: ![tiny](https://via.placeholder.com/60.png "hover title")

## Lists

Unordered:

- First item
- Second item
  - Nested item
  - Another nested
    - Third level
- Back to top level

Ordered:

1. Step one
2. Step two
   1. Sub-step a
   2. Sub-step b
3. Step three

Mixed nesting:

1. Ordered parent
   - Unordered child
   - Another child
2. Second parent

List items with marks: 

- **Bold item**
- *Italic item*
- Item with `code`
- Item with a [link](https://example.com)

## Blockquotes

> A single-line blockquote.

> A multi-line blockquote. Lorem ipsum dolor sit amet, consectetur adipiscing
> elit, sed do eiusmod tempor incididunt ut labore.

> Outer quote.
>
> > Nested quote inside it.

> A quote containing **bold**, *italic*, and `code`.

## Code blocks

```
Plain fenced code block
with two lines.
```

```javascript
// Fenced block with a language hint
function greet(name) {
  return `Hello, ${name}!`;
}
```

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

Indented text that is *not* a code fence should stay a paragraph.

## Tables

| Column A | Column B | Column C |
| -------- | -------- | -------- |
| a1       | b1       | c1       |
| a2       | b2       | c2       |

With alignment markers:

| Left | Center | Right |
| :--- | :----: | ----: |
| l    | c      | r     |
| ll   | cc     | rr    |

With inline marks in cells:

| Feature | Example |
| ------- | ------- |
| Bold    | **yes** |
| Code    | `x = 1` |
| Link    | [here](https://example.com) |

## Horizontal rules

Above the rule.

---

Between rules.

***

Below the rules.

## Escapes and edge cases

Literal asterisks: \*not italic\*. Literal underscore: \_not italic\_.

Literal backtick: \`not code\`. Literal hash at line start: \# not a heading.

Special characters: & < > " ' © é ü ñ — – … "curly quotes" 'single'

A very long unbroken word to test wrapping: antidisestablishmentarianismsupercalifragilisticexpialidocious

Hard line break (two trailing spaces):  
this line follows a hard break.

---

# Outside the vocabulary

Everything below is common markdown that MannyMarker does NOT list as supported.
Interesting to see: preserved, dropped, or rendered as plain text?

## Strikethrough

~~struck through~~ and a mix: **bold ~~struck~~ inside**.

## Task lists

- [ ] Unchecked task
- [x] Checked task

## Footnotes

Here is a claim.[^1]

[^1]: And here is its footnote.

## Definition list

Term
: Definition of the term.

## Raw HTML

<b>Raw HTML bold</b> and <span style="color: red;">a styled span</span>.

<details>
<summary>A details/summary block</summary>
Hidden content.
</details>

## Setext headings

Setext H1
=========

Setext H2
---------

## Math (not markdown, but common)

Inline math: $e^{i\pi} + 1 = 0$

Block math:

$$
\int_0^\infty e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
$$

*End of kitchen sink.*
