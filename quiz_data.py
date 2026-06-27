# -*- coding: utf-8 -*-
"""
MCQ quiz data for RAG Academy lessons.
Each quiz: 3-5 questions per lesson, passing score >= 70%.
Auto-marks lesson complete when passed.
"""

QUIZZES: dict[str, list[dict]] = {
    # ═══════════════════════════════════════════════
    # MODULE 0: Getting Started
    # ═══════════════════════════════════════════════
    "welcome": [
        {
            "question": "What does RAG stand for?",
            "options": [
                "Random Access Generation",
                "Retrieval-Augmented Generation",
                "Rapid Application Gateway",
                "Reactive AI Generator",
            ],
            "correct": 1,
            "explanation": "RAG = Retrieval-Augmented Generation — it retrieves relevant documents and uses them to augment the LLM's response.",
        },
        {
            "question": "Which tier should you start with in RAG Academy?",
            "options": [
                "Expert",
                "Senior",
                "Junior",
                "Bonus",
            ],
            "correct": 2,
            "explanation": "Start with the Junior tier to build your foundation, then progress through Mid, Senior, and Expert.",
        },
        {
            "question": "What is the main language taught in this course?",
            "options": [
                "JavaScript",
                "Java",
                "C++",
                "Python",
            ],
            "correct": 3,
            "explanation": "Python is the language of AI and data science — it's the primary language used throughout RAG Academy.",
        },
        {
            "question": "How many tiers does RAG Academy have?",
            "options": [
                "3",
                "4",
                "5",
                "7",
            ],
            "correct": 2,
            "explanation": "There are 5 tiers: Junior, Mid, Senior, Expert, and Bonus.",
        },
    ],

    "install_setup": [
        {
            "question": "Which IDE is recommended for this course?",
            "options": [
                "Notepad",
                "VS Code",
                "Eclipse",
                "Sublime Text",
            ],
            "correct": 1,
            "explanation": "VS Code is the recommended editor — it's free, powerful, and has excellent Python support.",
        },
        {
            "question": "How do you check if Python is installed on your system?",
            "options": [
                "python --version",
                "check-python",
                "is-python-installed",
                "verify python",
            ],
            "correct": 0,
            "explanation": "Run `python --version` (or `python3 --version`) in your terminal to check the installed Python version.",
        },
        {
            "question": "What is pip used for?",
            "options": [
                "Running Python code",
                "Installing Python packages",
                "Creating Python files",
                "Deleting Python files",
            ],
            "correct": 1,
            "explanation": "pip is the Python package installer — it downloads and installs libraries from the Python Package Index (PyPI).",
        },
    ],

    "first_program": [
        {
            "question": "What does `print('Hello, World!')` do?",
            "options": [
                "Saves 'Hello, World!' to a file",
                "Displays 'Hello, World!' on the screen",
                "Sends 'Hello, World!' over the network",
                "Nothing — 'Hello, World!' is invalid syntax",
            ],
            "correct": 1,
            "explanation": "The `print()` function outputs text to the console/terminal.",
        },
        {
            "question": "What file extension do Python files use?",
            "options": [
                ".pt",
                ".pyt",
                ".py",
                ".python",
            ],
            "correct": 2,
            "explanation": "Python source files use the `.py` extension.",
        },
        {
            "question": "What is a comment in Python?",
            "options": [
                "Code starting with `//`",
                "Code starting with `#`",
                "Code starting with `/*`",
                "Code starting with `--`",
            ],
            "correct": 1,
            "explanation": "In Python, comments start with the `#` character. Everything after `#` on that line is ignored by Python.",
        },
    ],

    # ═══════════════════════════════════════════════
    # MODULE 1: Python Engineering
    # ═══════════════════════════════════════════════
    "py_variables": [
        {
            "question": "Which is the correct way to declare a variable in Python?",
            "options": [
                "var x = 5",
                "int x = 5",
                "x = 5",
                "let x = 5",
            ],
            "correct": 2,
            "explanation": "Python doesn't need type declarations — just assign with `=`.",
        },
        {
            "question": "What data type is `3.14` in Python?",
            "options": [
                "integer",
                "float",
                "string",
                "boolean",
            ],
            "correct": 1,
            "explanation": "Numbers with decimal points are `float` (floating-point) values.",
        },
        {
            "question": "How do you check the type of a variable in Python?",
            "options": [
                "typeof(x)",
                "x.type()",
                "type(x)",
                "x.dtype",
            ],
            "correct": 2,
            "explanation": "The `type()` built-in function returns the type of any Python object.",
        },
        {
            "question": "What will `name = 'Ali'` followed by `Name` produce?",
            "options": [
                "'Ali'",
                "NameError: name 'Name' is not defined",
                "None",
                "SyntaxError",
            ],
            "correct": 1,
            "explanation": "Python variable names are case-sensitive — `name` and `Name` are different variables.",
        },
    ],

    "py_strings": [
        {
            "question": "What does `f'Hello, {name}'` do?",
            "options": [
                "Prints the literal text '{name}'",
                "Inserts the value of the `name` variable into the string",
                "Creates a file named 'Hello'",
                "Raises a SyntaxError",
            ],
            "correct": 1,
            "explanation": "f-strings (formatted string literals) embed expressions inside string literals using `{}`.",
        },
        {
            "question": "What does `'hello'.upper()` return?",
            "options": [
                "'Hello'",
                "'HELLO'",
                "'hello'",
                "Error",
            ],
            "correct": 1,
            "explanation": "`.upper()` converts all characters in the string to uppercase.",
        },
        {
            "question": "How do you get the length of a string in Python?",
            "options": [
                "string.length()",
                "string.size()",
                "len(string)",
                "count(string)",
            ],
            "correct": 2,
            "explanation": "The `len()` built-in function returns the number of characters in a string.",
        },
    ],

    "py_lists": [
        {
            "question": "How do you access the first element of a list `items`?",
            "options": [
                "items[1]",
                "items[0]",
                "items.first()",
                "items[-0]",
            ],
            "correct": 1,
            "explanation": "Python uses zero-based indexing — the first element is at index `[0]`.",
        },
        {
            "question": "What does `items.append(4)` do?",
            "options": [
                "Removes the first occurrence of 4",
                "Adds 4 to the end of the list",
                "Inserts 4 at the beginning",
                "Creates a new list [4]",
            ],
            "correct": 1,
            "explanation": "`.append()` adds an element to the end of the list in-place.",
        },
        {
            "question": "What is the difference between a list and a tuple?",
            "options": [
                "Lists are faster than tuples",
                "Tuples can be modified after creation, lists cannot",
                "Lists can be modified after creation, tuples cannot",
                "There is no difference",
            ],
            "correct": 2,
            "explanation": "Lists are mutable (can be changed) while tuples are immutable (cannot be changed after creation).",
        },
    ],

    "py_conditionals": [
        {
            "question": "What keyword starts an alternative condition in Python?",
            "options": [
                "else if",
                "elif",
                "elsif",
                "elseif",
            ],
            "correct": 1,
            "explanation": "Python uses `elif` (short for 'else if') for additional conditions.",
        },
        {
            "question": "What does `==` mean in Python?",
            "options": [
                "Assignment",
                "Equality comparison",
                "Greater than or equal",
                "Not equal",
            ],
            "correct": 1,
            "explanation": "`==` checks if two values are equal. `=` is used for assignment.",
        },
        {
            "question": "What will `if 5 > 3:` evaluate to?",
            "options": [
                "False",
                "True",
                "Error",
                "None",
            ],
            "correct": 1,
            "explanation": "5 is greater than 3, so the condition evaluates to `True`.",
        },
    ],

    # ═══════════════════════════════════════════════
    # More quizzes will be added as content grows
    # ═══════════════════════════════════════════════
}

