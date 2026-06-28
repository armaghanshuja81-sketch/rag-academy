---
id: rag_rerank
title: Reranking & Cross-Encoders
tier: senior
difficulty: advanced
estimated_minutes: 25
module: retrieval
prerequisites: [rag_hybrid]
tags: [reranking, cross-encoder, cohere, retrieval, latency]
---

## Concept Introduction

Retrieval embeddings are fast but imprecise -- they compress an entire document into a single vector and compare at arm's length. Cross-encoders read the query and document together, producing a relevance score that accounts for term overlap, negation, and context that bi-encoders miss. Reranking is the standard production pattern: retrieve 50-100 candidates cheaply with embeddings, then rerank the top N with a cross-encoder. This lesson covers when reranking is worth the cost, how to tune the depth-vs-latency tradeoff, and when to skip reranking entirely.

## How It Works

A bi-encoder (standard embedding model) encodes the query and each document independently into vectors, then computes cosine similarity. This enables pre-computing document embeddings and fast approximate nearest neighbor search. A cross-encoder passes the concatenated `[query, document]` pair through a transformer simultaneously, letting attention heads compare every token in the query with every token in the document. The result is dramatically more accurate but 100-1000x slower per document comparison.

The architecture pattern: retrieve top-K (K=100-200) with a bi-encoder, then feed the top-N (N=10-30) through a cross-encoder. K controls recall ceiling; N controls latency and cost. If the relevant document ranks at position 80 in the bi-encoder results and you set N=20, reranking cannot help -- the document never reaches the cross-encoder. Your retrieval K must be large enough to reliably include the correct document within the top K.

Cohere Rerank is a hosted option: $0.001 per search for 100 documents, sub-100ms latency, no GPU to manage. `sentence-transformers` CrossEncoder runs locally on your GPU: zero API cost but slower per document and you manage the model. The hosted route makes sense below ~1M queries/month. Above that volume, the local model's fixed infrastructure cost beats per-query pricing.

When NOT to rerank: (1) latency budget is under 200ms total, (2) initial retrieval consistently puts the correct document in position 1-3 (high-precision use case like FAQ matching), (3) batch processing where per-query cost dominates and reranking adds 30% to the bill without moving the needle on downstream task accuracy.

## Code Examples

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=512)

def rerank(query: str, candidates: list[str], top_k: int = 10) -> list[tuple[str, float]]:
    pairs = [[query, doc] for doc in candidates]
    scores = model.predict(pairs)  # higher = more relevant
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]

# Production pattern: retrieve wide, rerank narrow
coarse_results = dense_retriever.search(query, k=100)  # bi-encoder
candidates = [r.content for r in coarse_results[:30]]
final = rerank(query, candidates, top_k=5)
```

```python
# Cohere Rerank via API (no self-hosted GPU needed)
import cohere
co = cohere.Client("your-api-key")
results = co.rerank(
    query="how to configure load balancing",
    documents=[r.content for r in coarse_results[:50]],
    top_n=5,
    model="rerank-english-v3.0",
)
```

## Try It Yourself

Take your existing retriever and measure its recall@K for K in [5, 10, 20, 50, 100]. Then add a cross-encoder reranker and measure the same metric. You should see the bi-encoder's recall@100 roughly equal the reranker's recall@5 -- that is the point: narrow, precise results saved from a wide, noisy retrieval.

## Real-World RAG Connection

An enterprise search system over 2 million internal documents retrieves 200 candidates via pgvector (50ms), reranks the top 30 with a local CrossEncoder on a T4 GPU (120ms), and returns the top 10. Total latency: 180ms. Without reranking, the top-10 results would contain relevant documents only 72% of the time; with reranking, 94%.

## Common Pitfalls

- **Reranking with a mismatched model.** A cross-encoder fine-tuned on MS MARCO (web search) performs poorly on legal or medical text. Check the training domain of your reranker model.
- **Setting N too close to K.** If K=50 and N=40, you might as well not bother with the bi-encoder stage. The whole point is that N << K.
- **Ignoring the max token length.** Cross-encoders often have 512-token limits. Pass full documents through and they get silently truncated, producing meaningless scores. Chunk or truncate explicitly with logging.

## Next Steps

- sentence-transformers documentation on available cross-encoder models
- Lesson: **Multi-Hop Retrieval** for queries that need chained lookups
