---
id: py_lists
title: Lists & Tuples
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_variables, py_strings]
tags: [python, lists, tuples, collections]
---

## Concept Introduction

A single variable holds one value. A list holds many values in a defined
order — your first data structure. Whenever you need to store multiple
documents, chunks, or search results, you reach for a list. By the end of this
lesson you'll be able to create lists, access items by position, add and remove
elements, and know when to use a tuple instead.

## How It Works

A list is an ordered, mutable sequence. *Ordered* means items stay in the
position you put them. *Mutable* means you can change, add, and remove items
after creation. Each position has an index starting at 0.

Python stores lists as arrays of references — the list itself doesn't contain
the objects, it contains pointers to them. This is why a single list can hold
a string, an integer, and another list simultaneously.

Tuples are lists' immutable sibling. Once created, you can't change them.
They're faster to create and safe from accidental modification — use them for
data that shouldn't change, like coordinates or configuration constants.

## Code Examples

```python
# Creating lists
docs = ["doc1.pdf", "doc2.pdf", "doc3.pdf"]
mixed = ["text", 42, True, ["nested", "list"]]

# Access by index
print(docs[0])       # "doc1.pdf" — first item
print(docs[-1])      # "doc3.pdf" — last item (negative counts from end)
print(docs[0:2])     # ["doc1.pdf", "doc2.pdf"] — slice, end index excluded

# Modify
docs.append("doc4.pdf")         # Add to end
docs.insert(0, "readme.txt")    # Insert at position
docs[2] = "updated.pdf"         # Replace
docs.remove("doc4.pdf")         # Remove by value
popped = docs.pop()             # Remove and return last item
```

Iterate through a list — the most common operation in data processing:

```python
chunks = ["chunk A", "chunk B", "chunk C"]
for chunk in chunks:
    print(f"Processing: {chunk}")
```

Tuples for data that shouldn't change:

```python
dimensions = (384, 768)       # Embedding dimensions — fixed
point = (10, 20)              # Coordinates
# dimensions[0] = 512         # TypeError — tuples are immutable
```

## Try It Yourself

You have a list of RAG document filenames. Write code that:
1. Sorts them alphabetically
2. Adds "metadata.json" at the start
3. Removes any file ending in ".tmp"
4. Prints the final count and list

```python
files = ["doc_c.pdf", "doc_a.pdf", "notes.tmp", "doc_b.pdf"]
files.sort()
files.insert(0, "metadata.json")
# Remove .tmp files — use a new list with only .pdf and .json
clean = [f for f in files if not f.endswith(".tmp")]
print(f"{len(clean)} files:", clean)
# Expected: 4 files: ['metadata.json', 'doc_a.pdf', 'doc_b.pdf', 'doc_c.pdf']
```

## Real-World RAG Connection

After chunking a document, you get a list of text chunks. After embedding,
you get a list of vectors. After retrieval, you get a list of ranked results.
Lists are the data structure you'll use to shuttle data between every stage of
a RAG pipeline. Slicing (`chunks[0:5]`) gives you the top results. List
comprehensions filter out low-relevance scores. Every operation here maps
directly to RAG data flow.

## Common Pitfalls

- **Pitfall:** IndexError from accessing beyond the list — `docs[10]` on a
  3-item list crashes. **Fix:** Check `len(docs)` first, or use a
  `try/except IndexError` block.
- **Pitfall:** Modifying a list while iterating over it causes skipped items
  and unexpected behavior. **Fix:** Iterate over a copy
  (`for item in list[:]`) or build a new list instead.
- **Pitfall:** Creating a list of lists with `[[]] * 5`. This creates 5
  references to the *same* inner list. **Fix:** Use a comprehension:
  `[[] for _ in range(5)]`.

## Next Steps

- **Practice:** Write a function `merge_and_deduplicate(list_a, list_b)` that
  combines two lists and removes duplicates while preserving order.
- **Read:** [Python Lists — official tutorial](https://docs.python.org/3/tutorial/datastructures.html)
- **Related:** [py_dicts](/lesson/py_dicts) — key-value lookups, the other
  fundamental collection type
