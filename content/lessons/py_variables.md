---
id: py_variables
title: Variables & Data Types
tier: junior
difficulty: beginner
estimated_minutes: 15
module: python
prerequisites: [first_program]
tags: [python, variables, data-types]
---

## Concept Introduction

A variable is a named container that holds a value in memory. Instead of
retyping `29.99` every time you need a price, you store it once in `price` and
use the name everywhere. By the end of this lesson you'll be able to create
variables, know which type to use, and follow Python's naming conventions.

## How It Works

When you write `age = 20`, Python does three things: allocates memory for an
integer, stores `20` in it, and points the name `age` at that memory. The `=`
sign means *assignment*, not equality — you're giving a value a name, not
declaring a mathematical fact.

Python is dynamically typed: you don't declare types upfront. Python infers
the type from the value and tracks it internally. Use `type()` to inspect any
variable at runtime.

Variables can be reassigned to different values, and even different types:

```python
x = 42          # x is an int
x = "hello"     # now x is a string — this is allowed (but not recommended)
```

## Code Examples

```python
name = "Ada"            # str  — text in quotes
age = 25                # int  — whole number, no quotes
height = 1.68           # float — decimal point
is_enrolled = True      # bool — True or False (capitalized)

print(type(name))       # <class 'str'>
print(type(age))        # <class 'int'>
print(type(height))     # <class 'float'>
print(type(is_enrolled))# <class 'bool'>

age = age + 1           # Use the current value to compute a new one
print(age)              # 26
```

Python's naming convention is `snake_case` — lowercase words separated by
underscores:

```python
user_name = "ada_lovelace"     # Good
max_retries = 3                # Good
userName = "ada_lovelace"      # Works but not Pythonic
2nd_place = "runner_up"        # SyntaxError — can't start with digit
```

## Try It Yourself

Create variables for a RAG application's configuration and print a summary:

```python
model = "gpt-4o"
temperature = 0.3
max_tokens = 2048
use_hyde = True

print("Model:", model)
print("Temperature:", temperature)
print("Max tokens:", max_tokens)
print("HyDE enabled:", use_hyde)
# Compute: how many tokens remain after a 512-token prompt?
print("Remaining tokens:", max_tokens - 512)
```

## Real-World RAG Connection

Every RAG pipeline runs on configuration variables: model names, chunk sizes,
top-k values, temperature settings. These aren't hardcoded — they're stored in
variables so you can change them in one place. A variable like `chunk_size =
512` might be referenced 15 times across your chunking, embedding, and
retrieval code. Change it once, everything updates.

## Common Pitfalls

- **Pitfall:** Using a variable before assigning it — `print(total)` before
  `total = ...` raises `NameError`. **Fix:** Every variable must be assigned
  before its first use.
- **Pitfall:** Confusing `=` (assignment) with `==` (comparison). `x = 5`
  stores 5 in x. `x == 5` asks "does x equal 5?" and returns True/False.
  **Fix:** If you meant to check equality, use `==`.
- **Pitfall:** Accidentally overwriting a built-in name like `list` or `str`
  by using them as variable names. **Fix:** Never name a variable `list`,
  `dict`, `str`, `int`, `sum`, `max`, `min`, or `type`.

## Next Steps

- **Practice:** Write a `profile_card` program: store your name, age, city,
  and a boolean `learning_python`, then print them all in a formatted block.
- **Read:** [Python Variables — W3Schools](https://www.w3schools.com/python/python_variables.asp)
- **Related:** [py_strings](/lesson/py_strings) — the `str` type is your most
  frequently used data type in RAG
