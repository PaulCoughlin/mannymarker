# Test 6: Outside the vocabulary

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

*End of tests.*
