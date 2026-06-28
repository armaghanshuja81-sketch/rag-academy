---
id: py_numpy
title: NumPy Basics
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: python
prerequisites: [py_lists]
tags: [python, numpy, arrays]
---

## Concept Introduction

NumPy is the foundation of numerical computing in Python. Its ndarray (N-dimensional array) is the underlying data structure for embeddings — every
embedding vector returned by sentence-transformers is a NumPy array. By the
end of this lesson you'll create arrays, perform vectorized operations, and
compute similarity between embedding vectors.

## How It Works

NumPy arrays store homogeneous data in contiguous memory, enabling vectorized
operations that run at C speed. A Python list of 1000 floats requires 1000
separate Python objects; a NumPy array stores them as a single block of 8000
bytes. Operations broadcast across the entire array without Python loops.

Key concepts for RAG work:
- **Shape**: Dimensions of the array — (384,) for a MiniLM embedding
- **Broadcasting**: Operations between arrays of different shapes "stretch" to
  match, avoiding explicit loops
- **Vectorized math**: `a + b` on two arrays adds element-wise in C
- **dtype**: Data type — `float32` is standard for embeddings (half the memory
  of `float64`, negligible precision loss for similarity search)

## Code Examples

```python
import numpy as np

# Creating arrays — your embedding vectors will look like this
embedding = np.array([0.1, 0.3, 0.5, -0.2], dtype=np.float32)
print(f"Shape: {embedding.shape}, Dtype: {embedding.dtype}")

# Vectorized operations — applied to every element at C speed
normalized = embedding / np.linalg.norm(embedding)
print(f"Normalized: {normalized}")

# Batch operations — 100 vectors processed at once
embeddings_batch = np.random.randn(100, 384).astype(np.float32)
norms = np.linalg.norm(embeddings_batch, axis=1)  # 100 norms, one call
print(f"Mean norm: {norms.mean():.3f}")
```

Cosine similarity between vectors — the most common operation in RAG:

```python
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

vec_a = np.array([0.1, 0.3, 0.5])
vec_b = np.array([0.15, 0.28, 0.52])
print(f"Similarity: {cosine_similarity(vec_a, vec_b):.4f}")

# Batch: query vs 1000 stored vectors
query = np.random.randn(384).astype(np.float32)
stored = np.random.randn(10000, 384).astype(np.float32)
scores = np.dot(stored, query) / (np.linalg.norm(stored, axis=1) * np.linalg.norm(query))
top_5_idx = np.argsort(scores)[-5:][::-1]
print(f"Top 5 indices: {top_5_idx}")
```

## Try It Yourself

Given a batch of 10 embedding vectors (384-dim each) and a query vector,
find the top-3 most similar vectors using only NumPy operations:

```python
import numpy as np
np.random.seed(42)
batch = np.random.randn(10, 384).astype(np.float32)
query = np.random.randn(384).astype(np.float32)

# Normalize everything
batch_norm = batch / np.linalg.norm(batch, axis=1, keepdims=True)
query_norm = query / np.linalg.norm(query)

# Cosine similarity (dot product on normalized vectors)
scores = np.dot(batch_norm, query_norm)
top_3 = np.argsort(scores)[-3:][::-1]
print(f"Top 3 indices: {top_3}, Scores: {scores[top_3]}")
```

## Real-World RAG Connection

Every embedding vector is a NumPy array. When you call `model.encode(text)`,
you get back `np.ndarray`. When FAISS or ChromaDB stores vectors, they're
NumPy arrays under the hood. Understanding array shapes, dtypes, and
vectorized similarity computation is essential for debugging retrieval quality
and writing custom scoring functions.

## Common Pitfalls

- **Pitfall:** `float64` vs `float32` — embedding models output `float32`.
  Converting to `float64` doubles memory usage for no benefit. **Fix:** Use
  `astype(np.float32)` explicitly and check your FAISS/ChromaDB config.
- **Pitfall:** Shape mismatches — `(100, 384)` vs `(384,)` dot product fails.
  **Fix:** Use `.reshape()` or squeeze dimensions, and check shapes with
  `.shape` before operations.
- **Pitfall:** Not normalizing vectors before cosine similarity — the formula
  `dot(a,b)/(norm(a)*norm(b))` is correct, but `dot(a,b)` alone is NOT cosine
  similarity unless vectors are unit length.

## Next Steps

- **Practice:** Implement k-means clustering from scratch in NumPy: randomly
  initialize k centroids, assign each vector to the nearest centroid, recompute
  centroids, repeat until convergence.
- **Read:** [NumPy Quickstart](https://numpy.org/doc/stable/user/quickstart.html)
- **Related:** [embeddings_deep](/lesson/embeddings_deep) — NumPy is the
  substrate for all embedding operations
