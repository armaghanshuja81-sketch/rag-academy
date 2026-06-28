---
id: py_dicts
title: Dictionaries & Sets
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_lists]
tags: [python, dictionaries, sets, collections]
---

## Concept Introduction

A list finds items by position (index 0, 1, 2...). A dictionary finds items by
name — you look up a value by its key, like finding a word in a physical
dictionary. When you need to store user profiles, configuration, or metadata
attached to documents, dictionaries are the tool. Sets handle the simpler case:
"is this item in the collection?" By the end of this lesson you'll use dicts
for key-value storage and sets for uniqueness checks.

## How It Works

Dictionaries are hash tables under the hood. When you write `student["name"]`,
Python hashes the key `"name"` to find the exact memory location of the value
in near-constant time — O(1) regardless of dictionary size. This is why dicts
are fast for lookups even with millions of entries.

Keys must be hashable (immutable types: strings, numbers, tuples — not lists).
Values can be anything: strings, numbers, lists, even other dictionaries.

Sets are like dictionaries without values — they only store unique keys. Lookup
is also O(1). Use a set when you need to deduplicate items or check membership.

## Code Examples

```python
# Creating dictionaries
config = {
    "model": "gpt-4o",
    "temperature": 0.3,
    "max_tokens": 2048
}

# Access and modify
print(config["model"])           # "gpt-4o" — access by key
config["top_p"] = 0.9            # Add new key-value pair
config["temperature"] = 0.5      # Update existing

# Safe access with .get() — returns None instead of crashing
print(config.get("nonexistent", "default value"))

# Iterate
for key, value in config.items():
    print(f"{key} = {value}")
```

Sets for fast membership and deduplication:

```python
# Creating sets
stopwords = {"the", "a", "an", "is", "in"}

# Membership check — O(1), much faster than scanning a list
word = "the"
if word in stopwords:
    print(f"'{word}' is a stopword — skip it")

# Deduplicate
tokens = ["RAG", "vector", "RAG", "database", "vector", "embedding"]
unique = list(set(tokens))
print(unique)  # Order not guaranteed: {'database', 'vector', 'embedding', 'RAG'}
```

## Try It Yourself

Build a simple document index — a dictionary that maps document IDs to their
titles and word counts:

```python
index = {}

# Add 3 documents
index["doc_001"] = {"title": "Intro to RAG", "words": 1200}
index["doc_002"] = {"title": "Vector Search 101", "words": 850}
index["doc_003"] = {"title": "Chunking Strategies", "words": 2100}

# Find the longest document
longest_id = max(index, key=lambda k: index[k]["words"])
print(f"Longest: {index[longest_id]['title']} ({index[longest_id]['words']} words)")
# Expected: Longest: Chunking Strategies (2100 words)
```

## Real-World RAG Connection

Dictionaries are the backbone of every RAG pipeline's metadata layer. Each
chunked document carries a dict of metadata — source file, page number,
timestamp, URL. When the retriever returns results, you join each chunk with
its metadata dict to show the user *where* the answer came from. Sets
implement fast stopword filtering during text preprocessing — check if each
word is in a stopwords set before embedding it.

## Common Pitfalls

- **Pitfall:** `KeyError` from accessing a missing key with brackets —
  `config["missing"]` crashes. **Fix:** Use `config.get("missing")` which
  returns `None`, or `config.get("missing", default)` for a fallback value.
- **Pitfall:** Using a mutable type (list or dict) as a dictionary key.
  `{[1, 2]: "value"}` raises `TypeError: unhashable type`. **Fix:**
  Convert lists to tuples when you need them as keys: `{(1, 2): "value"}`.
- **Pitfall:** Assuming sets preserve insertion order. Sets are unordered in
  concept, though CPython 3.7+ happens to preserve order for small sets.
  **Fix:** If order matters, use a list or `dict.fromkeys()` which preserves
  order and deduplicates.

## Next Steps

- **Practice:** Write a function `build_inverted_index(docs)` that takes a
  dict of `{doc_id: text}` and returns a dict of `{word: [doc_ids]}` mapping
  each word to the documents that contain it.
- **Read:** [Python Dictionaries — official docs](https://docs.python.org/3/tutorial/datastructures.html#dictionaries)
- **Related:** [py_loops](/lesson/py_loops) — iterate efficiently over lists
  and dicts with `for` loops
