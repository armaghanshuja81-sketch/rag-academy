---
id: py_file_io
title: File I/O
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_functions]
tags: [python, files, json, io]
---

## Concept Introduction

Programs that can't read or write files are trapped in memory — everything
vanishes when the process ends. File I/O lets you load documents for RAG,
save processed chunks, and write results to disk. By the end of this lesson
you'll read text files, write output, and handle JSON data.

## How It Works

Python's `open()` function returns a file object. The mode argument controls
what you can do: `"r"` for reading (default), `"w"` for writing (overwrites
existing), `"a"` for appending. The `"b"` suffix switches to binary mode for
non-text files.

The `with` statement is the standard pattern — it guarantees the file is
closed after the block, even if an error occurs. Never use bare `open()` and
`close()` — it's error-prone and unnecessary.

JSON is the universal data interchange format. Python's `json` module converts
Python dicts and lists to JSON strings (`json.dump`/`dumps`) and back
(`json.load`/`loads`). Every RAG pipeline uses JSON for document metadata,
configuration, and API communication.

## Code Examples

Reading a text file:

```python
with open("documents/article.txt", "r", encoding="utf-8") as f:
    content = f.read()
print(f"Loaded {len(content)} characters")

# Read line by line (memory-efficient for large files)
with open("documents/article.txt", "r", encoding="utf-8") as f:
    for line_number, line in enumerate(f, 1):
        if line.strip():  # Skip blank lines
            print(f"Line {line_number}: {line.strip()[:80]}...")
```

Writing output:

```python
results = ["chunk_1: relevant", "chunk_2: not relevant", "chunk_3: relevant"]
with open("output/results.txt", "w", encoding="utf-8") as f:
    for line in results:
        f.write(line + "\n")
print("Results written to output/results.txt")
```

JSON for structured data — the lingua franca of RAG metadata:

```python
import json

# Reading
with open("config.json", "r", encoding="utf-8") as f:
    config = json.load(f)
print(f"Model: {config['model']}, Temperature: {config['temperature']}")

# Writing
metadata = {
    "source": "article.txt",
    "chunks": 12,
    "embedding_model": "text-embedding-3-small"
}
with open("output/metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)
```

## Try It Yourself

Write a program that reads a text file, splits it into paragraphs (by blank
lines), and writes each paragraph to a separate `.txt` file:

```python
import os

with open("documents/article.txt", "r", encoding="utf-8") as f:
    text = f.read()

paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
os.makedirs("output/paragraphs", exist_ok=True)

for i, para in enumerate(paragraphs):
    with open(f"output/paragraphs/para_{i:03d}.txt", "w", encoding="utf-8") as f:
        f.write(para)

print(f"Wrote {len(paragraphs)} paragraph files")
```

## Real-World RAG Connection

Document ingestion starts with file I/O. Your RAG pipeline reads PDFs, text
files, or HTML, extracts their content, chunks them, and stores the chunks
with JSON metadata. When the retriever finds relevant chunks, the metadata
JSON tells you which source document they came from, what page, and when it
was indexed. File I/O is the first and last step of every RAG operation.

## Common Pitfalls

- **Pitfall:** Forgetting `encoding="utf-8"` on Windows — files open with
  system default encoding (cp1252), which fails on non-ASCII characters.
  **Fix:** Always specify `encoding="utf-8"` explicitly.
- **Pitfall:** Opening in `"w"` mode on a file you meant to read destroys its
  contents instantly. **Fix:** Double-check the mode — `"r"` for read,
  `"w"` only when you intend to overwrite.
- **Pitfall:** `FileNotFoundError` — the path doesn't exist. **Fix:** Use
  `os.path.exists()` to check, or `os.makedirs()` to create directories
  before writing.

## Next Steps

- **Practice:** Write a function `load_documents(directory)` that reads every
  `.txt` file in a directory and returns a dict of `{filename: content}`.
  Skip files that can't be read.
- **Read:** [Python `json` module docs](https://docs.python.org/3/library/json.html)
- **Related:** [py_errors](/lesson/py_errors) — handle file-not-found and
  permission errors gracefully
