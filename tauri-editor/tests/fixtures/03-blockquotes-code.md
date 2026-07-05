# Test 3: Blockquotes and code blocks

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
