---
id: deploy_rag
title: Deploying RAG to Production
tier: senior
difficulty: advanced
estimated_minutes: 25
module: deployment
prerequisites: [rag_streaming, rag_observe]
tags: [deployment, docker, gunicorn, health-checks, blue-green, prometheus]
---

## Concept Introduction

Deploying a RAG system is deploying a Python web service with specific operational requirements: persistent connections to LLM APIs, GPU/CPU-bound embedding workers, and a vector database that must be warm before serving traffic. Standard web deployment patterns apply -- Docker, gunicorn, health checks -- but the specifics of RAG (long-running streaming connections, cold vector indexes, cached embedding sessions) change what "ready to serve" means. This lesson covers the production deployment architecture, graceful shutdown for in-flight RAG queries, blue-green deploys with index sync, and Prometheus metrics.

## How It Works

Dockerize the RAG service with a multi-stage build: first stage installs dependencies (which are heavier for RAG -- sentence-transformers, torch, httpx), second stage copies only the application code. The container runs gunicorn (or uvicorn for async/FastAPI) with multiple workers. The key decision is sync vs async workers. For FastAPI/async endpoints, use `uvicorn.workers.UvicornWorker` with gunicorn; for Flask sync endpoints, use gunicorn's default sync workers. Configure `--worker-connections` high (1000+) for streaming endpoints; each in-flight stream holds a connection.

Health checks for RAG must verify more than "port 8000 responds." A `/health/ready` endpoint should: (1) ping the database, (2) confirm the vector index is loaded (query a known test vector), (3) confirm the embedding service is reachable, and (4) confirm the LLM API key validates. If any dependency is down, the readiness check fails and Kubernetes/load balancer stops routing traffic. A `/health/live` endpoint checks only "is the process alive" -- lighter, for frequent polling.

Graceful shutdown matters because RAG queries can run 5-30 seconds (streaming generation). When gunicorn receives SIGTERM, it should stop accepting new connections, finish in-flight requests (with a timeout -- typically 30 seconds), and only then exit. gunicorn's default graceful timeout is 30s; for RAG, set it to 60s to accommodate long generation requests. Test this: deploy, send a streaming request, and `docker stop` the container mid-stream. The client should receive a clean `error` SSE event, not a dropped connection.

Blue-green deploys with RAG add a vector index sync step. During a deploy, the new (green) containers start, run index verification queries, and signal readiness. Traffic then shifts from blue to green. The complication: if the new version uses a different embedding model or chunking strategy, the green containers need a new vector index. Strategy: build the new index alongside the old one (double storage temporarily), validate, then switch the application config to point to the new index.

Prometheus metrics: expose a `/metrics` endpoint with `prometheus_client`. Track request count, request latency histogram (by endpoint), in-flight stream count (gauge), LLM token consumption (counter by model), embedding call count, and vector DB query latency histogram. Import the prometheus client in your FastAPI app and use middleware or decorators to instrument.

## Code Examples

```dockerfile
# Multi-stage Docker build for RAG
FROM python:3.12-slim AS builder
RUN pip install --no-cache-dir torch sentence-transformers httpx fastapi uvicorn

FROM python:3.12-slim
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY src/ /app/src/
WORKDIR /app
EXPOSE 8000
CMD ["gunicorn", "src.main:app", "--worker-class", "uvicorn.workers.UvicornWorker",
     "--workers", "4", "--timeout", "60", "--graceful-timeout", "60",
     "--bind", "0.0.0.0:8000"]
```

```python
# FastAPI health checks with dependency verification
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/health/live")
async def liveness():
    return {"status": "ok"}

@app.get("/health/ready")
async def readiness():
    checks = {}
    # 1. Database reachable and indexed
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT count(*) FROM documents")
            checks["database"] = {"status": "ok", "documents": row[0]}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)}
    # 2. Embedding service reachable
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{EMBEDDING_URL}/health")
        checks["embedding"] = {"status": "ok" if resp.status_code == 200 else "error"}
    # 3. LLM API key valid
    try:
        await llm.list_models()
        checks["llm"] = {"status": "ok"}
    except Exception:
        checks["llm"] = {"status": "error"}

    all_ok = all(v.get("status") == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503
    return {"ready": all_ok, "checks": checks}, status_code
```

```python
# Prometheus metrics for RAG
from prometheus_client import Counter, Histogram, Gauge, generate_latest

rag_requests = Counter("rag_requests_total", "Total RAG queries", ["status"])
rag_latency = Histogram("rag_query_duration_seconds", "RAG query latency",
                        buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0])
active_streams = Gauge("rag_active_streams", "In-flight streaming connections")
tokens_used = Counter("rag_tokens_total", "LLM tokens consumed", ["model", "type"])

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

## Try It Yourself

Dockerize your RAG endpoint. Start the container and run `docker ps` to confirm it is running. Hit `/health/ready` and verify all three dependency checks. Then send a streaming request and, while it is streaming, run `docker stop <container>` with a 5-second timeout. Observe whether the stream terminates cleanly or drops. Adjust `graceful_timeout` accordingly.

## Real-World RAG Connection

A production RAG service running on Kubernetes uses the readiness probe to gate traffic: a new pod starts, builds the vector index (30-60 seconds), passes the readiness check, and only then receives traffic from the Service. The liveness probe (cheap, every 10 seconds) catches hung processes. Blue-green deploys build the new embedding index in the green environment 10 minutes before the switchover, ensuring zero-downtime index transitions.

## Common Pitfalls

- **Liveness probe that checks the database.** A slow database query causes the liveness probe to timeout, Kubernetes restarts the pod, and the restart causes more database queries, creating a cascade. The liveness endpoint should be trivial (return True).
- **No graceful shutdown timeout for LLM calls.** An LLM generation mid-stream when gunicorn kills the worker leaves the client with a truncated response and no error. Set the graceful timeout longer than your maximum expected generation time.
- **Health check that calls the LLM API on every probe.** A `/health/ready` that calls `openai.models.list()` every 10 seconds on 20 pods generates 172,800 API calls per day for health checks alone. Use a local cached credential validation instead.

## Next Steps

- gunicorn documentation on worker types and graceful shutdown
- Lesson: **Cost Optimization** for production resource planning
