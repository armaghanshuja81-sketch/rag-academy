---
id: faiss
title: FAISS Vector Search
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: vector_dbs
prerequisites: [vectordb_what, embeddings_deep]
tags: [faiss, vector-search, similarity, embeddings]
---

## Concept Introduction

FAISS (Facebook AI Similarity Search) is Meta's library for fast nearest-neighbor search over dense vectors. When your RAG pipeline has millions of document chunks, scanning every vector linearly is too slow. FAISS indexes your embeddings so queries return the top-k results in microseconds instead of seconds. By the end of this lesson you'll build a FAISS index from embedding vectors, run similarity searches, and choose the right index type for your data scale.

## How It Works

FAISS doesn't store documents or metadata — it is purely a vector index. You build an index by adding NumPy arrays (your embedding vectors), then search by providing a query vector and asking for the k nearest neighbors. Under the hood, FAISS partitions the vector space so most of the index can be skipped during search.

Three index types cover 90% of RAG use cases:

- **Flat (IndexFlatIP / IndexFlatL2):** Brute-force. Every query compares against every stored vector. 100% accurate, linear in N. Use when you have fewer than 10,000 vectors and latency is irrelevant.
- **IVF (IndexIVFFlat):** Inverted File index. Clusters vectors into Voronoi cells using k-means. Search only probes the nearest cells. 10-100x faster than Flat, >95% recall with enough probes. The go-to for 10K to 10M vectors.
- **HNSW (IndexHNSWFlat):** Hierarchical Navigable Small World graph. Builds a multi-layer graph where traversal jumps between neighbors. Fastest search at scale, highest memory cost. Use when query latency is critical and you can afford the RAM.

FAISS also supports GPU acceleration by moving the index to CUDA memory. For indexes under 1M vectors this is rarely worth the complexity; for 10M+, GPU indexes cut search time by 5-20x.

## Code Examples

Install FAISS and sentence-transformers together — the CPU version is fine for learning:

```bash
pip install faiss-cpu sentence-transformers numpy
```

Build a Flat index and search it:

```python
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

# 100 documents → 384-dim embeddings
docs = [f"This is document number {i} about RAG pipelines." for i in range(100)]
embeddings = model.encode(docs).astype(np.float32)

# Build Flat index — full scan, perfect recall
dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)  # Inner product = cosine on normalized vectors
faiss.normalize_L2(embeddings)   # Normalize in-place for cosine similarity
index.add(embeddings)
print(f"Index contains {index.ntotal} vectors")
```

Search with a query:

```python
query = model.encode(["How does RAG retrieval work?"]).astype(np.float32)
faiss.normalize_L2(query)

k = 5
distances, indices = index.search(query, k)
for rank, (idx, dist) in enumerate(zip(indices[0], distances[0])):
    print(f"  #{rank+1}: doc[{idx}] score={dist:.4f} -> {docs[idx][:60]}...")
```

Switch to IVF for speed at scale. IVF requires training on your data to learn cluster centers, then you add vectors and search by probing the nearest clusters:

```python
nlist = 10  # Number of clusters (rule of thumb: sqrt(N))
quantizer = faiss.IndexFlatIP(dim)
ivf_index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
ivf_index.train(embeddings)       # Learn cluster centroids
ivf_index.add(embeddings)
ivf_index.nprobe = 3              # Search 3 nearest clusters
distances, indices = ivf_index.search(query, k)
```

## Try It Yourself

Generate 5,000 random 384-dim vectors, build both Flat and IVF indices, and compare search speed and accuracy:

```python
import time

np.random.seed(42)
N = 5000
data = np.random.randn(N, 384).astype(np.float32)
faiss.normalize_L2(data)
query_vec = np.random.randn(1, 384).astype(np.float32)
faiss.normalize_L2(query_vec)

# Flat baseline
flat = faiss.IndexFlatIP(384)
flat.add(data)
t0 = time.perf_counter()
d_flat, i_flat = flat.search(query_vec, 10)
flat_time = time.perf_counter() - t0

# IVF
nlist = int(np.sqrt(N))
q = faiss.IndexFlatIP(384)
ivf = faiss.IndexIVFFlat(q, 384, nlist, faiss.METRIC_INNER_PRODUCT)
ivf.train(data)
ivf.add(data)
ivf.nprobe = 5
t0 = time.perf_counter()
d_ivf, i_ivf = ivf.search(query_vec, 10)
ivf_time = time.perf_counter() - t0

# Recall: how many top-10 from IVF overlap with Flat?
overlap = len(set(i_flat[0]) & set(i_ivf[0]))
print(f"Flat: {flat_time*1000:.2f}ms | IVF: {ivf_time*1000:.2f}ms | Recall@10: {overlap}/10")
```

## Real-World RAG Connection

The retrieval step of every RAG pipeline hits a vector index. When a user asks "What's the warranty on the X200?", the system encodes the question, normalizes it, and calls `index.search(query_vec, k)`. If you chose Flat with 5M vectors, this search takes 200ms and your user waits. If you chose IVF with `nprobe=16`, it takes 8ms with 97% recall. Choose the wrong index type and your RAG app feels broken — either too slow to use, or fast but returning irrelevant chunks that the LLM hallucinates from.

## Common Pitfalls

- **Pitfall:** Using IndexFlatL2 (Euclidean distance) for cosine similarity search without normalizing vectors. FAISS IP = cosine only when vectors are unit length. **Fix:** Always call `faiss.normalize_L2()` on both your stored vectors and query before using IndexFlatIP.
- **Pitfall:** Forgetting to train an IVF index before adding vectors. FAISS raises an opaque error. **Fix:** IVF indexes require `index.train(vectors)` before `index.add(vectors)` — training learns the cluster centroids; skip this only for Flat and HNSW.
- **Pitfall:** Setting `nprobe` too low for IVF. The default is 1, which probes only the single nearest cluster and misses relevant results. **Fix:** Set `nprobe` between 5 and 20 for typical RAG use; increase until recall stops improving.

## Next Steps

- **Practice:** Build an IVF index on 10,000 real sentence-transformer embeddings from a text corpus. Vary `nlist` from 10 to 500 and measure recall@10 vs Flat at each setting.
- **Read:** [FAISS Wiki — Guidelines to choose an index](https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index)
- **Related:** [rag_pipeline_full](/lesson/rag_pipeline_full) — replace the ChromaDB retriever with a FAISS index and compare latency
