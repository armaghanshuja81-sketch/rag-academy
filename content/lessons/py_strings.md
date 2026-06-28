---
id: py_strings
title: Strings & String Methods
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_variables]
tags: [python, strings, text-processing]
---

## Concept Introduction

A string is Python's type for text. Every document, query, and chunk in a RAG
system starts as a string — raw text that you'll clean, split, search, and
embed. By the end of this lesson you'll be able to slice, join, and transform
strings using Python's built-in methods.

## How It Works

Strings are sequences of characters. Python treats them like ordered
containers: each character has a position (index), starting at 0. You can
extract substrings by their index range, combine strings with `+`, and insert
variables with f-strings.

String *methods* are functions that live on the string object. They don't
modify the original — strings are immutable — they return a new string.
Methods like `.upper()`, `.strip()`, and `.replace()` are your primary tools
for cleaning text before it enters a RAG pipeline.

f-strings (formatted string literals) are the modern way to build strings from
variables. Prefix a string with `f` and wrap variables in `{}`. They're
readable, fast, and the standard in all modern Python code.

## Code Examples

Create a string and inspect it:

```python
text = "  Hello, RAG Academy!  "
print(len(text))         # 24 — total characters including spaces
print(text[2:7])         # "Hello" — characters at indices 2 through 6
```

Common cleaning methods you'll use constantly in RAG preprocessing:

```python
raw = "  Python for RAG\n"
clean = raw.strip()      # Remove leading/trailing whitespace
print(clean.lower())     # "python for rag"
print(clean.upper())     # "PYTHON FOR RAG"
print(clean.replace("RAG", "Retrieval-Augmented Generation"))
```

f-strings for building prompts and debug output:

```python
model = "llama-3"
temperature = 0.7
prompt = f"Using {model} with temperature {temperature}"
print(prompt)
```

## Try It Yourself

You have a raw chunk of text scraped from a web page. Clean it so it's ready
for chunking: strip whitespace, normalize to lowercase, and replace the
word "colour" with "color" (British to American spelling).

```python
raw_chunk = "  The colour of the embedding model matters for RAG accuracy.\n"

# Your code here — apply strip(), lower(), and replace()
cleaned = raw_chunk.strip().lower().replace("colour", "color")
print(cleaned)
# Expected: "the color of the embedding model matters for rag accuracy."
```

## Real-World RAG Connection

Text preprocessing is step zero of every RAG pipeline. Before you can chunk a
document, embed it, or search it, you must normalize its text. A document that
contains `"Python\n"` and a query that contains `"python"` won't match without
normalization. Strings with inconsistent casing, stray whitespace, or Unicode
quirks produce poor embeddings and missed retrievals. Every `str` method you
learn here is a tool you'll use on real document cleaning.

## Common Pitfalls

- **Pitfall:** Forgetting that strings are immutable — calling `text.lower()`
  doesn't change `text`, it returns a new string. **Fix:** Assign the result:
  `text = text.lower()`.
- **Pitfall:** Using `+` in a loop to build a long string. Each `+` creates a
  new string, making it O(n²). **Fix:** Use `"".join(list_of_strings)` for
  efficiently combining many strings.
- **Pitfall:** Confusing `.split()` (returns a list) with `.join()` (takes a
  list, returns a string). Direction memory aid: you *split* a string apart
  and *join* pieces together.

## Next Steps

- **Practice:** Write a function `clean_document(text)` that strips
  whitespace, lowercases, and replaces smart quotes (`"“"` → `"`).
  Test it on 3 different messy strings.
- **Read:** [Python String Methods — official docs](https://docs.python.org/3/library/stdtypes.html#string-methods)
- **Related:** [py_lists](/lesson/py_lists) — strings and lists share slicing
  syntax and iteration patterns
