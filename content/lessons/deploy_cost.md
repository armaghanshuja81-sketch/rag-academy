---
id: deploy_cost
title: Cost Optimization
tier: senior
difficulty: advanced
estimated_minutes: 25
module: deployment
prerequisites: [rag_cache, deploy_rag]
tags: [cost-optimization, token-budgeting, model-cascading, batching, embeddings]
---

## Concept Introduction

A RAG system making 10,000 queries per day at $0.01 per query costs $3,000/month before you add embedding, storage, and infrastructure. At 100,000 queries per day, that is $30,000/month -- real money. Cost optimization in RAG is an engineering discipline, not an afterthought. Every component has a cheaper-but-worse alternative and a more-expensive-but-better upgrade. This lesson covers the four highest-leverage cost levers: token budgeting, model cascading, embedding batching with dimension selection, and the caching economics you learned in the semantic caching lesson extended to the full pipeline.

## How It Works

Token budgeting sets hard limits per query: max 500 input tokens for the user query (truncate if necessary), max 3,000 tokens for retrieved context, max 500 output tokens. These limits force discipline in chunk sizing and prompt design. More importantly, they make costs predictable -- every query costs between $0.002 and $0.008 rather than $0.001 to $0.05. Set limits in the application layer and enforce them: truncate retrieved chunks to a combined token limit (using tiktoken to count) before prompt assembly.

Model cascading routes queries to progressively more expensive models based on complexity. A lightweight classifier (or regex pattern matcher) labels each query as "simple" (FAQ, yes/no), "moderate" (explanation, procedure), or "complex" (analysis, multi-step reasoning). Simple queries hit GPT-4o-mini ($0.00015/1K input). Complex queries escalate to GPT-4o ($0.0025/1K input) or Claude Opus ($0.015/1K input). If 70% of production queries are simple, model cascading cuts the generation bill by roughly 60%. The risk: a misclassified complex query gets a shallow answer. Mitigate with a quality gate -- if the cheap model's response confidence is low (short, hedging, "I don't know"), fall back to the expensive model.

Embedding batching is the simplest optimization with the biggest impact. OpenAI's API accepts up to 2,048 texts per embedding call and charges per token, not per call. Embedding 1,000 documents one-by-one = 1,000 API calls with 1,000 network round trips. Batching them into 50 calls of 20 texts each = 50 API calls, roughly 20x faster and identical cost. The tradeoff: a single batch failure loses all embeddings in that batch. Implement retry with exponential backoff per batch.

Embedding dimension selection is an underused lever. OpenAI's `text-embedding-3-small` and `text-embedding-3-large` support a `dimensions` parameter that truncates the embedding to fewer dimensions using a Matryoshka representation. A 256-dim embedding from `text-embedding-3-large` is 12x smaller than the full 3072-dim embedding, making vector storage and search 12x cheaper. The recall drop from 3072 to 256 dims is typically 1-3%. For most RAG applications, this is a trivial tradeoff for 12x cost reduction.

## Code Examples

```python
import tiktoken

enc = tiktoken.encoding_for_model("gpt-4o")

def budget_context(chunks: list[str], max_tokens: int = 3000) -> str:
    """Truncate chunks to fit within token budget."""
    combined = ""
    for chunk in chunks:
        candidate = combined + "\n\n" + chunk
        if len(enc.encode(candidate)) > max_tokens:
            break
        combined = candidate
    return combined

# Model cascading with quality gate
async def cascaded_generate(query: str, context: str) -> str:
    # Always try the cheap model first
    answer = await llm_fast.call(query, context, max_tokens=500)

    # Quality gate: if cheap model hedges, escalate
    hedging_markers = ["I don't know", "I'm not sure", "could not find", "unclear"]
    if any(marker in answer for marker in hedging_markers):
        answer = await llm_expensive.call(query, context, max_tokens=500)

    return answer

# Batched embedding
async def embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = await openai_client.embeddings.create(
            model="text-embedding-3-large", input=batch, dimensions=256
        )
        embeddings.extend([d.embedding for d in resp.data])
    return embeddings
```

```python
# Cost tracking per query
def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    PRICES = {
        "gpt-4o-mini": (0.15, 0.60),  # per 1M tokens
        "gpt-4o": (2.50, 10.0),
    }
    in_price, out_price = PRICES[model]
    return (input_tokens * in_price + output_tokens * out_price) / 1_000_000

# Enforce per-query budget
async def rag_with_budget(query: str, max_cost: float = 0.01) -> dict:
    chunks = await retrieve(query, k=20)
    context = budget_context(chunks, max_tokens=3000)

    input_tokens = len(enc.encode(f"Query: {query}\nContext: {context}"))
    estimated_cost = estimate_cost("gpt-4o-mini", input_tokens, max_output_tokens=500)
    model = "gpt-4o-mini" if estimated_cost <= max_cost else "gpt-4o"  # Fallback if budget allows
    answer = await generate(model, query, context)
    return {"answer": answer, "cost": estimated_cost, "model": model}
```

## Try It Yourself

Instrument your RAG pipeline to log cost per query (input tokens, output tokens, model, embedding calls). Run 100 real queries and compute the cost distribution. Identify the top 10 most expensive queries. For each: could a cheaper model have answered it? Could fewer chunks have sufficed? Would a 256-dim embedding have changed the retrieved results? Calculate your projected monthly bill and then compute the savings from each optimization.

## Real-World RAG Connection

A customer support chatbot handling 50,000 queries/day implemented three optimizations: (1) semantic cache with 18% hit rate, (2) model cascading routing 65% to GPT-4o-mini, and (3) context budget of 2,500 tokens. Monthly LLM cost dropped from $4,200 to $980 -- a 77% reduction -- with no measurable change in customer satisfaction scores.

## Common Pitfalls

- **Optimizing for cost per query instead of total cost.** Cutting context from 3,000 to 500 tokens saves money per query, but if answer quality drops and users re-ask 3 times, total cost increases.
- **Model cascading without quality gates.** Routing "simple" queries to a cheap model without verification produces wrong answers that erode trust and generate support tickets -- which cost far more than the LLM savings.
- **Reducing embedding dimensions without evaluation.** 256-dim embeddings on `text-embedding-3-large` preserve 95%+ of recall. 64-dim embeddings drop to ~85%. Run retrieval benchmarks at each dimension before choosing.

## Next Steps

- OpenAI's Matryoshka embedding documentation
- Lesson: **Rate Limiting & Throttling** for traffic-side cost control
