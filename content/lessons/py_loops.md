---
id: py_loops
title: Loops (for & while)
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_lists, py_dicts, py_conditionals]
tags: [python, loops, iteration]
---

## Concept Introduction

Typing the same operation 100 times is for machines, not you. Loops repeat a
block of code — once per list item, once per dictionary key, or until a
condition stops being true. By the end of this lesson you'll use `for` loops
to iterate over collections and `while` loops for condition-based repetition.

## How It Works

A `for` loop takes each item from an iterable (list, dict, string, range) and
runs the indented block with that item assigned to the loop variable. Python's
`for` is really a "for-each" — it doesn't use an index counter unless you
explicitly create one with `range()` or `enumerate()`.

A `while` loop keeps running as long as its condition is True. Use `while`
when you don't know in advance how many iterations you need — for example,
retrying a failed API call with exponential backoff.

`break` exits the loop immediately. `continue` skips the rest of the current
iteration and jumps to the next one.

## Code Examples

```python
# For loop over a list — the workhorse pattern
chunks = ["chunk_001", "chunk_002", "chunk_003"]
for chunk in chunks:
    print(f"Processing: {chunk}")

# Enumerate when you need both index and value
for i, chunk in enumerate(chunks):
    print(f"{i}: {chunk}")

# Range for counted loops
for i in range(3):
    print(f"Attempt {i + 1}")  # 0, 1, 2 becomes "Attempt 1/2/3"
```

Iterating over dictionaries:

```python
config = {"model": "gpt-4o", "temperature": 0.3}
for key, value in config.items():
    print(f"{key} = {value}")
```

While loop with a termination condition:

```python
retries = 0
max_retries = 3

while retries < max_retries:
    print(f"Attempt {retries + 1}...")
    retries += 1
    # In real code: if api_call_succeeds: break
```

## Try It Yourself

Process a list of RAG retrieval scores, printing only results above a
threshold, and stop early if you find a perfect match:

```python
scores = [0.45, 0.62, 0.91, 1.0, 0.78, 0.33]
threshold = 0.6

for i, score in enumerate(scores):
    if score < threshold:
        continue            # Skip low scores
    print(f"Result {i}: score={score} — show to user")
    if score == 1.0:
        print("Perfect match found! Stopping search.")
        break
# Expected: prints results 2 (0.91), 3 (1.0), then stops
```

## Real-World RAG Connection

Loops drive every data-processing stage in RAG. You loop over documents to
chunk them. You loop over chunks to embed them (or batch-embed for speed).
You loop over retrieved results to format them for the LLM prompt. The
retry-with-backoff pattern in `while` loops handles rate-limited embedding
APIs. If you can't write a loop, you can't build a RAG pipeline.

## Common Pitfalls

- **Pitfall:** Infinite `while` loop — forgetting to update the condition
  variable. `while retries < 3:` with no `retries += 1` runs forever.
  **Fix:** Always increment or modify the condition variable inside the loop
  body.
- **Pitfall:** Modifying a list while iterating over it — items shift and you
  skip elements. **Fix:** Iterate over a copy (`list[:]`) or build a new list
  with a comprehension.
- **Pitfall:** Using `range(len(list))` when you just need items. Write
  `for item in items:` not `for i in range(len(items)):`. **Fix:** Use
  `enumerate()` if you need the index too.

## Next Steps

- **Practice:** Write a `batch_process(chunks, batch_size)` function that
  loops through chunks in batches of `batch_size` and prints each batch.
  Hint: use `range(0, len(chunks), batch_size)`.
- **Read:** [Python For Loops — W3Schools](https://www.w3schools.com/python/python_for_loops.asp)
- **Related:** [py_functions](/lesson/py_functions) — wrap your loops in
  reusable functions
