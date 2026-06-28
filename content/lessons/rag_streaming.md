---
id: rag_streaming
title: Streaming RAG
tier: senior
difficulty: advanced
estimated_minutes: 25
module: generation
prerequisites: [py_async]
tags: [streaming, sse, fastapi, token-by-token, generation]
---

## Concept Introduction

Users perceive latency, not throughput. A RAG endpoint that waits 4 seconds and returns the full answer at once feels slow. The same endpoint streaming tokens from second 0.5 feels fast even if the last token arrives at the same 4-second mark. Streaming RAG delivers tokens progressively via Server-Sent Events (SSE), and the architectural complexity lies in streaming retrieved context alongside generated tokens. This lesson covers SSE mechanics, partial context streaming, and FastAPI patterns.

## How It Works

SSE is a one-way HTTP protocol where the server sends a stream of `data:` prefixed lines. The client's `EventSource` API (or `fetch` with a reader) processes each event as it arrives. Unlike WebSockets, SSE is unidirectional, auto-reconnects on disconnect, and passes through most proxies without configuration. For RAG, SSE is the right choice: the server pushes tokens to the client; the client never sends data mid-stream.

The naive streaming approach retrieves all chunks first (2 seconds), then streams the LLM response (2 seconds). Total time to first token (TTFB): 2 seconds. The progressive approach streams retrieved chunks to the client as they are found, and the frontend renders source citations before the answer starts. Even better: interleave retrieval and generation by starting LLM generation as soon as the first chunk arrives, adding subsequent chunks as they are retrieved, and updating the generation mid-stream. This is complex to implement correctly -- the LLM may need to revise earlier output as new context arrives -- but delivers the fastest perceived response.

FastAPI's `StreamingResponse` accepts an async generator. Each `yield` produces a formatted SSE event: `f"data: {json.dumps({'token': token})}\n\n"`. The double newline is required by the SSE spec. Set `media_type="text/event-stream"` and include `Cache-Control: no-cache` and `Connection: keep-alive` headers. For RAG specifically, you can emit different event types: `chunk` events for retrieved sources, `token` events for generated text, and `done` events with metadata.

## Code Examples

```python
from fastapi import FastAPI
from starlette.responses import StreamingResponse
import json, asyncio

app = FastAPI()

async def rag_stream(query: str):
    """Yield three event types: chunk citations, tokens, and done."""
    # Emit retrieved chunks as they arrive
    chunks = []
    async for chunk in retrieve_progressive(query):
        chunks.append(chunk)
        yield f"event: chunk\ndata: {json.dumps({'id': chunk.id, 'snippet': chunk.content[:200]})}\n\n"

    # Build prompt and stream tokens
    prompt = build_prompt(query, chunks)
    async for token in llm_stream(prompt):
        yield f"event: token\ndata: {json.dumps({'text': token})}\n\n"

    yield f"event: done\ndata: {json.dumps({'chunks_used': len(chunks)})}\n\n"

@app.get("/rag/stream")
async def stream_endpoint(q: str):
    return StreamingResponse(
        rag_stream(q),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
```

```python
# Client-side: process SSE events with fetch + reader
async def consume_stream(query: str):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", f"http://localhost:8000/rag/stream?q={query}") as resp:
            event_type = None
            async for line in resp.aiter_lines():
                if line.startswith("event: "):
                    event_type = line[7:]
                elif line.startswith("data: ") and event_type:
                    payload = json.loads(line[6:])
                    if event_type == "chunk":
                        print(f"[Source] {payload['snippet']}")
                    elif event_type == "token":
                        print(payload["text"], end="", flush=True)
```

## Try It Yourself

Build a FastAPI endpoint that retrieves chunks and streams them as `chunk` events, followed by token events from an OpenAI streaming completion. Use the client snippet above to consume the stream. Measure TTFB (time to first token) vs your existing non-streaming endpoint. The streaming endpoint should show visible output at least 1.5 seconds earlier.

## Real-World RAG Connection

A customer-facing chatbot streams source citations as the user watches: first, relevant support articles appear as clickable cards (chunk events at 800ms), then the answer streams token-by-token (1.2s), and finally a "based on 3 sources" summary event (3.5s). The user starts reading the answer by 1.2s instead of staring at a spinner for 3.5s.

## Common Pitfalls

- **Buffering proxies destroying the stream.** nginx, Cloudflare, and some CDNs buffer responses by default. Set `X-Accel-Buffering: no` for nginx and disable buffering in your proxy configuration. Test your streaming endpoint through every proxy layer.
- **One large SSE event per chunk.** If you embed the full document content in the `chunk` event, a single event can be megabytes. Send only the snippet and an ID; let the client fetch the full document if needed.
- **Unclosed generators on client disconnect.** If the user closes the browser tab mid-stream, the async generator continues running, consuming LLM tokens and memory. Catch `GeneratorExit` or check `request.is_disconnected()` to abort.

## Next Steps

- MDN documentation on Server-Sent Events and EventSource API
- Lesson: **Semantic Caching** for accelerating repeated streamed queries
