---
id: py_oop
title: Classes & OOP
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: python
prerequisites: [py_functions, py_dicts]
tags: [python, oop, classes]
---

## Concept Introduction

Object-Oriented Programming organizes code around data and the operations on
that data. When your RAG pipeline has retriever, generator, and evaluator
components that share configuration and state, classes are the natural
organizing principle. By the end of this lesson you'll design classes with
`__init__`, methods, properties, and inheritance.

## How It Works

A class is a blueprint. An object (instance) is a specific realization. The
`__init__` method runs when an object is created and sets initial state.
Methods are functions attached to the class that receive `self` (the instance)
as their first argument.

The `self` parameter is explicit in Python — it refers to the specific
instance the method was called on. Instance variables are set via `self.x`;
class variables are shared across all instances.

Inheritance lets you build specialized versions of a base class. A
`HybridRetriever(VectorRetriever)` inherits all methods from `VectorRetriever`
and adds or overrides behavior. Composition ("has-a") is often better than
inheritance ("is-a") — a RAG pipeline HAS a retriever, it ISN'T a retriever.

## Code Examples

A RAG pipeline as a class:

```python
class RAGPipeline:
    def __init__(self, embedding_model="all-MiniLM-L6-v2", top_k=3):
        self.embedding_model = embedding_model
        self.top_k = top_k
        self.documents = []

    def index(self, texts):
        self.documents = texts
        print(f"Indexed {len(texts)} documents")

    def retrieve(self, query):
        return self.documents[:self.top_k]

    def generate(self, query, context):
        return f"Answer based on: {' | '.join(context)}"

    def query(self, question):
        context = self.retrieve(question)
        return self.generate(question, context)

rag = RAGPipeline(top_k=2)
rag.index(["RAG = Retrieval-Augmented Generation", "Embeddings are vectors"])
print(rag.query("What is RAG?"))
```

Inheritance vs composition:

```python
# Inheritance: a specialized retriever IS a base retriever
class BaseRetriever:
    def search(self, q): return []

class VectorRetriever(BaseRetriever):
    def search(self, q): return [f"Vector result for {q}"]

# Composition: a pipeline HAS retrievers (better for RAG)
class Pipeline:
    def __init__(self):
        self.vector_retriever = VectorRetriever()
        self.keyword_retriever = BaseRetriever()

    def hybrid_search(self, q):
        vec_results = self.vector_retriever.search(q)
        kw_results = self.keyword_retriever.search(q)
        return vec_results + kw_results
```

## Try It Yourself

Design a `DocumentStore` class that wraps ChromaDB: `__init__` takes a
persist path, `add()` takes text + metadata, `search()` takes a query and
top_k. Stub out the ChromaDB calls (you'll wire them up in a later lesson):

```python
class DocumentStore:
    def __init__(self, persist_path="./chroma_data"):
        self.path = persist_path
        self._storage = {}

    def add(self, text, metadata=None):
        doc_id = str(hash(text))
        self._storage[doc_id] = {"text": text, "metadata": metadata or {}}
        return doc_id

    def search(self, query, top_k=3):
        return list(self._storage.values())[:top_k]
```

## Real-World RAG Connection

Production RAG libraries are built on OOP. LangChain's `BaseRetriever`,
LlamaIndex's `BaseIndex`, ChromaDB's `Collection` — all classes. Understanding
OOP means you can read their source code, extend them, and debug them.

## Common Pitfalls

- **Pitfall:** Deep inheritance hierarchies — `class MyRetriever(ChromaRetriever, BM25Retriever, CacheMixin)` is a debugging nightmare. **Fix:** Prefer composition. Pass dependencies to `__init__`.
- **Pitfall:** Mutable class variables — `class C: items = []` is shared
  across all instances. **Fix:** Define mutable defaults in `__init__`.
- **Pitfall:** Forgetting `self` in method definitions causes `TypeError`.
  **Fix:** Every instance method's first parameter must be `self`.

## Next Steps

- **Practice:** Refactor the `RAGPipeline` class above to accept a retriever
  and generator as `__init__` parameters (dependency injection). Test with
  mock retrievers.
- **Read:** [Python Classes](https://docs.python.org/3/tutorial/classes.html)
- **Related:** [langchain_chains](/lesson/langchain_chains) — LangChain's
  class hierarchy in practice
