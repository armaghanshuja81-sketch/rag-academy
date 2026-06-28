---
id: deploy_rate
title: Rate Limiting & Throttling
tier: senior
difficulty: advanced
estimated_minutes: 25
module: deployment
prerequisites: [flask_middleware, deploy_rag]
tags: [rate-limiting, throttling, token-bucket, exponential-backoff, queue-based]
---

## Concept Introduction

RAG systems talk to three external services (embedding API, vector database, LLM API), each with its own rate limits. A spike in user traffic can trigger 429 responses from OpenAI, cascading failures through the pipeline. Rate limiting protects both your infrastructure (preventing overload) and your dependencies (staying within API quotas). This lesson covers the token bucket algorithm, layered rate limiting, exponential backoff for retries, and queue-based async processing for burst absorption.

## How It Works

The token bucket algorithm is the standard rate limiter: a bucket holds a maximum of N tokens, refilling at a rate of R tokens per second. Each request consumes 1 (or more) tokens. If the bucket is empty, the request is rate-limited (429). This allows bursts (up to bucket capacity) while enforcing a steady-state rate. The bucket state must be shared across all instances of your service -- Redis is the standard backing store for distributed token buckets.

Layered rate limiting applies different limits at different scopes. Global rate limit (e.g., 1,000 requests/second total) protects your infrastructure. Per-user rate limit (e.g., 10 requests/minute per user) enforces fairness. Per-endpoint rate limit (e.g., 2 requests/second for the streaming endpoint, 20/second for the search endpoint) protects expensive paths. The token bucket at each layer consumes independently; a request must pass all layers to execute.

Exponential backoff on retries is critical when your service receives 429 from upstream APIs (OpenAI, Cohere, Pinecone). The retry logic: wait 1 second, retry; if still 429, wait 2 seconds, then 4, then 8, up to a max of 60 seconds. Jitter (random additional delay of 0-50% of the wait time) prevents thundering herd: 50 retries that all wake up at exactly the same second will trigger another rate limit. `tenacity` is the standard Python library for this: `@retry(wait=wait_exponential_jitter(), stop=stop_after_attempt(5))`.

Queue-based async processing absorbs bursts that would otherwise be rejected by rate limits. Instead of returning 429 to the user when the rate limit is hit, accept the request, enqueue it (Redis, RabbitMQ, or SQS), and return 202 Accepted with a status-check URL. A worker pool drains the queue at a controlled rate matching your upstream API limits. The tradeoff: the user does not get a synchronous response. This is acceptable for batch RAG operations (reindexing, bulk evaluation) but not for interactive chat.

## Code Examples

```python
import time, asyncio
from dataclasses import dataclass

@dataclass
class TokenBucket:
    tokens: float
    capacity: float
    refill_rate: float  # tokens per second
    last_refill: float

    async def consume(self, tokens: float = 1.0) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

# Redis-backed token bucket (pseudocode)
REDIS_SCRIPT = """
local tokens = redis.call("get", KEYS[1])
if tokens == false then
    redis.call("set", KEYS[1], ARGV[1])
    redis.call("expire", KEYS[1], ARGV[2])
    tokens = ARGV[1]
end
if tonumber(tokens) >= tonumber(ARGV[3]) then
    redis.call("decrby", KEYS[1], ARGV[3])
    return 1
end
return 0
"""

async def check_rate_limit(redis, key: str, capacity: int, cost: int = 1) -> bool:
    result = await redis.eval(REDIS_SCRIPT, 1, f"rate:{key}", capacity, 60, cost)
    return result == 1
```

```python
from tenacity import retry, wait_exponential_jitter, stop_after_attempt

@retry(
    wait=wait_exponential_jitter(initial=1, max=60, jitter=0.3),
    stop=stop_after_attempt(5),
    retry=lambda e: isinstance(e, RateLimitError),
)
async def call_llm_with_backoff(prompt: str):
    resp = await openai.chat.completions.create(model="gpt-4o", messages=[...])
    if resp.status == 429:
        raise RateLimitError("LLM rate limited")
    return resp

# Queue-based async processing for bursts
async def enqueue_rag_job(query: str, user_id: str, redis) -> str:
    job_id = str(uuid.uuid4())
    await redis.lpush("rag:queue", json.dumps({"job_id": job_id, "query": query, "user_id": user_id}))
    return job_id  # Return 202 Accepted with this ID

async def worker_loop(retriever, llm, redis):
    """Pull from queue at controlled rate matching upstream limits."""
    bucket = TokenBucket(tokens=10, capacity=10, refill_rate=2.0)
    while True:
        await bucket.consume(1.0)  # Blocks if rate limit exhausted
        job_json = await redis.brpop("rag:queue", timeout=1)
        if job_json:
            job = json.loads(job_json[1])
            result = await run_rag(job["query"], retriever, llm)
            await redis.set(f"rag:result:{job['job_id']}", json.dumps(result), ex=3600)
```

## Try It Yourself

Build a Redis-backed token bucket limiter. Start a Flask app protected by the limiter at 5 requests per 10 seconds. Write a script that fires 20 requests with no delay between them. Verify that the first 5 succeed, requests 6-20 get 429, and after 10 seconds new requests succeed again. Then add exponential backoff to the client script and verify that all 20 eventually succeed without overwhelming the server.

## Real-World RAG Connection

A RAG API serving 100 enterprise customers runs three rate limit layers: 500 QPS global (Redis token bucket, 50ms refill), 30 requests/minute per API key (Redis per-key counter with 60s TTL), and 10 concurrent streams per user (Redis increment/decrement around streaming endpoints). When OpenAI returns 429, the retry layer backs off exponentially while the queue layer buffers incoming requests, returning 202 to clients that opted into async mode. No request is lost, and no 429 reaches the end user.

## Common Pitfalls

- **Client-side rate limiting without server-side enforcement.** A malicious or buggy client ignores Retry-After headers. The server must always enforce limits, not just advise.
- **Exponential backoff without jitter.** Ten clients receive 429 at the same time, all wait exactly 4 seconds, all retry simultaneously, all get 429 again. Jitter spreads retries across a window and prevents synchronization.
- **Rate limiting the health check endpoint.** `/health/live` returning 429 causes Kubernetes to kill the pod. Exclude health endpoints from all rate limit layers.

## Next Steps

- `flask-limiter` and `slowapi` documentation for ready-made rate limiting
- Read "Rate Limiting at Scale" from the Stripe engineering blog for real-world architecture
