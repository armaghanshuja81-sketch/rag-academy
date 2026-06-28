---
id: rag_at_scale
title: RAG at Scale
tier: expert
difficulty: expert
estimated_minutes: 30
module: production
prerequisites: [advanced_retrieval, rag_benchmark]
tags: [distributed, ray, gpu-embedding, cuml, kafka, streaming, cost-modeling]
---

## Concept Introduction
RAG at scale means indexing millions of documents, serving thousands of queries per second, and keeping latency under 500ms end-to-end while staying within a budget. The bottlenecks shift from algorithm quality to systems engineering: embedding throughput, index sharding, streaming ingestion, and cost optimization. A system that works beautifully on 10K documents collapses at 10M unless every component — embedding, indexing, retrieval, generation — is designed for horizontal scaling.

## How It Works
**Distributed indexing with Ray** parallelizes the embedding pipeline across a cluster. Each Ray worker loads a copy of the embedding model onto its GPU (or uses CPU if GPU memory is constrained), receives a shard of documents, and produces embeddings. The sharding strategy matters: round-robin is simple but can create stragglers if some documents are much longer than others; size-aware sharding distributes tokens evenly. With 8 A100 GPUs, you can embed 10M documents (avg 500 tokens) in approximately 20 minutes using Ray + vLLM for the embedding model.

**GPU embedding with cuML (RAPIDS)** accelerates the vector similarity search. Instead of CPU-based FAISS, cuML's brute-force KNN on GPU achieves sub-millisecond latency for top-10 retrieval from 10M vectors. For larger indices (100M+), cuML integrates with FAISS GPU indexes (IVF-PQ, HNSW) for approximate search. The memory math: 10M vectors at 1536 dimensions with float32 = ~60GB. A single A100-80GB fits the index in GPU memory; beyond that, you need multi-GPU sharding with near-linear scaling.

**Streaming ingestion with Kafka** handles continuously arriving documents. The pipeline: (1) documents arrive on a Kafka topic, (2) a consumer group of embedding workers reads in parallel, produces embeddings, (3) embeddings are written to the vector index (batch inserts for throughput), (4) a second consumer group updates the graph index and full-text index. The key metric is ingestion lag — the time from document arrival to queryability. Target: < 30 seconds for real-time use cases, < 5 minutes for near-real-time.

**Million-document retrieval latency targets** by component: query embedding — 20ms (GPU) or 50ms (CPU), ANN search — 5ms (GPU) to 50ms (CPU FAISS), metadata filtering — 10ms, re-ranking (cross-encoder) — 50ms per candidate (batchable), LLM generation — streaming with 200ms time-to-first-token. Total target: under 500ms p95 for the full pipeline.

**Cost modeling** quantifies the tradeoffs. The main cost buckets: (a) embedding compute (GPU-hours per million documents), (b) index storage (GB-months in RAM/VRAM/disk), (c) query serving (GPU rental per 1000 queries), (d) LLM generation (per-token cost). A cost model lets you answer: "should we add GPU acceleration for embedding, or are we CPU-bound on retrieval?" and "what is the marginal cost of adding another million documents?"

## Code Examples

