# RAG Academy — Lesson Style Guide

## Tier-Appropriate Depth

Each tier revisits topics at increasing depth. Match your explanation to the
tier. Don't front-load senior-level detail into a junior lesson.

| Tier | Focus | Question Answered |
|------|-------|-------------------|
| Junior | Fundamentals | "What is it and how do I use it?" |
| Mid | Application | "Why does it work and when do I use it?" |
| Senior | Design | "How do I architect it and what are the tradeoffs?" |
| Expert | Research | "What's the cutting edge and how do I push further?" |
| Bonus | Career | "How do I ship it, sell it, and get hired for it?" |

**Spiral rule:** Every lesson stands alone (someone might land on it from
search) but never repeats content from earlier tiers. If a junior lesson
explains what a list is, the mid lesson skips the definition and jumps
straight to list comprehensions and performance characteristics.

## Writing Rules

1. **Direct address.** Use "you" and "your." Do not use "we" or "the developer."
2. **Active voice.** "The retriever fetches documents" not "Documents are
   fetched by the retriever."
3. **No filler.** Delete "essentially," "basically," "in other words," "it is
   important to note that." If it's important, just say it.
4. **No marketing.** Never describe RAG Academy or the platform itself. The
   lesson is about the topic, not about the course.
5. **One concept per lesson.** If you need "and" in the title, split it.
6. **Code is the point.** Every lesson must include runnable code. If there's
   no code, it's an article, not a lesson.

## Length

- Target: 300-500 words of prose (not counting code blocks)
- Maximum: 700 words
- If it runs longer, it's probably two lessons

## Code Blocks

- All code must be runnable as-is in the Python Playground
- Use `print()` statements to show output rather than describing it
- Import statements go inside the code block, not in prose
- Prefer multiple short blocks (8-15 lines) over one long block
- Every code block needs a one-line introduction in prose above it

## Frontmatter

Every `.md` file starts with YAML frontmatter between `---` fences:

```yaml
---
id: snake_case          # matches filename without .md
title: Lesson Title     # Title Case, no punctuation
tier: junior
difficulty: beginner
estimated_minutes: 15   # integer, 10-30 for junior, 15-45 otherwise
module: module_id       # matches MODULES key in lessons_data.py
prerequisites: []       # list of lesson_ids the learner should complete first
tags: []                # 2-4 lowercase tags for search/filtering
---
```

## Section Requirements

All 7 sections are required. If a section genuinely doesn't apply (rare),
replace it with a single sentence explaining why and move on.

1. **Concept Introduction** — 2-3 sentences, ends with a clear learning goal
2. **How It Works** — the mechanics, plain language, 2-4 paragraphs
3. **Code Examples** — at least one runnable block, prefaced with context
4. **Try It Yourself** — specific exercise with expected behavior
5. **Real-World RAG Connection** — concrete pipeline example, 1 paragraph
6. **Common Pitfalls** — 2-3 mistake/fix pairs
7. **Next Steps** — practice, read, related

## Tone

Professional but warm. Imagine you're a senior engineer mentoring a junior
colleague — respectful, direct, never condescending. No jokes, no emoji,
no cultural references. The audience is global.
