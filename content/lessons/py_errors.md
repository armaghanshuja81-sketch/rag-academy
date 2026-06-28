---
id: py_errors
title: Exception Handling
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [py_file_io]
tags: [python, exceptions, error-handling]
---

## Concept Introduction

Errors crash your program. Exceptions let you catch those crashes, respond
gracefully, and keep running. In a RAG pipeline, a single bad document or
failed API call shouldn't bring down the entire system. By the end of this
lesson you'll catch exceptions with `try/except`, clean up resources with
`finally`, and raise your own errors.

## How It Works

When Python hits an error, it *raises* an exception — an object describing
what went wrong. If no code catches it, the exception propagates up the call
stack until it hits the top level and prints a traceback.

A `try` block tells Python "try this code, and if a specific exception occurs,
run this handler instead." Multiple `except` blocks handle different error
types. The `finally` block always runs — exception or not — and is used for
cleanup.

All exceptions inherit from `Exception`. Catch specific types
(`ValueError`, `FileNotFoundError`) rather than bare `except Exception` to
avoid masking bugs.

## Code Examples

```python
def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("Cannot divide by zero")
        return None
    except TypeError:
        print("Both arguments must be numbers")
        return None
    else:
        print(f"Division successful: {result}")
        return result
    finally:
        print("safe_divide completed")

print(safe_divide(10, 2))   # Works
print(safe_divide(10, 0))   # ZeroDivisionError → None
```

File operations with error handling:

```python
def load_config(path):
    import json
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Config file not found: {path} — using defaults")
        return {"model": "gpt-4o", "temperature": 0.3}
    except json.JSONDecodeError:
        print(f"Invalid JSON in config: {path}")
        return None
```

Raising your own errors for invalid states:

```python
def set_temperature(value):
    if not 0 <= value <= 1:
        raise ValueError(f"Temperature must be 0-1, got {value}")
    print(f"Temperature set to {value}")

# set_temperature(1.5)  # Raises ValueError
```

## Try It Yourself

Write a function `safe_chunk(text, size)` that handles edge cases: empty
text, size of zero, or size larger than the text:

```python
def safe_chunk(text, size=512):
    if not text:
        raise ValueError("Cannot chunk empty text")
    if size <= 0:
        raise ValueError(f"Chunk size must be positive, got {size}")
    if size >= len(text):
        return [text]  # One chunk — the whole text
    return [text[i:i+size] for i in range(0, len(text), size)]

# Test edge cases
try:
    print(safe_chunk("", 100))
except ValueError as e:
    print(f"Error: {e}")

print(safe_chunk("Short text", 100))  # One chunk
print(safe_chunk("A" * 10, 3))        # 4 chunks
```

## Real-World RAG Connection

A production RAG pipeline handles errors at every boundary: embedding API
timeouts (retry or fall back to local model), corrupt document files (skip
and log), malformed JSON metadata (use defaults), and rate limits
(exponential backoff). Without exception handling, any one failure kills the
entire pipeline. With it, the system degrades gracefully and logs what went
wrong for later investigation.

## Common Pitfalls

- **Pitfall:** Bare `except:` or `except Exception:` catches everything
  including `KeyboardInterrupt` and `SystemExit`, making the program
  impossible to stop. **Fix:** Catch specific exception types, or at minimum
  use `except Exception` (which excludes system-exit exceptions).
- **Pitfall:** Silent error swallowing — `except: pass` hides bugs and makes
  debugging impossible. **Fix:** At minimum, `print(f"Error: {e}")` or use
  `logging.exception()`.
- **Pitfall:** Putting too much code in `try` — an unrelated error gets
  caught by a handler meant for something else. **Fix:** Wrap the smallest
  possible block — typically just the line that might fail.

## Next Steps

- **Practice:** Write a `retry(func, max_attempts=3)` function that calls
  `func()` and retries on any exception, with a 1-second delay between
  attempts. Use `import time; time.sleep(1)` for the delay.
- **Read:** [Python Exceptions — official docs](https://docs.python.org/3/tutorial/errors.html)
- **Related:** [py_debugging](/lesson/py_debugging) — techniques to find the
  root cause when exceptions do occur
