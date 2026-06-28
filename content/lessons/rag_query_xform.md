---
id: rag_query_xform
title: Query Transformation
tier: senior
difficulty: advanced
estimated_minutes: 25
module: retrieval
prerequisites: [rag_hybrid, rag_multihop]
tags: [query-transformation, hyde, multi-query, step-back, retrieval]
---

## Concept Introduction

Users write bad queries. They are vague ("tell me about databases"), use different vocabulary than your documents ("how to stop data loss" when your docs say "transaction durability"), or pack multiple questions into one sentence. Query transformation rewrites the user's query before retrieval to bridge this vocabulary gap. This lesson covers four transformation strategies, their cost profiles, and how to decide which to apply per query.

## How It Works

Query rewriting is the simplest and cheapest: an LLM restates the user's query in the vocabulary and style of your documents. If your knowledge base is technical documentation, transform "why is my app slow" to "diagnose high latency and identify performance bottlenecks in application server." This is a single LLM call with a system prompt and requires no document access. Cost is minimal; add it to every query.

HyDE (Hypothetical Document Embeddings) flips the pipeline: instead of embedding the user's query, ask the LLM to write a hypothetical document that would answer the question, then embed *that document* and use it for retrieval. The insight is that a synthetic document in embedding space is closer to real documents than a short query is. HyDE is significantly more expensive (one LLM generation per query) and adds ~1 second of latency, so reserve it for queries where initial retrieval returns poor results.

Multi-query retrieval generates N variant queries from the original, retrieves for each, and fuses the results (typically with RRF). "How do I configure load balancing?" generates "load balancer setup guide," "configuring traffic distribution," and "NGINX upstream configuration." Each variant catches documents that use different terminology. Multi-query is a cost-multiplier: each variant costs one embedding + one retrieval. Use N=3 for a good cost/recall tradeoff.

Step-back prompting asks a more abstract question first: for "what happened in the Battle of Midway," ask "what is the historical context of the Pacific Theater in WWII?" The abstract retrieval provides framing that makes the specific retrieval more effective. Step-back is most useful for complex analytical questions where context is essential.

## Code Examples

```python
async def query_rewrite(query: str, llm) -> str:
    return await llm.call(
        "Rewrite this user query in the vocabulary of technical documentation. "
        "Be specific and use precise terminology.\nQuery: " + query
    )

async def hyde_embed(query: str, llm, embedder) -> list[float]:
    hypothetical_doc = await llm.call(
        "Write a short paragraph that would answer this question. "
        "Write it as if it were an actual document from the knowledge base.\n"
        "Question: " + query
    )
    return await embedder.embed(hypothetical_doc)

async def multi_query_retrieve(query: str, llm, retriever, n: int = 3):
    variants = await llm.call(
        f"Generate {n} different search queries that capture different "
        f"aspects of this question. One per line.\nQuestion: " + query
    )
    queries = [q.strip() for q in variants.split("\n") if q.strip()]
    results = await asyncio.gather(*(retriever.search(q, k=10) for q in queries))
    return reciprocal_rank_fusion(results)

async def step_back(query: str, llm, retriever):
    abstract = await llm.call(
        "Generate a broader, more abstract question that provides context "
        "for answering this specific question:\n" + query
    )
    context_results = await retriever.search(abstract, k=10)
    specific_results = await retriever.search(query, k=10)
    return context_results + specific_results
```

## Try It Yourself

Benchmark query rewriting against raw queries on your own document set. Pick 20 real user queries, retrieve with and without rewriting, and measure recall@5. Rewriting should show a measurable lift, especially for queries with vocabulary mismatch. Then add HyDE and compare its recall against the rewrite baseline -- HyDE should be better but cost significantly more.

## Real-World RAG Connection

A developer documentation chatbot receives the query "how do I make it faster?" forty times a day. Query rewriting transforms this to "optimize application performance, reduce response latency, and implement caching strategies," which retrieves the caching, indexing, and profiling documentation pages instead of miscellaneous pages that happen to mention "fast."

## Common Pitfalls

- **Applying HyDE to every query.** A query that is already specific and well-formed ("what is the max upload file size?") gains nothing from generating a hypothetical document. Use a query quality classifier to gate expensive transformations.
- **Multi-query variant drift.** When N is too large, the LLM generates increasingly tangential variants that pollute the fused results with irrelevant documents.
- **Step-back generating irrelevant context.** A step-back question that is too abstract ("what is the nature of war?") retrieves content that adds noise, not signal. Keep the abstraction one level up, not ten.

## Next Steps

- Paper: "Precise Zero-Shot Dense Retrieval without Relevance Labels" (HyDE)
- Lesson: **Parent Document Retriever** for chunk-level transformation