```python
import ray
import numpy as np
from typing import TypedDict
import time

class ScaleMetrics(TypedDict):
    total_docs: int
    embedding_time_s: float
    throughput_docs_per_sec: float
    gpu_memory_gb: float

@ray.remote(num_gpus=0.25)
class EmbeddingWorker:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        from transformers import AutoTokenizer, AutoModel
        import torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        import torch
        with torch.no_grad():
            tokens = self.tokenizer(
                texts, padding=True, truncation=True,
                return_tensors="pt", max_length=512
            ).to(self.device)
            outputs = self.model(**tokens)
            embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
        return embeddings.astype(np.float32)

def distributed_embed(documents: list[str], num_workers: int = 8,
                      batch_size: int = 256) -> tuple[np.ndarray, ScaleMetrics]:
    """Embed millions of documents using Ray distributed workers."""
    ray.init(ignore_reinit_error=True)
    workers = [EmbeddingWorker.remote() for _ in range(num_workers)]
    batches = [documents[i:i + batch_size] for i in range(0, len(documents), batch_size)]
    start = time.time()
    futures = []
    for i, batch in enumerate(batches):
        worker = workers[i % num_workers]
        futures.append(worker.embed_batch.remote(batch))
    results = ray.get(futures)
    elapsed = time.time() - start
    all_embeddings = np.vstack(results)
    return all_embeddings, ScaleMetrics(
        total_docs=len(documents),
        embedding_time_s=elapsed,
        throughput_docs_per_sec=len(documents) / elapsed,
        gpu_memory_gb=0  # populated from nvidia-smi in production
    )

def build_faiss_gpu_index(embeddings: np.ndarray, use_gpu: bool = True,
                           index_type: str = "IVF1024,PQ64") -> object:
    """Build a GPU-accelerated FAISS index for million-scale retrieval."""
    import faiss
    dim = embeddings.shape[1]
    if use_gpu:
        # GPU IVF-PQ index
        quantizer = faiss.IndexFlatL2(dim)
        index = faiss.IndexIVFPQ(quantizer, dim, 1024, 64, 8)  # 8-bit PQ
        gpu_res = faiss.StandardGpuResources()
        gpu_index = faiss.index_cpu_to_gpu(gpu_res, 0, index)
        gpu_index.train(embeddings)
        gpu_index.add(embeddings)
        return gpu_index
    else:
        index = faiss.IndexHNSWFlat(dim, 32)  # M=32 connections per node
        index.add(embeddings)
        return index

def cost_model(num_docs: int, queries_per_month: int,
               embedding_model_size_gb: float = 1.5,
               gpu_hourly_cost: float = 2.50) -> dict:
    """Estimate monthly cost for RAG at scale."""
    # Embedding cost (re-index 1x per week)
    docs_per_gpu_second = 500  # rough throughput for bge-small on A10G
    embed_seconds = num_docs / docs_per_gpu_second
    embed_gpu_hours = (embed_seconds / 3600) * 4  # 4x per month (weekly)
    embed_cost = embed_gpu_hours * gpu_hourly_cost
    # Index storage (RAM)
    dim = 768  # bge-small dimension
    storage_gb = num_docs * dim * 4 / (1024**3)  # 4 bytes per float32
    ram_monthly_cost = storage_gb * 0.005  # $0.005/GB-month (cloud RAM)
    # Query serving
    serving_gpu_hours = queries_per_month * 0.05 / 3600  # 50ms per query
    serving_cost = serving_gpu_hours * gpu_hourly_cost
    # LLM generation ($0.01/1K input tokens, assume 3K tokens input per query)
    llm_cost = queries_per_month * (3 / 1000) * 0.01
    return {
        "embedding_monthly": embed_cost,
        "storage_monthly": ram_monthly_cost,
        "serving_monthly": serving_cost,
        "llm_monthly": llm_cost,
        "total_monthly": embed_cost + ram_monthly_cost + serving_cost + llm_cost,
        "cost_per_query": (embed_cost + ram_monthly_cost + serving_cost + llm_cost) / queries_per_month
    }
```

## Try It Yourself
Take 1M documents from a public dataset (Wikipedia, C4, or Common Crawl extract). Set up a distributed embedding pipeline using Ray on 4 GPUs (or simulate with CPU workers). Build a FAISS GPU index and benchmark retrieval latency at 1K, 10K, 100K, and 1M documents. Plot the latency curve — where does it cross the 100ms threshold? Implement a hybrid sharding strategy: shard by document category, route queries to the relevant shard. Measure: (a) latency improvement from sharding, (b) recall impact from potential misrouting, (c) throughput in queries/second. Build a cost model for running this system at 10M documents and 10M queries/month.

## Real-World RAG Connection
Ray powers distributed ML workloads at OpenAI, Uber, and Ant Group. FAISS GPU indexes serve billion-scale vector search at Meta (FAISS was originally built for Facebook's similarity search). Kafka-based streaming ingestion is the standard for real-time RAG at companies like Notion (indexing user documents) and Coda (AI-powered workspaces). NVIDIA's cuML and RAFT libraries are the GPU-acceleration standard for vector operations in production RAG pipelines.

## Common Pitfalls
**Pitfall:** Ray workers all load the embedding model independently, each consuming 2-4GB of GPU memory, so 8 workers on one GPU OOM before processing any documents. **Fix:** Use a shared model pattern — one worker loads the model onto the GPU and other workers send batches to it. Alternatively, use vLLM's embedding API to serve the model and have all workers call it. Calculate GPU memory: model size + batch activations + KV cache + overhead.

**Pitfall:** Building the FAISS index on a single machine works at 1M vectors but fails at 10M because the index does not fit in RAM. **Fix:** Use distributed FAISS with index sharding (IndexShards) or a distributed vector DB (Milvus, Qdrant, Weaviate) that handles sharding and replication transparently. Prefer managed vector DBs at 100M+ scale unless you have a dedicated infrastructure team.

**Pitfall:** Streaming ingestion with Kafka works in development but fails in production when a burst of 100K documents arrives and the embedding workers fall behind, causing ingestion lag to spike to hours. **Fix:** Implement backpressure — Kafka consumer groups auto-scale embedding workers based on consumer lag. Use a dead-letter queue for documents that fail embedding (malformed, too long). Monitor ingestion lag p95 and p99 and alert if it exceeds your target.

## Next Steps
Read the Ray documentation for distributed ML. Study the FAISS GPU documentation and the NVIDIA RAFT library. Take rag_for_code to extend RAG scaling techniques to code repositories.
