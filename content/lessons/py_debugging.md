---
id: py_debugging
title: Debugging Techniques
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_errors]
tags: [python, debugging, troubleshooting]
---

## Concept Introduction

You'll spend more time debugging than writing new code — every developer does.
Debugging isn't a sign of failure; it's the normal state of programming. By
the end of this lesson you'll use print-debugging, read tracebacks, and
isolate problems systematically.

## How It Works

A bug is just code doing exactly what you told it to do, not what you *meant*
it to do. The fastest debug loop has three steps: (1) reproduce the error,
(2) narrow down where it happens, (3) inspect the state at that point.

Tracebacks are your best friend. Python prints the exact file, line number,
and call stack when an exception occurs. Read from bottom to top: the last
line is the exception type and message, the line above is where it happened.

Print-debugging (`print(f"DEBUG: {variable=}")`) is the universal technique
that works in every language, every framework, every environment. Logging
libraries add structure, but `print()` gets you unstuck right now.

## Code Examples

Reading a traceback:

```python
def embed(text):
    return [len(text), 0.0, 0.0]  # Simplified — returns 3 values

def retrieve(vector, top_k):
    results = [{"score": 0.9}, {"score": 0.7}]
    return results[:top_k]

def rag_pipeline(query):
    vec = embed(query)
    chunks = retrieve(vec, top_k=3)
    return chunks[2]  # IndexError! Only 2 results, requested index 2

# rag_pipeline("What is RAG?")  # Uncomment to see the traceback
```

Print-debugging to inspect intermediate state:

```python
def process_documents(docs):
    print(f"DEBUG: received {len(docs)} documents")
    cleaned = []
    for i, doc in enumerate(docs):
        text = doc.get("content", "").strip()
        if not text:
            print(f"DEBUG: skipping empty doc at index {i}")
            continue
        cleaned.append(text)
    print(f"DEBUG: kept {len(cleaned)} non-empty docs")
    return cleaned
```

Use f-string `=` syntax (Python 3.8+) for quick variable inspection:

```python
chunk_size = 512
overlap = 50
total = 10000
print(f"{chunk_size=} {overlap=} {total=}")
# Output: chunk_size=512 overlap=50 total=10000
```

## Try It Yourself

This function has two bugs. Find and fix them using print-debugging:

```python
def compute_recall(relevant_ids, retrieved_ids):
    """What fraction of relevant docs did we retrieve?"""
    hits = 0
    for rid in retrieved_ids:
        if rid in relevant_ids:
            hits += 1 
    return hits / len(retrieved_ids)  # BUG 1: should divide by relevant_ids
    # BUG 2: what if relevant_ids is empty?

# Test — should print ~1.0 for perfect retrieval, not crash on empty
print(compute_recall(["a","b","c"], ["a","b","d"]))  # Should be 2/3 ≈ 0.67
# Add your fix and test with empty relevant_ids
```

## Real-World RAG Connection

RAG debugging has a unique challenge: when the LLM gives a wrong answer, the
bug could be in the chunking, the embedding, the retrieval, the prompt
template, or the model itself. Systematic debugging — isolate each stage, print
its output, verify it matches expectations — is the only way to trace a bad
answer back to its source. Print the retrieved chunks before they enter the
prompt. Print the prompt before it goes to the LLM. Print the LLM response
before it reaches the user.

## Common Pitfalls

- **Pitfall:** Guessing the bug without inspecting state. "Probably a null
  pointer" wastes more time than one `print(x)` call. **Fix:** Print the
  variable first, form a hypothesis second.
- **Pitfall:** Reading tracebacks from top to bottom. **Fix:** Read from
  bottom — the last line is the error, work upward through the call stack.
- **Pitfall:** Changing multiple things between test runs. **Fix:** Change
  exactly one thing at a time so you know what fixed it (or broke it worse).

## Next Steps

- **Practice:** Take any function you wrote in a previous lesson and
  deliberately introduce a bug (wrong index, off-by-one, missing key). Then
  use print-debugging to find and fix it.
- **Read:** [Python Debugging with pdb](https://docs.python.org/3/library/pdb.html)
- **Related:** [py_errors](/lesson/py_errors) — catch the exceptions your
  debugging uncovers
