---
id: py_lambda
title: Lambda Functions
tier: mid
difficulty: intermediate
estimated_minutes: 15
module: python
prerequisites: [py_functions]
tags: [python, lambda, functional-programming]
---

## Concept Introduction

Lambda functions are anonymous, single-expression functions. They shine as
arguments to `map()`, `filter()`, `sorted()`, and `key=` parameters — anywhere
you need a quick function without the ceremony of `def`. By the end of this
lesson you'll write lambdas and use them with Python's functional tools.

## How It Works

A lambda is just `def` without a name: `lambda x: x + 1` is equivalent to
`def _(x): return x + 1`. The body must be a single expression — no
statements, no assignments, no multiple lines. If your logic takes more than
one expression, it's not a lambda, write a `def`.

The `key` parameter is where lambdas are indispensable. `sorted(items,
key=lambda x: x["score"])` is cleaner than defining a named function for a
one-line comparison.

Functional tools paired with lambdas form a pipeline pattern: `map` transforms
each item, `filter` removes items, `sorted` reorders, and `reduce` aggregates.

## Code Examples

```python
# Named function vs lambda
def add_one(x): return x + 1
add_one_lambda = lambda x: x + 1  # Equivalent, but don't assign lambdas — use def

# The RIGHT way: lambda as an inline argument
pairs = [("rag", 0.9), ("vectordb", 0.7), ("embedding", 0.95)]
pairs.sort(key=lambda x: x[1], reverse=True)
print(pairs)  # Sorted by score descending
```

Map, filter, and sorted pipeline:

```python
chunks = ["  rag overview  ", "", "vector search  ", "  "]
processed = list(map(
    lambda c: c.strip().lower(),
    filter(lambda c: c.strip(), chunks)
))
print(processed)  # ['rag overview', 'vector search']

# Sort retrieved results by score, then alphabetically by title
results = [{"title": "Vector DBs", "score": 0.8}, {"title": "RAG Intro", "score": 0.8}, {"title": "Chunking", "score": 0.5}]
results.sort(key=lambda r: (-r["score"], r["title"]))
```

## Try It Yourself

Given a list of chunk metadata dicts with `text` and `word_count` keys, use
`map` + `filter` + `sorted` + lambdas to: filter chunks with > 50 words,
extract just the text, strip and lowercase it, return sorted by length:

```python
chunks = [
    {"text": "  Short.  ", "word_count": 5},
    {"text": "  Long enough text here  ", "word_count": 120},
    {"text": "Another good one here yes", "word_count": 75},
]
result = sorted(
    map(lambda c: c["text"].strip().lower(),
        filter(lambda c: c["word_count"] > 50, chunks)),
    key=len
)
print(result)  # ['another good one here yes', 'long enough text here']
```

## Real-World RAG Connection

Retrieval result sorting uses lambdas constantly: `results.sort(key=lambda r:
r["score"], reverse=True)`. When formatting retrieved chunks for prompt
injection, `map(lambda c: f"[{c['source']}] {c['text']}", chunks)` transforms
the data in one line.

## Common Pitfalls

- **Pitfall:** Assigning a lambda to a variable — `f = lambda x: x + 1`.
  This defeats the purpose (anonymous functions) and confuses debuggers.
  **Fix:** Use `def` for named functions.
- **Pitfall:** Lambda with side effects — `lambda x: print(x) or x`. Lambdas
  should be pure expressions. **Fix:** Use a `for` loop for side effects.
- **Pitfall:** Late binding in lambda closures — `[lambda: i for i in
  range(3)]` captures the final value of `i`. **Fix:** Use
  `lambda i=i: i` to bind the current value at definition time.

## Next Steps

- **Practice:** Take a list of retrieval results and use map+filter+sorted
  with lambdas to keep only results with score > 0.5 and format them as
  "Title (score)" strings.
- **Read:** [Python Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html)
- **Related:** [py_comprehensions](/lesson/py_comprehensions) — often clearer
  than map+filter+lambda combinations
