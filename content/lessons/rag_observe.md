---
id: rag_observe
title: RAG Observability
tier: senior
difficulty: advanced
estimated_minutes: 25
module: production
prerequisites: [rag_cache, rag_streaming]
tags: [observability, langfuse, tracing, latency, monitoring, alerting]
---

## Concept Introduction

A RAG pipeline has at least three moving parts (embed, retrieve, generate), each calling a remote service. When a user reports "the answer was wrong," you need to trace the exact query, retrieved chunks, prompt, and generated response to diagnose whether the failure was retrieval, generation, or context. RAG observability instruments every stage of the pipeline and surfaces degradations before users notice. This lesson covers tracing architecture, the latency budget, and alerting on retrieval quality.

## How It Works

Distributed tracing assigns a `trace_id` at the entry point (the API endpoint) and passes it through every downstream call. Each stage (embedding, vector search, LLM generation) becomes a span under that trace. Langfuse and LangSmith are the two dominant open-source/commercial platforms for LLM tracing; both work by wrapping your LLM and retrieval calls with decorators or context managers that emit spans to a collector.

The latency budget for a typical RAG query breaks into four spans: embedding (100-300ms), vector search (10-50ms for pgvector, 50-200ms for Pinecone), prompt assembly (negligible), and generation (500-3000ms depending on output length). If generation takes 4 seconds, optimizing retrieval from 50ms to 10ms saves the user nothing perceivable. Trace breakdown tells you where to invest engineering effort.

Token usage dashboards are the simplest high-value addition: track tokens per query, per user, per day. A sudden spike in average tokens per query often means the retriever is returning irrelevant chunks, causing the LLM to generate longer, hedging responses. A steady upward trend means your knowledge base is growing and you need to revisit chunk sizes or retrieval counts.

Alert on retrieval quality, not just system health. Track the average cosine similarity between queries and their top retrieved chunks. When this metric drops by 20% from baseline, either your embeddings model has changed behavior or your index has degraded. Similarly, track the ratio of generated tokens to context tokens: a rising ratio means the LLM is relying more on its parametric knowledge than your retrieved context.

## Code Examples

```python
from langfuse.decorators import observe, langfuse_context
import uuid

@observe(as_type="generation")
async def traced_generate(prompt: str, trace_id: str, session_id: str) -> str:
    langfuse_context.update_current_trace(
        user_id=session_id,
        trace_id=trace_id,
    )
    resp = await openai.chat.completions.create(
        model="gpt-4o", messages=[{"role": "user", "content": prompt}]
    )
    langfuse_context.update_current_observation(
        usage={"input": resp.usage.prompt_tokens, "output": resp.usage.completion_tokens},
        model="gpt-4o",
    )
    return resp.choices[0].message.content

@observe(name="rag-query")
async def rag_query(query: str, user_id: str):
    trace_id = str(uuid.uuid4())

    with langfuse_context.create_span(name="embedding", trace_id=trace_id) as span:
        q_embedding = await embed(query)
        span.update(metadata={"dimensions": len(q_embedding)})

    with langfuse_context.create_span(name="retrieval", trace_id=trace_id) as span:
        chunks = await vector_search(q_embedding, top_k=10)
        span.update(metadata={"chunk_count": len(chunks),
                              "avg_score": sum(c.score for c in chunks) / len(chunks)})

    prompt = build_prompt(query, chunks)
    answer = await traced_generate(prompt, trace_id=trace_id, session_id=user_id)

    langfuse_context.update_current_trace(
        input=query, output=answer, metadata={"chunks_retrieved": len(chunks)}
    )
    return answer
```

```python
# Alerting: report a metric that can trigger alarms
import statsd
statsd_client = statsd.StatsClient("localhost", 8125)

# After each query
statsd_client.timing("rag.embedding.latency_ms", embed_ms)
statsd_client.timing("rag.retrieval.latency_ms", retrieval_ms)
statsd_client.timing("rag.generation.latency_ms", gen_ms)
statsd_client.gauge("rag.retrieval.avg_score", avg_score)
```

## Try It Yourself

Sign up for a free Langfuse Cloud account. Instrument your RAG endpoint with the `@observe` decorator pattern above. Run 20 queries and inspect the trace waterfall in the Langfuse UI. Identify which span dominates your latency budget. If it is generation, experiment with a faster model (e.g., GPT-4o-mini). If it is embedding, check whether you are embedding one-by-one instead of batching.

## Real-World RAG Connection

A production RAG system started returning increasingly verbose, deflecting answers. Engineers had no insight until they checked the token usage dashboard and saw average output tokens had risen from 200 to 600 over two weeks. Tracing revealed that a reindex had halved chunk sizes, causing the retriever to return snippets without enough context, which the LLM compensated for by hedging. A revert to the previous chunking strategy restored normal behavior.

## Common Pitfalls

- **Sampling too aggressively in production.** Tracing every query costs storage and adds overhead. Sample 100% of queries in development, 10% in production, and 100% of queries that throw errors.
- **Logging full documents in trace metadata.** A 10-page document stored in the trace bloats your observability DB and costs money. Log only chunk IDs, scores, and the first 200 characters.
- **Alerting on individual slow queries.** A single 10-second query may be legitimate (long generation). Alert on the P95 latency over a 5-minute window, not individual spikes.

## Next Steps

- Langfuse documentation on custom spans and scoring
- Lesson: **Advanced RAG Evaluation** for automated quality scoring
