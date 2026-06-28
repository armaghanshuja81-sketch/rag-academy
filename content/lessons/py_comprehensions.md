---
id: py_comprehensions
title: List Comprehensions
tier: mid
difficulty: intermediate
estimated_minutes: 15
module: python
prerequisites: [py_lists, py_loops]
tags: [python, comprehensions, performance]
---

## Concept Introduction

List comprehensions are Python's concise syntax for building lists from
iterables. They're faster than equivalent `for` loops, more readable once you
learn the syntax, and the pattern generalizes to dicts, sets, and generators.
By the end of this lesson you'll write comprehensions fluently and know when
NOT to use them.

## How It Works

A list comprehension collapses a `for` loop into a single expression:
`[expression for item in iterable if condition]`. Python executes this in C
internally, avoiding the overhead of repeated `.append()` method lookups.
The speed difference isn't theoretical — comprehensions are consistently
20-30% faster than equivalent loops.

The pattern generalizes:
- `[x for x in seq]` — list comprehension, eager, returns list
- `{k: v for k, v in pairs}` — dict comprehension
- `{x for x in seq}` — set comprehension, deduplicates
- `(x for x in seq)` — generator expression, lazy, returns iterator

Generator expressions are the unsung hero for RAG: they process data one item
at a time without building the full list in memory. Use them when processing
thousands of document chunks.

## Code Examples

```python
# Before (5 lines, slower)
squares = []
for i in range(10):
    if i % 2 == 0:
        squares.append(i ** 2)

# After (1 line, faster)
squares = [i ** 2 for i in range(10) if i % 2 == 0]
print(squares)  # [0, 4, 16, 36, 64]
```

Dict and set comprehensions:

```python
# Dict: chunk ID → chunk text mapping
chunks = ["text A", "text B", "text C"]
chunk_map = {f"chunk_{i}": text for i, text in enumerate(chunks)}

# Set: unique tags from all documents
tags = {"rag", "vector", "rag", "database"}
unique = {t.lower() for t in tags}
```

Generator expression for memory-efficient processing:

```python
chunks = ["doc " * 100] * 5000  # Large dataset
lengths = (len(c) for c in chunks)  # Generator — no memory allocation
print(sum(lengths))  # Computed lazily
```

## Try It Yourself

Given a list of raw document strings, use comprehensions to:
1. Strip whitespace, lowercase, filter empty strings
2. Create a dict mapping `doc_0` through `doc_N` to cleaned text
3. Compute average document length (use a generator for the sum)

## Real-World RAG Connection

Chunk preprocessing pipelines use comprehensions constantly:
`chunks = [clean(c) for c in raw_chunks if len(c) > min_size]`. When
processing thousands of documents, generator expressions keep memory flat
while list comprehensions give you the final collection for indexing.

## Common Pitfalls

- **Pitfall:** Nested comprehensions that become unreadable — `[[x*y for x in
  range(3)] for y in range(3)]` is harder to debug than two explicit loops.
  **Fix:** If a comprehension spans more than ~70 characters, write a loop
  or extract the inner expression into a named function.
- **Pitfall:** Building a list comprehension for side effects — `[print(x) for
  x in items]` wastes memory building a list of Nones. **Fix:** Use a regular
  `for` loop for side effects.

## Next Steps

- **Practice:** Refactor 3 `for` loops from previous lessons into
  comprehensions or generator expressions.
- **Read:** [Python List Comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions)
- **Related:** [py_lambda](/lesson/py_lambda) — combine comprehensions with
  lambda functions for expressive data transforms
