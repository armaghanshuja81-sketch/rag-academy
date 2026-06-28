---
id: advanced_rag
title: Advanced RAG Overview
tier: senior
difficulty: advanced
estimated_minutes: 25
module: rag
prerequisites: [rag_pipeline_full]
tags: [rag, advanced, architecture, production]
---

## Concept Introduction

Naive RAG — embed everything, retrieve top-k, stuff into a prompt — works for
demos. It fails in production. Queries that need information from multiple
documents return fragments. Irrelevant chunks pollute the context window.
Latency spikes under load. By the end of this lesson you'll understand the
advanced RAG patterns that solve these failures and when to apply each one.

## How It Works

Advanced RAG is not one technique — it's a family of improvements layered onto
the basic retrieve-augment-generate pipeline. Each layer addresses a specific
failure mode.

**The failure modes naive RAG doesn't handle:**

| Failure | Example | Solution |
|---------|---------|----------|
| Low precision | Top-5 chunks include 3 irrelevant ones | Reranking, hybrid search |
| Low recall | The answer exists in chunk #12, but you only returned top-5 | Multi-hop, query transformation |
| Stale information | The indexed docs are 2 weeks old | Streaming ingestion, cache invalidation |
| Ambiguous queries | "How do I reset it?" — what is "it"? | Query rewriting, step-back prompting |
| Multi-document answers | "Compare the pricing across plans" | Parent document retriever, multi-query |
| Latency budget blown | Embedding + vector search + LLM = 3+ seconds | Semantic caching, streaming |

**The advanced RAG stack (layered architecture):**

```
User Query
  │
  ├─► Query Transformation (rewrite, expand, decompose)
  │
  ├─► Hybrid Retrieval (dense vectors + sparse BM25)
  │
  ├─► Reranking (cross-encoder scores top-N candidates)
  │
  ├─► Parent Document Retrieval (expand chunks to full context)
  │
  ├─► Prompt Assembly (dynamic few-shot, citation formatting)
  │
  └─► Streaming Generation (token-by-token with source attribution)
```

Each layer is optional. Add layers only when you measure a specific failure
mode. Don't build the full stack on day one — start with naive RAG, measure
where it breaks, then add the layer that fixes that specific break.

**When to add each pattern:**

- **Hybrid search**: When vector search misses exact keyword matches (product
  codes, legal citations, error messages)
- **Reranking**: When relevant chunks are retrieved but buried below irrelevant
  ones in the top-k
- **Query transformation**: When users write ambiguous, short, or poorly-formed
  queries (always in production)
- **Parent document retriever**: When chunks are too small to contain complete
  answers
- **Semantic caching**: When 30%+ of queries are semantically similar to
  previous queries (common in customer support)
- **Multi-hop retrieval**: When answers require information spread across
  multiple documents
- **Streaming**: Always — users perceive streaming as 2x faster even at the
  same total latency

## Code Examples

The advanced RAG pipeline as composable functions:

```python
from typing import list

class AdvancedRAG:
    def __init__(self, vector_store, bm25_index, cross_encoder, llm, cache):
        self.vector_store = vector_store
        self.bm25 = bm25_index
        self.reranker = cross_encoder
        self.llm = llm
        self.cache = cache

    def query(self, q: str, top_k: int = 20, rerank_k: int = 5) -> dict:
        # Layer 1: Check semantic cache
        cached = self.cache.lookup(q, threshold=0.92)
        if cached:
            return {"answer": cached, "source": "cache"}

        # Layer 2: Query transformation
        queries = self._expand_queries(q)  # Original + HyDE + step-back

        # Layer 3: Hybrid retrieval
        candidates = self._hybrid_retrieve(queries, top_k)

        # Layer 4: Rerank
        ranked = self._rerank(q, candidates, rerank_k)

        # Layer 5: Parent document expansion
        contexts = self._expand_to_parents(ranked)

        # Layer 6: Generate with citations
        answer = self._generate(q, contexts)

        # Store in cache
        self.cache.store(q, answer)
        return {"answer": answer, "contexts": contexts, "source": "generated"}

    def _expand_queries(self, q: str) -> list[str]:
        hyde = self.llm.generate(
            f"Write a paragraph answering: {q}"
        )
        step_back = self.llm.generate(
            f"Generate a more general version of this question: {q}"
        )
        return [q, hyde, step_back]

    def _hybrid_retrieve(self, queries: list[str], k: int) -> list[dict]:
        dense_results = []
        for q in queries:
            dense_results.extend(self.vector_store.search(q, k // len(queries)))
        sparse_results = self.bm25.search(" ".join(queries), k)
        return self._reciprocal_rank_fusion(dense_results, sparse_results)
```

## Try It Yourself

Take your existing naive RAG pipeline and add exactly one advanced layer:
reranking. Measure precision@5 before and after on 50 real queries. If
precision improves by >10%, keep the change. If not, revert and try hybrid
search instead. The discipline is: measure first, layer second. Never add
complexity without a metric that proves it helped.

## Real-World RAG Connection

A customer support RAG system at a SaaS company had 72% answer accuracy with
naive RAG. Adding hybrid search (+BM25 for product SKUs and error codes)
brought it to 81%. Adding reranking brought it to 87%. Adding query
transformation (HyDE for vague queries) brought it to 91%. Each layer had a
measurable, monotonic improvement. They stopped at three layers because the
fourth (multi-hop) showed no improvement on their query distribution.

## Common Pitfalls

- **Pitfall:** Building the entire advanced stack before shipping. You'll spend
  months optimizing problems you don't have. **Fix:** Ship naive RAG first.
  Collect real queries. Measure failures. Add one layer. Remeasure. Repeat.
- **Pitfall:** Over-indexing on a single metric. Precision at k=5 doesn't
  capture whether the answer was actually correct. **Fix:** Track at least
  three: a retrieval metric (MRR), a generation metric (faithfulness), and a
  user metric (thumbs-up rate or task completion).
- **Pitfall:** Using reranking on every query regardless of need. Cross-encoders
  add 50-200ms per query. **Fix:** Use a lightweight classifier to decide
  whether reranking is worth it — high-entropy result sets benefit most.

## Next Steps

- **Read:** [rag_hybrid](/lesson/rag_hybrid) — deep dive into hybrid search
- **Read:** [rag_rerank](/lesson/rag_rerank) — cross-encoder reranking in detail
- **Read:** [rag_eval_adv](/lesson/rag_eval_adv) — measure whether your
  advanced layers actually help
