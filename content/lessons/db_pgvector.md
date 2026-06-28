---
id: db_pgvector
title: PostgreSQL + pgvector
tier: senior
difficulty: advanced
estimated_minutes: 25
module: databases
prerequisites: [py_async]
tags: [postgresql, pgvector, hnsw, hybrid-search, vector-database]
---

## Concept Introduction

pgvector turns your existing PostgreSQL instance into a vector database, eliminating the need to run a separate service like Pinecone or ChromaDB. For teams already managing Postgres in production, pgvector means one less service to monitor, back up, and secure. This lesson covers index selection, hybrid search with full-text, and the pgvector-vs-specialized-DB tradeoff.

## How It Works

pgvector adds a `vector(N)` column type and three distance operators: `<->` (L2), `<=>` (cosine), and `<#>` (inner product). You create an index with either IVFFlat or HNSW. IVFFlat partitions vectors into clusters (lists) and searches only nearby clusters -- faster to build, less memory, but lower recall. HNSW builds a multi-layer navigable small-world graph -- higher recall and faster query time, but slower builds and higher memory. For production RAG where queries vastly outnumber inserts, HNSW is almost always the right choice unless you are memory-constrained.

The architectural advantage of pgvector is hybrid search in a single query. You can combine a vector similarity clause with PostgreSQL's built-in full-text search (`tsvector`/`tsquery`) using a fused score: `0.7 * vector_score + 0.3 * text_score`. No data duplication, no consistency headaches between two databases. The query runs in a single transaction with a single connection.

The pgvector vs Pinecone/ChromaDB decision hinges on three factors. First, scale: pgvector handles up to roughly 10 million vectors comfortably on a single instance; beyond that, specialized databases with quantization and sharding pull ahead. Second, operational simplicity: if you already have Postgres in production, pgvector adds zero operational overhead. Third, filtering: pgvector's SQL `WHERE` clauses let you filter on any column (dates, tags, user IDs) before or after vector search, while many vector databases have limited metadata filtering.

## Code Examples

```sql
-- Enable extension and create table
CREATE EXTENSION vector;
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index: high query performance, higher build cost
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Hybrid search: vector + full-text
SELECT content,
       0.7 * (1 - (embedding <=> $1::vector)) +
       0.3 * ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2))
       AS score
FROM documents
WHERE embedding <=> $1::vector < 0.8  -- pre-filter by vector
ORDER BY score DESC
LIMIT 10;
```

```python
import asyncpg
import numpy as np

async def hybrid_search(conn, query_vec: list[float], keyword: str) -> list[dict]:
    rows = await conn.fetch("""
        SELECT content, 0.7 * (1 - (embedding <=> $1::vector)) +
               0.3 * ts_rank(to_tsvector('english', content),
                             plainto_tsquery('english', $2)) AS score
        FROM documents
        ORDER BY score DESC LIMIT 10
    """, query_vec, keyword)
    return [dict(r) for r in rows]
```

## Try It Yourself

Start a Postgres container with pgvector: `docker run -e POSTGRES_PASSWORD=test -p 5432:5432 pgvector/pgvector:pg16`. Create a documents table, insert 10,000 rows with random 1536-dim vectors, then benchmark a cosine similarity query with and without the HNSW index. Create a GIN index on a `tsvector` column and benchmark the hybrid query.

## Real-World RAG Connection

A legal-tech company stores case law in Postgres with pgvector. When a lawyer searches for "precedent on force majeure in construction contracts," the hybrid query uses the vector embedding for semantic matching and the full-text index for exact legal term matching, fused into a single ranked result set -- all within one database that their ops team already knows how to back up and replicate.

## Common Pitfalls

- **Forgetting to set `ef_search` at query time.** HNSW uses `ef_search` (query-time parameter, default 40) to control search scope. A value too low produces poor recall. Set it dynamically: `SET hnsw.ef_search = 100;` before queries.
- **Using IVFFlat without periodic rebuilding.** IVFFlat clusters are built once and drift as data changes. Schedule `REINDEX INDEX CONCURRENTLY` to maintain recall.
- **Comparing pgvector to Pinecone on vector search alone.** The real value is SQL joins, transactions, and existing backup infrastructure -- not raw QPS.

## Next Steps

- pgvector GitHub README for advanced HNSW tuning parameters
- Lesson: **Hybrid Search** for RRF and weighting strategies
