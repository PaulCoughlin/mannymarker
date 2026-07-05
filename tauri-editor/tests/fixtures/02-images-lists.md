# Test 2: Images and lists

## Images

Inline image (remote): ![placeholder alt text](https://placehold.co/120x40.png)

Image with title: ![tiny](https://placehold.co/60.png "hover title")

An image right in the middle of a sentence ![dot](https://placehold.co/16.png) should not break the paragraph.

Embedded data-URI image (no network needed): ![red dot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKklEQVR4nGP8z8DwnwEPYMInOWQUsDAwMDDeZGDAGRBKDESEwtBQAAgAAPMbAyEc6hqDAAAAAElFTkSuQmCC)

## Heading after an image paragraph

The heading above must survive a save (it used to get swallowed).

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