# Passing threshold (percentage)
PASSING_SCORE = 70


def get_quiz(lesson_id: str) -> list[dict] | None:
    """Return quiz questions for a lesson, or None if no quiz exists."""
    return QUIZZES.get(lesson_id)


def check_answers(lesson_id: str, answers: list[int]) -> dict:
    """
    Check submitted answers against correct answers.
    Returns { passed: bool, score: int, total: int, results: [...] }
    """
    questions = QUIZZES.get(lesson_id)
    if not questions:
        return {"error": "No quiz found for this lesson"}

    total = len(questions)
    if len(answers) != total:
        return {"error": f"Expected {total} answers, got {len(answers)}"}

    results = []
    correct_count = 0

    for i, q in enumerate(questions):
        selected = answers[i] if i < len(answers) else -1
        is_correct = selected == q["correct"]
        if is_correct:
            correct_count += 1
        results.append({
            "question_id": i,
            "question": q["question"],
            "selected": selected,
            "correct_answer": q["correct"],
            "is_correct": is_correct,
            "explanation": q["explanation"],
        })

    score = round((correct_count / total) * 100)
    passed = score >= PASSING_SCORE

    return {
        "passed": passed,
        "score": score,
        "total": total,
        "correct_count": correct_count,
        "passing_score": PASSING_SCORE,
        "results": results,
    }
