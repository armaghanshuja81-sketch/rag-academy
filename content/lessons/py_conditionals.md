---
id: py_conditionals
title: Conditionals (if/elif/else)
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_variables]
tags: [python, conditionals, control-flow]
---

## Concept Introduction

Programs that always do the same thing are boring. Conditionals let your code
make decisions: *if* a condition is true, do this; *else*, do that. Every
retrieval quality check, every relevance threshold, every fallback path in a
RAG pipeline runs on conditionals. By the end of this lesson you'll write
branching logic with `if`, `elif`, and `else`.

## How It Works

Python evaluates the expression after `if` as a boolean — True or False. If
True, the indented block below runs. If False, Python skips to the next
`elif` (else-if), checks that condition, and continues down the chain. The
final `else` catches everything that didn't match.

The colon (`:`) is mandatory, and indentation defines the block. Python uses
4-space indentation by convention — not tabs. Every line inside the block must
be indented to the same level.

Comparison operators: `==` (equals), `!=` (not equals), `<`, `>`, `<=`, `>=`.
Logical operators: `and` (both must be true), `or` (at least one true), `not`
(negate).

## Code Examples

```python
# Basic branching
relevance_score = 0.72

if relevance_score >= 0.8:
    print("High relevance — show to user")
elif relevance_score >= 0.5:
    print("Medium relevance — show with warning")
else:
    print("Low relevance — hide this result")
```

Combine conditions with `and` / `or`:

```python
temperature = 0.5
max_tokens = 2048

if temperature > 0.8 and max_tokens < 512:
    print("Warning: high creativity with low token limit — output may be unstable")
elif temperature < 0.2 or max_tokens > 4000:
    print("Conservative generation mode")
```

Truthiness — non-boolean values in conditions:

```python
results = []  # Empty list
if results:
    print("Got results")     # This won't run — empty is falsy
else:
    print("No results found")  # This runs

# Falsy values: None, 0, 0.0, "" (empty string), [], {}, set()
```

## Try It Yourself

Write a function `classify_query(query)` that returns a routing decision based
on the query text. If it contains "code" return `"playground"`, if it contains
"database" return `"db_viewer"`, if it's empty return `"error"`, otherwise
return `"rag_search"`.

```python
def classify_query(query):
    if not query.strip():
        return "error"
    elif "code" in query.lower():
        return "playground"
    elif "database" in query.lower():
        return "db_viewer"
    else:
        return "rag_search"

# Tests
print(classify_query("show me code for sorting"))    # playground
print(classify_query("query the database"))           # db_viewer
print(classify_query("what is a vector?"))            # rag_search
print(classify_query(""))                             # error
```

## Real-World RAG Connection

Query routing is the first conditional in any production RAG system. A user
types something ambiguous — is it a code execution request? A database lookup?
A RAG query? Conditionals route it to the right handler. Later, when the
retriever returns results, conditionals filter out chunks below a relevance
threshold, select the top-k, and decide whether to trigger a fallback web
search. Control flow is the skeleton of RAG logic.

## Common Pitfalls

- **Pitfall:** Using `=` (assignment) instead of `==` (comparison) —
  `if x = 5:` is a SyntaxError. **Fix:** Use `==` for comparisons.
- **Pitfall:** Forgetting that `elif` requires a preceding `if` — you can't
  start a chain with `elif`. **Fix:** Always start with `if`, then optionally
  chain `elif` blocks, and end with an optional `else`.
- **Pitfall:** Deeply nested if-blocks (3+ levels). **Fix:** Use `elif` chains
  or extract conditions into named boolean variables for readability.

## Next Steps

- **Practice:** Write a `validate_config(config)` function that checks a RAG
  config dict — ensure `temperature` is between 0 and 1, `max_tokens` is
  positive, and `model` is a non-empty string. Return True if valid, or print
  the specific error.
- **Read:** [Python Control Flow — official docs](https://docs.python.org/3/tutorial/controlflow.html)
- **Related:** [py_loops](/lesson/py_loops) — repeat code with `for` and
  `while` loops
