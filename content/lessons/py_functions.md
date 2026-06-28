---
id: py_functions
title: Functions
tier: junior
difficulty: beginner
estimated_minutes: 20
module: python
prerequisites: [py_loops]
tags: [python, functions, modularity]
---

## Concept Introduction

A function is a named block of code that you can call from anywhere. Give it
inputs (parameters), it does work, and optionally returns a result. Functions
are the primary unit of code organization in Python — every chunker, embedder,
and retriever in a RAG system is a function. By the end of this lesson you'll
write functions with parameters, return values, and docstrings.

## How It Works

When you define a function with `def`, Python stores the code block in memory
but doesn't execute it. Execution happens only when you *call* the function
with parentheses. Parameters are local variables — they exist only inside the
function and disappear when the function returns.

The `return` statement sends a value back to the caller and immediately exits
the function. A function without `return` implicitly returns `None`.

Python supports default parameter values. If the caller doesn't provide the
argument, the default is used. This is how most RAG libraries configure
optional settings like temperature, chunk size, or top-k.

## Code Examples

```python
def chunk_text(text, chunk_size=512, overlap=50):
    """Split text into overlapping chunks of given size."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

# Usage
text = "RAG combines retrieval with generation. " * 100
result = chunk_text(text, chunk_size=200, overlap=25)
print(f"Created {len(result)} chunks")
print(f"First chunk ({len(result[0])} chars): {result[0][:80]}...")
```

Functions compose — call one from another:

```python
def clean_text(raw):
    """Normalize text for embedding."""
    return raw.strip().lower().replace("\n", " ")

def prepare_for_rag(document):
    """Full preprocessing pipeline."""
    cleaned = clean_text(document)
    chunks = chunk_text(cleaned, chunk_size=512)
    return chunks

doc = "  Introduction to RAG\nRAG stands for Retrieval-Augmented Generation.  "
print(prepare_for_rag(doc)[0])
# "introduction to rag rag stands for retrieval-augmented generation."
```

## Try It Yourself

Write a function `compute_similarity(vec_a, vec_b)` that computes cosine
similarity between two equal-length vectors (lists of floats). Then test it
with example embedding vectors:

```python
import math

def compute_similarity(vec_a, vec_b):
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a ** 2 for a in vec_a))
    norm_b = math.sqrt(sum(b ** 2 for b in vec_b))
    return dot / (norm_a * norm_b)

# Test: two similar vectors should have high similarity
a = [0.1, 0.3, 0.5]
b = [0.15, 0.28, 0.52]
print(f"Similarity: {compute_similarity(a, b):.4f}")  # Close to 1.0
```

## Real-World RAG Connection

Every component of a RAG pipeline is a function (or a class whose methods are
functions). `embed_query(query)` → vector. `retrieve(vector, top_k=5)` →
documents. `generate(prompt, context)` → answer. When you chain them —
`generate(query, retrieve(embed_query(query)))` — you've built RAG. Well-named
functions with clear parameters and return types make your pipeline readable
and testable.

## Common Pitfalls

- **Pitfall:** Forgetting `return` — the function runs but the caller gets
  `None`. **Fix:** If you want a result back, write `return result`.
- **Pitfall:** Mutable default arguments — `def f(items=[]):` creates the
  list once and reuses it across calls. **Fix:** Use `None` as default:
  `def f(items=None): items = items or []`.
- **Pitfall:** Shadowing built-ins — naming a function parameter `list` or
  `str` hides the built-in type. **Fix:** Use descriptive names like
  `items`, `text`, `documents`.

## Next Steps

- **Practice:** Refactor your Try It Yourself exercises from previous lessons
  into functions. Every standalone script becomes a `def main():` with
  a `if __name__ == "__main__": main()` guard.
- **Read:** [Python Functions — official tutorial](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)
- **Related:** [py_file_io](/lesson/py_file_io) — functions that read from and
  write to files
