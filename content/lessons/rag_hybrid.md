---
id: rag_hybrid
title: Hybrid Search
tier: senior
difficulty: advanced
estimated_minutes: 25
module: retrieval
prerequisites: [db_pgvector]
tags: [hybrid-search, bm25, rrf, retrieval, fusion]
---

## Concept Introduction

Pure vector search fails on exact queries -- part numbers, legal citations, error codes -- where semantic similarity is meaningless. Pure keyword search fails on conceptual queries -- "how do I improve database performance" vs "postgres slow query" -- where vocabulary mismatch hides relevant documents. Hybrid search fuses both signals, and the fusion strategy matters more than either individual retriever. This lesson covers fusion algorithms, weighting, and when to bias toward keyword vs semantic.

## How It Works

The two retrievers operate independently: a sparse retriever (BM25 with an inverted index) ranks documents by term frequency, and a dense retriever (embeddings + cosine similarity) ranks by semantic proximity. The fusion step merges two differently-scaled score distributions into a single ranking. Naively normalizing to [0,1] and linearly combining works poorly because score distributions are rarely uniform -- BM25 scores cluster near 0 with a long tail, while cosine scores are tightly packed between 0.7 and 1.0.

Reciprocal Rank Fusion (RRF) sidesteps score scaling entirely. It uses ranks, not raw scores: `RRF(d) = sum(1 / (k + rank_i(d)))` for each retriever i. The constant `k` (typically 60) dampens the contribution of very high ranks. RRF requires zero score normalisation, handles any number of retrievers, and consistently outperforms linear combination in benchmarks. The tradeoff: you lose score interpretability. A result with RRF=0.95 tells you nothing about retrieval confidence; a cosine score of 0.92 does.

Weighting strategies depend on the query type. For open-ended questions ("explain how X works"), weight dense retrieval higher (0.7-0.8) because semantic understanding dominates. For fact lookup ("What is the max file size for uploads?"), weight sparse retrieval higher (0.6-0.7) because exact keyword match matters. The most robust approach: run a lightweight query classifier (zero-shot LLM or rule-based) that detects whether the query is factual or conceptual, then adjusts weights per-query.

## Code Examples

```python
from rank_bm25 import BM25Okapi

def bm25_retrieve(query: str, corpus: list[str], k: int = 20) -> list[tuple[str, float]]:
    tokenized = [doc.lower().split() for doc in corpus]
    bm25 = BM25Okapi(tokenized)
    scores = bm25.get_scores(query.lower().split())
    ranked = sorted(zip(corpus, scores), key=lambda x: x[1], reverse=True)
    return ranked[:k]

def reciprocal_rank_fusion(ranked_lists: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranked in ranked_lists:
        for rank, doc in enumerate(ranked, start=1):
            scores[doc] = scores.get(doc, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

# Query-time weighting via adjusting each retriever's k before fusion
dense_results = dense_retrieve(query, k=50)  # more candidates from dense
sparse_results = bm25_retrieve(query, corpus, k=20)  # fewer from sparse
fused = reciprocal_rank_fusion([dense_results, sparse_results])
```

## Try It Yourself

Build a mini search engine over 1,000 Wikipedia article snippets. Index them with sentence-transformers for dense retrieval and BM25 for sparse. Pick 20 queries: 10 conceptual and 10 factual. Benchmark each retriever alone and RRF-fused against a simple relevance judgment (did the top-5 contain a relevant doc?). Verify that RRF outperforms either retriever alone.

## Real-World RAG Connection

A customer support RAG system for a SaaS product handles "I can't reset my password" (best served by exact keyword match to the password-reset article) and "How do I interpret the analytics dashboard?" (best served by semantic retrieval of multiple related articles). Hybrid search with query-type detection routes each query to the dominant signal without requiring the user to know which search mode to use.

## Common Pitfalls

- **Fusing raw scores directly.** BM25 returns values from 0 to ~50; cosine similarity returns 0 to 1. Linear combination without normalisation gives BM25 overwhelming weight.
- **Using the same `k` for all retrievers.** If dense retrieval returns 20 candidates and sparse returns 100, RRF penalizes sparse candidates that rank 21-100. Give each retriever the same candidate count.
- **Ignoring latency.** Running two full retrieval pipelines doubles query-time compute. Mitigate with parallel execution (asyncio.gather) and smaller candidate sets.

## Next Steps

- Paper: "Reciprocal Rank Fusion outperforms Condorcet and individual rank learning methods"
- Lesson: **Reranking & Cross-Encoders** for refining fused results
