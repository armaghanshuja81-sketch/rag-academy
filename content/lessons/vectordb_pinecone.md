---
id: vectordb_pinecone
title: "Pinecone: Managed Vector DB"
tier: senior
difficulty: advanced
estimated_minutes: 25
module: databases
prerequisites: [db_pgvector]
tags: [pinecone, vector-database, serverless, metadata-filtering, multi-tenant]
---

## Concept Introduction

Pinecone abstracts away every operational concern of running a vector database: no sharding to configure, no index rebuilds to schedule, no replication to set up. For teams whose core competency is not database operations, Pinecone converts infrastructure engineering into an API call. The tradeoff is cost -- at scale, Pinecone is 5-10x more expensive per query than pgvector on your own hardware. This lesson covers the Pinecone architecture, metadata filtering performance, multi-tenant patterns with namespaces, and the break-even analysis for managed vs self-hosted.

## How It Works

Pinecone offers two index architectures: pod-based and serverless. Pod-based indexes provision fixed hardware resources (pods) and you choose the pod type (s1 for storage, p1 for performance). You pay for the pod 24/7 regardless of query volume. Serverless indexes separate storage from compute, scaling to zero when idle and billing per operation. The architectural decision: pod-based has predictable cost and consistent latency; serverless has lower cost at low/erratic volume but cold-start latency of 2-5 seconds on the first query after idle.

Metadata filtering in Pinecone uses single-stage filtering with a clever optimization: Pinecone pre-filters the candidate set using metadata before running ANN. If you filter `category = "legal" AND date > 2024-01-01`, Pinecone first applies the metadata filter, then runs vector search on the surviving vectors. The performance hit is proportional to filter selectivity: filtering to 0.1% of the corpus is fast; filtering to 80% is essentially unfiltered search. The 10,000-result cap in Pinecone means if your metadata filter already reduces candidates below 10K, you get exact (non-approximate) results.

Namespaces are Pinecone's multi-tenancy primitive. Each namespace is a logically isolated partition within an index -- vectors in namespace A are invisible to queries in namespace B. For a SaaS with 500 customers, you can use 500 namespaces in a single index. The alternative is one index per customer, which gives stronger isolation and independent scaling, but Pinecone caps indexes per project (typically 100). Namespaces are the pragmatic default; separate indexes are for large customers with dedicated resource requirements.

## Code Examples

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="your-api-key")
pc.create_index(
    name="rag-docs",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

index = pc.Index("rag-docs")

# Upsert with metadata for filtering
index.upsert(vectors=[
    {"id": "doc_1", "values": embedding_1,
     "metadata": {"category": "legal", "date": "2024-03-15", "status": "published"}},
])

# Metadata-filtered query
results = index.query(
    vector=query_embedding,
    top_k=10,
    filter={"category": "legal", "date": {"$gte": "2024-01-01"}},
    include_metadata=True,
)

# Multi-tenant with namespaces
index.upsert(vectors=tenant_a_chunks, namespace="tenant_a")
index.upsert(vectors=tenant_b_chunks, namespace="tenant_b")

# Query scoped to tenant A only
results = index.query(vector=query_embedding, top_k=10, namespace="tenant_a")
```

## Try It Yourself

Create a free Pinecone serverless index. Insert 10,000 vectors with metadata including a `category` field (10 categories, 1,000 each). Run 100 queries with no filter, then 100 queries filtered to a single category. Measure latency. Category-filtered queries should be faster (smaller candidate set). Then create a second namespace, insert 1,000 different vectors, and verify that cross-namespace queries return zero results.

## Real-World RAG Connection

A legal research platform stores 50 million case embeddings in Pinecone serverless. Each customer (law firm) has a dedicated namespace. Metadata filtering on `jurisdiction` and `court` narrows the candidate set from millions to thousands before vector search runs, keeping p99 latency under 200ms despite the massive index.

## Common Pitfalls

- **Using pod-based for spiky traffic.** A p1 pod handles 200 QPS consistently. If your traffic varies from 0 to 500 QPS, you either overpay for idle capacity or throttle at peak. Serverless handles this naturally.
- **Browsing metadata without vector search.** Pinecone is a vector database, not a metadata store. `$in` filters with arrays of 100+ values become slow. Store your primary metadata in Postgres and use Pinecone only for vector operations.
- **Ignoring the dimension limit.** Serverless indexes cap at 20,000 dimensions; pod-based at 2,000. OpenAI's `text-embedding-3-large` at 3072 dimensions exceeds the pod-based limit at time of writing.

## Next Steps

- Pinecone documentation on filter expressions and performance tuning
- Lesson: **Multi-Tenant RAG** for namespace isolation patterns at scale
