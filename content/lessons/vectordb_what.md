---
id: vectordb_what
title: What are Vector Databases?
tier: junior
difficulty: beginner
estimated_minutes: 15
module: vector-databases
prerequisites: [py_lists, embeddings]
tags: [vector-database, embeddings, similarity-search]
---

## Concept Introduction

A regular database finds exact matches: "get the row where name = 'Alice'."
A vector database finds similar items: "get the 5 chunks most semantically
similar to this question." By the end of this lesson you'll understand what
vectors are, how similarity search works, and why vector databases are the
engine at the heart of RAG.

## How It Works

An embedding is a list of floats (a vector) that represents the meaning of a
text passage. Texts with similar meanings have similar vectors — their vectors
are close together in high-dimensional space. "Cat" and "kitten" are nearby;
"cat" and "automobile" are far apart.

A vector database stores these vectors and provides fast approximate nearest
neighbor (ANN) search. When you query with a new vector, the database finds
the stored vectors closest to it — typically in milliseconds, even across
millions of vectors. This is the Retrieval step in RAG.

Popular vector databases:
- **ChromaDB**: Open-source, runs locally, auto-embeds text
- **FAISS**: Meta's library, extremely fast, manual embedding
- **Pinecone**: Managed cloud service, zero ops
- **Weaviate**: Open-source with built-in vectorization modules

## Code Examples

ChromaDB — the simplest starting point:

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("my_docs")

# Add documents (Chroma auto-embeds them)
collection.add(
    documents=[
        "RAG combines retrieval with text generation",
        "Python is a programming language",
        "Embeddings are numerical text representations"
    ],
    ids=["doc1", "doc2", "doc3"]
)

# Search by meaning — not keywords
results = collection.query(query_texts=["How does RAG work?"], n_results=2)
print(results["documents"])   # doc1 ranked highest
print(results["distances"])   # Similarity scores (lower = more similar)
```

Manual embedding with FAISS — more control:

```python
import numpy as np

# Imagine these are real embeddings (768 floats each)
embeddings = np.random.randn(5, 768).astype("float32")

# FAISS index for similarity search
import faiss
index = faiss.IndexFlatL2(768)  # L2 distance
index.add(embeddings)

# Search: find top-3 most similar to a query vector
query = np.random.randn(1, 768).astype("float32")
distances, indices = index.search(query, k=3)
print(f"Closest vectors: {indices[0]}")     # [2, 0, 4] — indices
print(f"Distances: {distances[0]}")
```

## Try It Yourself

Create a ChromaDB collection with 5 short documents on different topics. Query
with 3 different questions and observe which documents match:

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("knowledge_base")

docs = [
    "The Eiffel Tower is in Paris, France.",
    "Python was created by Guido van Rossum in 1991.",
    "The mitochondria is the powerhouse of the cell.",
    "RAG stands for Retrieval-Augmented Generation.",
    "Water boils at 100 degrees Celsius at sea level."
]
collection.add(documents=docs, ids=[f"d{i}" for i in range(len(docs))])

# Test queries
for q in ["What is RAG?", "Who created Python?", "Where is the Eiffel Tower?"]:
    results = collection.query(query_texts=[q], n_results=1)
    print(f"Q: {q}")
    print(f"  → {results['documents'][0][0]}")
```

## Real-World RAG Connection

The vector database is the "R" in RAG — the Retrieval engine. When a user asks
"What's our refund policy?", their query is embedded into a vector, the vector
database finds the 5 most similar document chunks across your entire knowledge
base, and those chunks are passed to the LLM. Without a vector database, you'd
scan every document on every query — fine for 10 documents, impossible for
10,000.

## Common Pitfalls

- **Pitfall:** Different embedding models for indexing and querying. A vector
  from `text-embedding-3-small` can't be compared to one from `all-MiniLM-L6-v2`.
  **Fix:** Store the embedding model name alongside your data.
- **Pitfall:** Using the wrong distance metric. Cosine similarity works for
  most embeddings; Euclidean (L2) can give different rankings. **Fix:** Check
  your embedding model's documentation for the recommended metric.
- **Pitfall:** Not normalizing vectors before comparison. **Fix:** Most
  libraries (ChromaDB, FAISS) handle this, but if computing manually, use
  `sklearn.metrics.pairwise.cosine_similarity`.

## Next Steps

- **Practice:** Install ChromaDB (`pip install chromadb`), run the ChromaDB
  example above, then add 5 of your own documents and run 3 queries.
- **Read:** [ChromaDB Documentation](https://docs.trychroma.com/)
- **Related:** [rag_what](/lesson/rag_what) — see how the vector database
  fits into the full RAG pipeline
