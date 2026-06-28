---
id: rag_cache
title: Semantic Caching
tier: senior
difficulty: advanced
estimated_minutes: 25
module: generation
prerequisites: [rag_streaming]
tags: [caching, semantic-cache, gptcache, redis, cost-optimization]
---

## Concept Introduction

Users ask the same questions in different words. "How do I reset my password?," "I forgot my password, help," and "password reset procedure" all expect the same answer. Semantic caching detects that two queries mean the same thing and returns the cached response, saving an entire LLM call. At production scale, a well-tuned semantic cache hits 15-30% of queries, directly reducing your LLM bill by that fraction. This lesson covers cache architectures, similarity thresholds, and invalidation strategies.

## How It Works

An exact cache (`query_string -> response`) is a hash map -- zero false positives, but near-zero hit rate because queries vary in wording. A semantic cache embeds each query on insertion, then at lookup time embeds the incoming query and finds the nearest cached embedding within a similarity threshold. If a match exists (cosine similarity >= 0.92), return the cached response. If not, run the full RAG pipeline and cache the result.

GPTCache (open-source) implements this with pluggable components: an embedding function, a vector store for similarity search, and an eviction policy. You configure the similarity threshold -- 0.95 returns near-identical matches (safe, lower hit rate); 0.85 returns loosely-related matches (risky, higher hit rate). The threshold is a business decision, not a technical one: how similar must two queries be before a cached answer is acceptable?

Redis underpins production semantic caching because it serves lookups in sub-millisecond time. The pattern: store embedding vectors in Redis with `FT.SEARCH` (RediSearch vector similarity). Cache values can be the full response JSON or a pointer (S3 key, DB row ID) if responses are large. Set TTL on every key so the cache auto-expires -- typically 1 hour for general Q&A, 24 hours for documentation that updates nightly, and infinite for static FAQ answers.

Cache invalidation is the hard problem. When your knowledge base updates, cached answers referencing old documents become stale. Strategies: (1) time-based TTL (simple, acceptable for slowly-changing data), (2) document-version-based keys where the cache key includes the knowledge base version hash, (3) dependency tracking where each cached response records which document IDs it used, and reindexing those documents invalidates dependent cache entries.

## Code Examples

```python
import hashlib, json, time
import numpy as np

class SemanticCache:
    def __init__(self, redis_client, embedder, threshold: float = 0.92, ttl: int = 3600):
        self.redis = redis_client
        self.embedder = embedder
        self.threshold = threshold
        self.ttl = ttl

    async def lookup(self, query: str) -> str | None:
        q_vec = await self.embedder.embed(query)
        q_blob = np.array(q_vec, dtype=np.float32).tobytes()

        # RediSearch: KNN by cosine similarity
        results = self.redis.ft("idx").search(
            f"*=>[KNN 1 @embedding $vec AS score]",
            query_params={"vec": q_blob}
        )
        if results.docs:
            score = 1 - float(results.docs[0].score)  # Redis returns distance
            if score >= self.threshold:
                return json.loads(results.docs[0].response)

        return None

    async def store(self, query: str, response: dict):
        q_vec = await self.embedder.embed(query)
        self.redis.hset(
            f"cache:{hashlib.sha256(query.encode()).hexdigest()[:16]}",
            mapping={"embedding": np.array(q_vec, dtype=np.float32).tobytes(),
                     "response": json.dumps(response), "ts": str(time.time())}
        )
        self.redis.expire(f"cache:{hashlib.sha256(query.encode()).hexdigest()[:16]}", self.ttl)
```

```python
# Dependency-tracked invalidation
class VersionedCache(SemanticCache):
    def store(self, query: str, response: dict, doc_ids: list[str]):
        key = f"v{self.kb_version}:{hashlib.sha256(query.encode()).hexdigest()[:16]}"
        self.redis.hset(key, mapping={
            "embedding": ..., "response": json.dumps(response), "doc_ids": json.dumps(doc_ids)
        })

# On reindex: bump kb_version, old keys expire via TTL naturally
```

## Try It Yourself

Instrument your RAG endpoint to log every query and response. Collect 1,000 real queries and compute the pairwise cosine similarity of their embeddings. Plot the similarity distribution. It will be bimodal: a cluster near 1.0 (repeated questions) and a broad distribution from 0.3-0.7 (genuinely different questions). Pick a threshold that captures the dense cluster without bleeding into the broad distribution.

## Real-World RAG Connection

A SaaS support bot handles 50,000 queries per day. Analysis shows that "how do I cancel my subscription" and its variants account for 8% of traffic. A semantic cache with a 0.94 threshold catches every variant, saving roughly 4,000 LLM calls per day -- approximately $120/month at $0.001 per query.

## Common Pitfalls

- **Overly aggressive threshold.** A threshold of 0.85 matches queries that share a topic but have different answers: "how to create a user" vs "how to delete a user" can both be about users but require completely different responses.
- **Cache stampede on expiry.** When a popular cached entry expires, 50 concurrent requests all miss the cache and fire 50 identical LLM calls. Use Redis locking or a single-flight pattern to let only one request populate the cache.
- **Ignoring query context.** "What about Tuesday?" depends on the conversation history. Caching the standalone query produces wrong answers. Either include conversation context in the cache key or disable caching for conversational RAG.

## Next Steps

- GPTCache GitHub repository for the pluggable architecture reference
- Lesson: **Cost Optimization** for broader cost-reduction strategies
