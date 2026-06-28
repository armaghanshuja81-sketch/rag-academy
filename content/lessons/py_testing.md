---
id: py_testing
title: Testing with pytest
tier: senior
difficulty: advanced
estimated_minutes: 25
module: python-foundations
prerequisites: [py_type_hints]
tags: [python, pytest, testing, mocking, vcr]
---

## Concept Introduction

Testing RAG pipelines presents a unique challenge: you are asserting on non-deterministic LLM outputs against live APIs that cost money and add latency. This lesson covers patterns for fast, deterministic RAG tests using pytest fixtures, parametrize, mock strategies, and VCR-based API replay so your test suite runs in seconds, not minutes.

## How It Works

pytest fixtures replace `setUp`/`tearDown` with dependency injection. A fixture that creates a temporary SQLite database or a local ChromaDB collection is automatically injected into any test that requests it by name. You control fixture scope: `function` (default, fresh per test), `module` (shared across tests in a file), or `session` (created once). For RAG, keep vector stores at `module` scope to amortise expensive indexing across multiple retrieval tests.

`parametrize` lets you run the same test logic against multiple inputs without writing loops. For a reranker, you would parametrize across different score thresholds and assert that precision and recall stay within acceptable ranges. The key tradeoff: parametrize increases test count multiplicatively, so limit each parametrize dimension to the equivalence classes that actually exercise different code paths.

For mocking, `unittest.mock.patch` is built-in but verbose. `pytest-mock` provides a `mocker` fixture with a cleaner API: `mocker.patch("module.fn", return_value=...)`. Mock at the network boundary -- patch `httpx.AsyncClient.post` rather than your internal `call_llm` function -- so your application logic still runs under test.

`vcr.py` records real HTTP interactions once and replays them from disk thereafter. This is ideal for testing against OpenAI or Cohere: run once with a real API key to record cassettes, then CI replays them with zero cost and zero latency. The tradeoff: cassettes drift as API responses change. Rotate cassettes on a schedule.

## Code Examples

```python
import pytest
from pathlib import Path

@pytest.fixture(scope="module")
def vector_store(tmp_path_factory):
    """Create a ChromaDB collection once per module. Expensive indexing
    happens here so individual tests only read."""
    import chromadb
    client = chromadb.PersistentClient(path=str(tmp_path_factory.mktemp("chroma")))
    collection = client.create_collection("test_docs")
    collection.add(documents=["doc1", "doc2"], ids=["1", "2"])
    return collection

def test_retrieval_basic(vector_store):
    results = vector_store.query(query_texts=["test"], n_results=2)
    assert len(results["documents"][0]) == 2
```

```python
@pytest.mark.parametrize("threshold,expected_min_results", [
    (0.9, 0),   # strict: nothing passes
    (0.5, 2),   # moderate
    (0.0, 5),   # no filter
])
def test_score_threshold(retriever, threshold, expected_min_results):
    results = retriever.retrieve("query", score_threshold=threshold)
    assert len(results) >= expected_min_results
```

```python
@pytest.mark.vcr(record_mode="once")
def test_openai_embedding():
    """First run records to cassette. Subsequent runs replay instantly."""
    from openai import OpenAI
    client = OpenAI()
    resp = client.embeddings.create(model="text-embedding-3-small", input=["test"])
    assert len(resp.data[0].embedding) == 1536
```

## Try It Yourself

Write a `conftest.py` with a `module`-scoped fixture that spins up a local ChromaDB (or LanceDB) collection with 100 documents. Then write a parametrized test that varies `n_results` across 1, 5, and 10, asserting the returned list length. Finally, add a `vcr.py` test for your actual embedding API call.

## Real-World RAG Connection

A production RAG system with 200 tests hitting OpenAI embeddings at each CI run would cost roughly $0.50 per push and take 3 minutes. With vcr.py cassettes rotated weekly, the same suite runs in 8 seconds at zero cost.

## Common Pitfalls

- **Mocking too deeply.** If you mock the retriever itself, you are not testing the retriever. Mock only the network layer.
- **Session-scoped fixtures that carry state.** A test that modifies the fixture's data will poison the next test. Use `module` scope and never mutate in tests.
- **vcr.py cassette bloat.** Committing 50MB cassette files to git slows every clone. Store cassettes in a separate LFS-tracked directory or rotate aggressively.

## Next Steps

- pytest documentation on fixtures and conftest.py sharing
- Lesson: **Async Python & asyncio** for testing async RAG code
