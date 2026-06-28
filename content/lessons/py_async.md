---
id: py_async
title: Async Python & asyncio
tier: senior
difficulty: advanced
estimated_minutes: 25
module: python-foundations
prerequisites: [py_type_hints, py_testing]
tags: [python, asyncio, async, streaming, fastapi, httpx]
---

## Concept Introduction

RAG systems are I/O-bound at every stage -- embedding API calls, vector database queries, LLM generation. Async Python lets you overlap these operations instead of waiting for each sequentially, cutting end-to-end latency by 40-60%. This lesson covers the async patterns that matter for production RAG: concurrent embedding, async generators for streaming, and framework choice.

## How It Works

A coroutine (defined with `async def`) yields control at each `await` point, letting the event loop run other coroutines while I/O completes. This is cooperative multitasking, not parallelism -- one thread, many interleaved tasks. `asyncio.gather()` fires multiple coroutines concurrently and returns results as a list once all complete. This is the core pattern for embedding: split a document batch into N sub-batches, embed each concurrently, then concatenate.

For streaming RAG, use async generators (`async def` with `yield`). Each chunk from the LLM is yielded as it arrives, and `FastAPI`'s `StreamingResponse` wraps the generator to produce SSE (Server-Sent Events). The caller's event loop processes each chunk without buffering the full response.

On the framework choice: Flask is synchronous by default. You can wrap async code with `asyncio.run()`, but each call blocks a worker thread. FastAPI is async-native -- request handlers are coroutines, and blocking calls must be explicitly offloaded to a thread pool with `run_in_executor`. If your RAG pipeline is primarily I/O-bound API calls, FastAPI handles more concurrent requests with fewer workers.

On the HTTP client choice: `requests` is synchronous and blocks the event loop. `httpx` with `AsyncClient` integrates naturally into async code. The tradeoff is that `httpx` has a steeper API learning curve and less community documentation. Use `httpx` for any async service; `requests` is acceptable only in CLI scripts.

## Code Examples

```python
import asyncio
from httpx import AsyncClient

async def embed_batch(client: AsyncClient, texts: list[str]) -> list[list[float]]:
    resp = await client.post("https://api.openai.com/v1/embeddings", json={
        "model": "text-embedding-3-small", "input": texts
    })
    return [d["embedding"] for d in resp.json()["data"]]

async def embed_all(documents: list[str], batch_size: int = 20) -> list[list[float]]:
    async with AsyncClient() as client:
        batches = [documents[i:i+batch_size] for i in range(0, len(documents), batch_size)]
        results = await asyncio.gather(*(embed_batch(client, b) for b in batches))
    return [emb for batch in results for emb in batch]
```

```python
async def stream_llm(prompt: str):
    """Async generator yields tokens as they arrive."""
    async with AsyncClient() as client:
        async with client.stream("POST", "https://api.openai.com/v1/chat/completions",
            json={"model": "gpt-4o", "messages": [{"role": "user", "content": prompt}],
                  "stream": True}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    yield json.loads(line[6:])["choices"][0]["delta"].get("content", "")

# FastAPI endpoint
from fastapi import FastAPI
from starlette.responses import StreamingResponse
app = FastAPI()

@app.get("/rag/stream")
async def rag_stream(query: str):
    return StreamingResponse(stream_llm(query), media_type="text/event-stream")
```

## Try It Yourself

Benchmark sequential vs concurrent embedding. Write a script that embeds 100 documents sequentially using `for` + `await`, then rewrite it with `asyncio.gather` across 5 batches of 20. Time both. The concurrent version should be 3-4x faster. Then wrap the concurrent version in a FastAPI endpoint and test with multiple simultaneous requests.

## Real-World RAG Connection

A production RAG pipeline that embeds a user query, retrieves 20 chunks, and generates an answer sequentially might take 3.5 seconds. With `asyncio.gather` to overlap the embedding and retrieval calls (they share no data dependency), total latency drops to 2.1 seconds -- a 40% improvement with no infrastructure change.

## Common Pitfalls

- **Calling `asyncio.run()` inside an already-running event loop.** This crashes with `RuntimeError: This event loop is already running`. In FastAPI or Jupyter, use `await` directly.
- **Using blocking libraries inside coroutines.** If you call `requests.get()` from an async function, it blocks the entire event loop. Offload to `run_in_executor` or use `httpx`.
- **Unbounded concurrency with `gather`.** Firing 10,000 concurrent API calls will hit rate limits and exhaust file descriptors. Always batch with a semaphore or a bounded queue.

## Next Steps

- `asyncio.Semaphore` for concurrency control
- Lesson: **Streaming RAG** for production SSE patterns
