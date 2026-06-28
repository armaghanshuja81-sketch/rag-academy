---
id: install_setup
title: Installing Python & VS Code
tier: junior
difficulty: beginner
estimated_minutes: 20
module: setup
prerequisites: []
tags: [setup, python, environment]
---

## Concept Introduction

You need two tools on your machine before you can write any code: the Python
interpreter that runs your programs, and a code editor where you'll write
them. By the end of this lesson you'll have both installed and working, and
you'll have run your first `.py` file.

## How It Works

Python is an interpreted language. When you run `python hello.py`, the Python
interpreter reads your file line by line, translates each line into
instructions your computer understands, and executes them immediately. You
don't need to compile anything — just write and run.

VS Code is a code editor with built-in terminal access and a Python extension
that adds run buttons, error highlighting, and autocomplete. The extension
talks to the Python interpreter you installed in Step 1, so they must both be
on your system PATH.

## Code Examples

After installation, verify everything works. Open a terminal (PowerShell on
Windows, Terminal on Mac/Linux) and check the Python version:

```
python --version
```

You should see something like `Python 3.12.x`. Now open VS Code, create a new
file called `hello.py`, and type:

```python
# My first Python program
name = input("What is your name? ")
print(f"Hello, {name}! Welcome to RAG Academy.")
```

Click the play button (triangle icon, top right) or press **Ctrl+F5** to run.
The terminal inside VS Code will prompt you for a name and print the greeting.

## Try It Yourself

Write a program in a new file called `setup_check.py` that prints answers to
these three checks:

1. Your Python version (`import sys; print(sys.version)`)
2. Your operating system (`import platform; print(platform.system())`)
3. Today's date (`from datetime import date; print(date.today())`)

```python
import sys
import platform
from datetime import date

print("Python version:", sys.version.split()[0])
print("OS:", platform.system())
print("Today:", date.today())
print("Setup complete!")
```

## Real-World RAG Connection

Your development environment is the foundation of every RAG project. When you
install packages like `langchain`, `chromadb`, or `sentence-transformers`,
they all run on the same Python interpreter you set up today. A misconfigured
PATH or a missing Python version causes hours of debugging before you've even
written a single line of RAG code.

## Common Pitfalls

- **Pitfall:** Skipping "Add Python to PATH" during Windows installation.
  **Fix:** If `python --version` fails, re-run the installer and check that
  box, or add the Python directory to your system PATH manually.
- **Pitfall:** Installing Python from the Microsoft Store instead of python.org.
  The Store version has permission quirks that break package installation.
  **Fix:** Uninstall it and download from python.org.
- **Pitfall:** VS Code runs the wrong Python. **Fix:** Click the Python version
  in the bottom-left status bar and select the correct interpreter.

## Next Steps

- **Practice:** Customize VS Code — install the "indent-rainbow" and
  "Error Lens" extensions. Both will save you time immediately.
- **Read:** [VS Code Python Setup Guide](https://code.visualstudio.com/docs/python/python-tutorial)
- **Related:** [first_program](/lesson/first_program) — write and run more
  Python code
