---
id: py_clean_code
title: Writing Clean Code
tier: senior
difficulty: advanced
estimated_minutes: 25
module: python
prerequisites: [py_oop]
tags: [python, clean-code, best-practices, solid]
---

## Concept Introduction

Code is read 10x more than it's written. In a RAG pipeline, the next person
reading your retriever code might be you at 3am during a production incident.
Clean code isn't about aesthetics — it's about reducing the time to understand
what code does and whether it's correct. By the end of this lesson you'll
apply PEP 8 conventions, SOLID principles adapted for Python, and patterns
that make RAG pipelines debuggable.

## How It Works

**PEP 8: The non-negotiable baseline.** Four spaces per indent. `snake_case`
for functions and variables, `PascalCase` for classes, `UPPER_CASE` for
constants. Maximum 79 characters per line (88 with Black). Imports grouped:
standard library, third-party, local — each group separated by a blank line.
Use `black` and `isort` — don't argue about formatting, automate it.

**Naming that reduces cognitive load.** A variable name should answer "what
does this contain?" without reading its definition. `chunks` not `data`.
`embedding_model` not `em`. `retrieved_docs` not `result`. If a function
returns a boolean, name it as a question: `is_query_cacheable(query)`. If it
has side effects, use a verb: `index_documents(docs)`.

**Functions should do one thing.** The test is: can you name the function
without using "and"? `embed_and_store()` does two things — it should be
`embed_chunks(chunks)` and `store_embeddings(embeddings)`. Functions that
fit on one screen (~30 lines) are easier to reason about, test, and debug.

**SOLID adapted for Python:**

- **S**ingle Responsibility: A class has one reason to change. A `RAGPipeline`
  that handles ingestion, retrieval, generation, and metrics has four reasons.
  Split into `IngestionPipeline`, `Retriever`, `Generator`, `MetricsCollector`.
- **O**pen/Closed: Extend behavior without modifying existing code. A
  `Retriever` base class with a `search()` method lets you add `HybridRetriever`
  without touching the orchestration code.
- **L**iskov Substitution: Subclasses must be usable anywhere the parent is
  expected. If `CacheRetriever.search()` sometimes returns `None` when
  `Retriever.search()` always returns a list, callers break.
- **I**nterface Segregation: Don't force clients to depend on methods they
  don't use. Split a `VectorStore` interface into `VectorWriter` and
  `VectorReader` if some consumers only search.
- **D**ependency Inversion: Depend on abstractions, not concretions. Pass an
  `EmbeddingModel` protocol to your `Retriever`, not a specific
  `SentenceTransformer` instance. You can swap models without changing the
  retriever.

**RAG-specific clean code patterns:**

- **Configuration over hardcoding**: `top_k`, `chunk_size`, `model_name`, and
  `temperature` go in a config dataclass or YAML file. Never buried 200 lines
  deep in a function.
- **Explicit data flow**: A chunk goes through `loader -> splitter -> embedder
  -> store`. Make each stage a function that takes one type and returns another.
  If you can't trace a single chunk through the pipeline in your head, the code
  needs restructuring.
- **Fail loudly**: If a document fails to embed, log the document ID, the error,
  and whether it's retryable. Silently skipping documents creates retrieval gaps
  you'll never detect.

## Code Examples

Before: a RAG function doing too much.

```python
def do_rag(query, docs):
    from sentence_transformers import SentenceTransformer
    import chromadb
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path="./db")
    collection = client.get_or_create_collection("docs")
    q_emb = model.encode(query).tolist()
    results = collection.query(query_embeddings=[q_emb], n_results=3)
    context = " ".join(results["documents"][0])
    from openai import OpenAI
    llm = OpenAI()
    resp = llm.chat.completions.create(model="gpt-4o", messages=[
        {"role": "system", "content": f"Answer using: {context}"},
        {"role": "user", "content": query}
    ])
    return resp.choices[0].message.content
```

After: separated concerns, testable units.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class RAGConfig:
    embedding_model: str = "all-MiniLM-L6-v2"
    top_k: int = 3
    llm_model: str = "gpt-4o"
    db_path: str = "./chroma_data"

class Retriever:
    def __init__(self, embedder, vector_store, config: RAGConfig):
        self._embedder = embedder
        self._store = vector_store
        self._config = config

    def retrieve(self, query: str) -> list[str]:
        embedding = self._embedder.encode(query)
        results = self._store.query(embedding, self._config.top_k)
        return results

class Generator:
    def __init__(self, llm, config: RAGConfig):
        self._llm = llm
        self._config = config

    def generate(self, query: str, context: list[str]) -> str:
        prompt = self._build_prompt(query, context)
        return self._llm.complete(prompt)

    def _build_prompt(self, query: str, context: list[str]) -> str:
        joined = "\n\n".join(context)
        return f"Answer the question using only the context below.\n\nContext:\n{joined}\n\nQuestion: {query}"
```

## Try It Yourself

Find the longest function in your current RAG project. If it's over 30 lines,
extract one responsibility into its own function. Run your tests. If they pass,
extract another. Stop when each function does exactly one thing. Then add type
hints to every function signature. Then run `black` and `isort`. Compare: how
much faster can you explain the refactored code to a colleague?

## Real-World RAG Connection

A production RAG system at a legal-tech company had a single 400-line
`process_query()` function. When retrieval latency spiked, debugging took hours
because no one could isolate whether the problem was in embedding, vector
search, reranking, or prompt assembly. After refactoring into four classes with
clear interfaces, they identified the bottleneck (a slow cross-encoder) in 10
minutes. Clean code is a debugging accelerator.

## Common Pitfalls

- **Pitfall:** Over-engineering — creating an `AbstractEmbeddingStrategyFactory`
  when you have one embedding model. **Fix:** Start simple. Abstract only when
  you have three concrete examples of the same pattern. YAGNI (You Aren't Gonna
  Need It) is a clean code principle too.
- **Pitfall:** Comments that explain what the code does instead of why.
  `# Increment counter by 1` on `count += 1` is noise. `# Counter must be
  incremented BEFORE the yield to avoid off-by-one in streaming` is valuable.
  **Fix:** Delete what-comments. Keep why-comments.
- **Pitfall:** Using mutable types as default arguments. `def search(query,
  filters=[])` shares the same list across all calls. **Fix:** Use `None` and
  initialize inside: `filters = filters or []`.

## Next Steps

- **Read:** [py_type_hints](/lesson/py_type_hints) — add static type checking
  to your clean code
- **Read:** [py_testing](/lesson/py_testing) — clean code is testable code;
  learn to write tests that don't break on every refactor
- **Tool:** Install `black`, `isort`, and `ruff` in your project and configure
  pre-commit hooks
