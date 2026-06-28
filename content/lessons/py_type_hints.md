---
id: py_type_hints
title: Type Hints & mypy
tier: senior
difficulty: advanced
estimated_minutes: 25
module: python-foundations
prerequisites: []
tags: [python, typing, mypy, static-analysis, ci]
---

## Concept Introduction

Type hints transform Python from a purely dynamic language into one with optional static checking. For production RAG systems where function signatures carry embedding vectors, chunk metadata, and retrieval results, type hints prevent entire classes of bugs at CI time rather than runtime. This lesson teaches you to design a gradual typing strategy that catches critical errors without slowing development.

## How It Works

Python's type system is structural rather than nominal -- code that quacks like a `Sequence` passes a `Sequence` check. Gradual typing lets you annotate high-risk surfaces (API boundaries, shared libraries) while leaving internal helpers untyped. mypy enforces this at build time, and you configure strictness per module in `pyproject.toml`.

`Protocol` defines interfaces by what methods an object has, not what class it inherits from. This matters for RAG: you can define an `Embedder` protocol with `embed(texts: list[str]) -> list[list[float]]` and pass any implementation. `ABC` (abstract base class) enforces a hierarchy and lets you share constructor logic; use it when implementations genuinely share state. Overusing ABC leads to deep inheritance trees that are hard to refactor.

`TypedDict` gives you typed dictionaries for API shapes like OpenAI's chat completion response or your own `/retrieve` endpoint payloads. Unlike dataclasses, TypedDicts add zero runtime overhead and work naturally with JSON deserialization. Use them for wire formats and dataclasses for internal domain objects with behavior.

The tradeoff is that expressive types introduce maintenance overhead. A `TypedDict` with 30 fields that mirrors OpenAI's response will break every time the API changes. The pragmatic approach: type only the fields your code actually reads.

## Code Examples

```python
from typing import Protocol, TypedDict, Sequence
from dataclasses import dataclass

# Protocol for any embedding provider
class Embedder(Protocol):
    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        ...

class OpenAIEmbedder:
    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        # actual API call
        ...

# TypedDict for the RAG retrieval result shape
class RetrievalResult(TypedDict):
    chunk_id: str
    content: str
    score: float
    metadata: dict[str, str]

# mypy enforces this at CI: `mypy src/ --strict`
def format_results(results: Sequence[RetrievalResult]) -> str:
    return "\n".join(r["content"] for r in results)
```

```python
# pyproject.toml -- strict for library code, relaxed for scripts
# [tool.mypy]
# strict = true
# [[tool.mypy.overrides]]
# module = "scripts.*"
# ignore_errors = true
```

## Try It Yourself

Take a function in your RAG codebase that accepts a raw `dict` for embedding results. Replace it with a `TypedDict` and run `mypy --strict` against the file. Fix every error until it passes. Then add a `Protocol` for your retriever class and verify that swapping implementations still type-checks.

## Real-World RAG Connection

At scale, a team of three engineers iterating on retrieval logic will produce different return shapes from different branches. mypy in CI catches the mismatch before a PR merges. Without types, the bug surfaces as `KeyError: 'embedding'` in production when one service expects the old shape.

## Common Pitfalls

- **Annotating everything too early.** Start with API boundaries and shared libraries. Typing internal helpers rarely catches bugs but always adds maintenance cost.
- **Using `Any` as an escape hatch.** `Any` silently disables checking for everything it touches. Prefer `object` or a narrow `Protocol` if the true type is unknowable.
- **Forgetting that `TypedDict` is structural.** `{"a": 1, "b": 2}` passes a check for `class T(TypedDict): a: int`. Extra keys are allowed by default. Use `total=True` and explicit fields.

## Next Steps

- Read the mypy docs on gradual typing and the `--strict` flag matrix
- Lesson: **Testing with pytest** for type-checked test fixtures
