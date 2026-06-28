---
id: first_program
title: Your First Python Program
tier: junior
difficulty: beginner
estimated_minutes: 10
module: python
prerequisites: [install_setup]
tags: [python, basics, print]
---

## Concept Introduction

Every Python program is a text file full of instructions that Python executes
one line at a time, top to bottom. By the end of this lesson you'll understand
`print()`, comments, basic arithmetic, and how Python thinks about text versus
numbers.

## How It Works

When Python reads your file, it treats each line as a statement. Quoted text
is a string, bare digits are integers, and `#` marks a comment that Python
ignores entirely. The `print()` function sends output to the terminal — it's
your window into what the program is doing.

Strings need quotes (single or double, doesn't matter). Numbers don't.
If you write `print(2 + 2)`, Python evaluates the arithmetic first (getting
`4`) then prints the result. If you write `print("2 + 2")`, Python prints the
literal text `2 + 2` — no calculation happens.

## Code Examples

```python
# This is a comment — Python skips it
print("Hello, World!")       # Prints text

# Arithmetic inside print
print(2 + 2)                 # 4
print(10 - 3)                # 7
print(8 * 7)                 # 56
print(100 / 3)               # 33.333... (division always returns a float)

# Mixing text and values
print("The answer is", 42)   # Comma adds a space between items
```

Python knows the difference between these two lines:

```python
print("5" + "5")   # "55" — string concatenation
print(5 + 5)       # 10   — integer addition
```

## Try It Yourself

Write a program that prints a 3-line receipt for an imaginary RAG bookstore:

```
--- RAG Bookstore ---
Item: Embedding Cookbook
Price: $29.99
Total with tax: $32.39
```

```python
item = "Embedding Cookbook"
price = 29.99
tax = price * 0.08
total = price + tax

print("--- RAG Bookstore ---")
print("Item:", item)
print("Price: $" + str(price))
print("Total with tax: $" + str(round(total, 2)))
```

## Real-World RAG Connection

`print()` is the single most-used debugging tool in RAG development. When your
retriever returns the wrong documents, your first move is `print(chunks)`.
When an embedding looks wrong, you `print(vector[:5])` to peek at the first
few values. Master the humble print statement now — you'll use it thousands of
times.

## Common Pitfalls

- **Pitfall:** Forgetting to close a quote — `print("hello)` causes
  `SyntaxError: unterminated string literal`. **Fix:** Every opening quote
  needs a matching closing quote of the same type.
- **Pitfall:** Mixing strings and numbers with `+` — `"Price: " + 29.99`
  crashes with `TypeError`. **Fix:** Convert numbers to strings with `str()`,
  or use commas in `print()` which auto-convert.
- **Pitfall:** Indenting code that shouldn't be indented. Python uses
  indentation for structure, so extra spaces at the start of a line cause
  `IndentationError`. **Fix:** Start every line at the left margin unless
  you're inside a block.

## Next Steps

- **Practice:** Open the Python Playground and write a program that prints
  your name, age in days (age × 365), and the year you were born.
- **Read:** [Python's built-in `print()` docs](https://docs.python.org/3/library/functions.html#print)
- **Related:** [py_variables](/lesson/py_variables) — store values in named
  containers instead of typing them directly
