---
id: py_json_csv
title: JSON & CSV
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_dicts, py_file_io]
tags: [python, json, csv, data-formats]
---

## Concept Introduction

Real data doesn't live inside Python scripts — it lives in files. JSON and CSV
are the two most common formats you'll encounter when working with datasets,
API responses, and document metadata in RAG. By the end of this lesson you'll
parse, create, and convert between these formats.

## How It Works

JSON (JavaScript Object Notation) maps directly to Python types: objects are
dicts, arrays are lists, strings/numbers/booleans/null are their Python
equivalents. The `json` module's `load()`/`dump()` work with files;
`loads()`/`dumps()` work with strings (the `s` stands for string).

CSV (Comma-Separated Values) is a table represented as lines of text. Each
line is a row, columns are separated by commas. The `csv` module handles edge
cases like commas inside quoted fields. `csv.DictReader` reads each row as a
dict keyed by the header row — usually the most convenient approach.

When to use which: JSON for nested, hierarchical data (configs, API responses,
metadata). CSV for flat, tabular data (datasets, logs, evaluation scores).

## Code Examples

JSON — from dict to file and back:

```python
import json

# Writing
metadata = {
    "source": "article.txt",
    "chunks": 12,
    "embedding_model": "text-embedding-3-small",
    "tags": ["rag", "tutorial"]
}
with open("metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

# Reading
with open("metadata.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
print(loaded["embedding_model"])  # text-embedding-3-small
```

CSV — reading with DictReader:

```python
import csv

# Write a CSV
with open("eval_results.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["query", "recall", "precision"])
    writer.writeheader()
    writer.writerow({"query": "What is RAG?", "recall": 0.85, "precision": 0.72})
    writer.writerow({"query": "Define embeddings", "recall": 0.91, "precision": 0.88})

# Read it back
with open("eval_results.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"Query: {row['query']} | Recall: {row['recall']}")
```

## Try It Yourself

Convert a nested JSON evaluation report into a flat CSV of per-query scores:

```python
import json, csv

eval_json = """
{
  "model": "gpt-4o",
  "results": [
    {"query": "What is RAG?", "score": 0.85, "passed": true},
    {"query": "Define embeddings", "score": 0.91, "passed": true},
    {"query": "Explain chunking", "score": 0.62, "passed": false}
  ]
}
"""

data = json.loads(eval_json)
with open("flat_results.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["query", "score", "passed"])
    writer.writeheader()
    for item in data["results"]:
        writer.writerow(item)

# Verify by reading back
with open("flat_results.csv", "r", encoding="utf-8") as f:
    print(f.read())
```

## Real-World RAG Connection

RAG evaluation results are typically stored as JSON (nested, per-experiment)
or CSV (flat, per-query). API responses from OpenAI, Cohere, and Voyage are
all JSON. Document metadata — source URLs, timestamps, authors — is JSON
stored alongside vector chunks. CSV is the standard format for benchmark
datasets (Natural Questions, MS MARCO, BEIR) that you'll use to measure your
RAG pipeline's retrieval quality.

## Common Pitfalls

- **Pitfall:** `json.load()` on an empty file raises `JSONDecodeError`.
  **Fix:** Check file size or wrap in `try/except JSONDecodeError` with a
  default value.
- **Pitfall:** Writing non-serializable types (datetime, set, custom class)
  to JSON. **Fix:** Convert to strings/ints/floats/lists/dicts first, or
  provide a custom `default` function to `json.dumps`.
- **Pitfall:** Forgetting `newline=""` when opening CSV files for writing on
  Windows, which causes double-spaced rows. **Fix:** Always pass
  `newline=""` to `open()` for CSV files.

## Next Steps

- **Practice:** Write a function `merge_json_files(file_list)` that reads
  multiple JSON files (each a list of objects) and writes a single combined
  JSON file.
- **Read:** [Python `json` module docs](https://docs.python.org/3/library/json.html)
- **Related:** [py_file_io](/lesson/py_file_io) — the file operations that
  JSON and CSV depend on
