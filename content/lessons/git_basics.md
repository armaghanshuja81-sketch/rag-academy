---
id: git_basics
title: Git & GitHub Basics
tier: junior
difficulty: beginner
estimated_minutes: 20
module: git
prerequisites: [first_program]
tags: [git, version-control, collaboration]
---

## Concept Introduction

Git tracks every version of every file in your project so you can undo
mistakes, experiment safely, and collaborate without overwriting each other's
work. It's not just for teams — solo developers use Git to checkpoint their
progress and explore ideas in branches. By the end of this lesson you'll
initialize a repo, make commits, and push to GitHub.

## How It Works

Git is a distributed version control system. Every copy of the repository
contains the full history. This is unlike older systems (SVN, CVS) where the
history lived only on a central server.

The workflow has three zones:
1. **Working directory** — your actual files
2. **Staging area** — files marked for the next commit (`git add`)
3. **Repository** — the committed history (`.git/` folder)

A commit is a snapshot of the staging area with a message, timestamp, and
unique hash (SHA). Commits form a directed acyclic graph — each commit
points to its parent(s), creating a chain back to the initial commit.

## Code Examples

Initialize and make your first commits:

```bash
git init                          # Create a new repo in the current folder
git status                        # See what's changed (use constantly)

echo "# My RAG Project" > README.md
git add README.md                 # Stage the file
git commit -m "Add README"

echo "print('hello')" > main.py
git add main.py
git commit -m "Add main script"
```

Connect to GitHub and push:

```bash
git remote add origin https://github.com/yourname/your-repo.git
git branch -M main                # Rename branch to main
git push -u origin main           # Push and set upstream
```

Basic workflow you'll repeat hundreds of times:

```bash
# Make changes to files...
git status                        # What did I change?
git add file1.py file2.py         # Stage specific files
git commit -m "Fix: handle empty query in search route"
git push
```

## Try It Yourself

Simulate a real workflow:

1. Create a new directory, `git init` it
2. Create `app.py` with a simple Flask route, commit it
3. Create a `README.md`, commit it
4. Make a change to `app.py`, check `git diff`, then commit
5. View your history with `git log --oneline`

Expected output from `git log --oneline`:
```
abc1234 Add README
def5678 Add Flask app
```

## Real-World RAG Connection

Every major RAG library — LangChain, LlamaIndex, ChromaDB — is developed on
GitHub. When you find a bug in `langchain`, you check the git blame to see
when it was introduced. When you want to try a risky optimization to your
chunking strategy, you create a branch so `main` stays stable. When your
embedding pipeline breaks, you `git bisect` to find the exact commit that
caused it. Git is the backbone of modern software development.

## Common Pitfalls

- **Pitfall:** Committing sensitive files — API keys, `.env` files, passwords.
  **Fix:** Create a `.gitignore` file and add `.env`, `*.key`, and any
  credentials before your first commit.
- **Pitfall:** `git add .` without checking what's staged — it grabs
  everything including temporary files and debug logs. **Fix:** Always run
  `git status` before `git add .`, or stage files individually.
- **Pitfall:** Merge conflicts — two people edited the same line. Git can't
  choose. **Fix:** Open the conflicted file, look for `<<<<<<<` markers,
  pick the correct version, remove the markers, and commit.

## Next Steps

- **Practice:** Create a GitHub account, push your local repo, and browse the
  commit history on the web interface. Notice how each commit has a unique URL.
- **Read:** [GitHub Skills — interactive Git course](https://skills.github.com/)
- **Related:** [py_file_io](/lesson/py_file_io) — Git tracks files, so
  understanding file operations helps you understand what Git is tracking
