---
id: sec_multitenant
title: Multi-Tenant RAG
tier: senior
difficulty: advanced
estimated_minutes: 25
module: security
prerequisites: [sec_access, vectordb_pinecone]
tags: [multi-tenant, isolation, namespaces, embedding-models, cost-attribution]
---

## Concept Introduction

A multi-tenant RAG system serves multiple customers from the same infrastructure while guaranteeing that tenant A's documents are invisible to tenant B's queries. This is fundamentally harder than multi-tenant CRUD because vector search has no native `WHERE tenant_id = X` unless you build it. The architecture you choose -- namespace isolation, index-per-tenant, or metadata filtering -- determines your isolation strength, per-tenant cost tracking, and operational complexity. This lesson covers isolation strategies, per-tenant customization, and cost attribution.

## How It Works

Three isolation architectures exist, trading off strictness against operational overhead. Namespace isolation (Pinecone native, or simulated via a `tenant_id` prefix in vector IDs with pgvector) means every query includes a namespace parameter that scopes the search to one tenant. This is fast, simple, and prevents cross-tenant leakage at the database level. The downside: Pinecone namespaces share the same underlying pods, so a noisy tenant can degrade performance for all tenants.

Index-per-tenant gives each customer a physically separate vector index. This provides maximum isolation (no shared compute, no performance interference) and lets you size indexes per tenant. The limitation: most managed vector databases cap indexes per project (Pinecone: typically 100 indexes), making this viable only for B2B with tens of large customers, not B2C with thousands.

Metadata filtering (`WHERE tenant_id = X` in pgvector, or filter expressions in Pinecone) is the most flexible but the most dangerous. A single missing `WHERE` clause silently returns cross-tenant results. Every query, every engineer, every code path must remember the filter. For pgvector, use row-level security (RLS) as a safety net: `CREATE POLICY tenant_isolation ON documents FOR SELECT USING (tenant_id = current_setting('app.tenant_id'));`. This enforces filtering at the database level regardless of application code.

Per-tenant embedding models are a differentiator for enterprise RAG. Tenant A deals with legal documents (fine-tuned legal embedding), tenant B has technical documentation (code-aware embedding). Architecturally, you maintain a mapping of `tenant_id -> embedding_model` and route to the correct embedding service per request. The same index can store vectors from different models only if they share the same dimensionality. Otherwise, you need separate per-model indexes.

Cost attribution requires tracking every billable operation per tenant. Instrument embedding calls (tokens), vector queries (count), and LLM generations (tokens) with a `tenant_id` dimension in your observability system. This data feeds per-tenant billing and identifies which tenants are outliers driving infrastructure costs.

## Code Examples

```python
# Row-Level Security in PostgreSQL (defense-in-depth for metadata filtering)
async def setup_rls(conn):
    await conn.execute("""
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        CREATE POLICY tenant_isolation ON documents
            FOR SELECT
            USING (tenant_id = current_setting('app.tenant_id')::text);
    """)

async def tenant_scoped_query(conn, embedding, tenant_id: str):
    # RLS enforced at DB level even if application forgets WHERE
    await conn.execute("SET app.tenant_id = $1", tenant_id)
    return await conn.fetch(
        "SELECT content FROM documents ORDER BY embedding <=> $1 LIMIT 10",
        embedding,
    )
```

```python
# Per-tenant embedding model routing
EMBEDDING_MODELS = {
    "legal": {"model": "text-embedding-3-large", "dimensions": 3072, "endpoint": "openai"},
    "technical": {"model": "code-embedding-v2", "dimensions": 768, "endpoint": "custom"},
    "default": {"model": "text-embedding-3-small", "dimensions": 1536, "endpoint": "openai"},
}

async def embed_for_tenant(text: str, tenant_config: dict) -> list[float]:
    model_cfg = EMBEDDING_MODELS.get(tenant_config.get("domain", "default"))
    if model_cfg["endpoint"] == "openai":
        return await openai_embed(text, model_cfg["model"])
    else:
        return await custom_embed(text, model_cfg["model"])

# Cost attribution: emit per-tenant metrics
def record_tenant_usage(tenant_id: str, operation: str, tokens: int, latency_ms: float):
    statsd.gauge(f"tenant.{tenant_id}.{operation}.tokens", tokens)
    statsd.timing(f"tenant.{tenant_id}.{operation}.latency", latency_ms)
```

## Try It Yourself

Set up a pgvector `documents` table with a `tenant_id` column and RLS policies. Insert 500 documents for tenant A and 500 for tenant B. Write a query that "forgets" the `WHERE tenant_id` clause and verify that RLS blocks the cross-tenant access. Then simulate a per-tenant configuration: create a tenant config table with `domain` and `embedding_model` columns, and verify that the routing logic selects the correct model.

## Real-World RAG Connection

A SaaS knowledge management platform serves 2,000 customers on shared pgvector infrastructure. Each customer sees only their own documents via RLS-enforced `tenant_id` filtering. Three enterprise customers on custom contracts get dedicated indexes with fine-tuned embedding models specific to their industry (healthcare, legal, financial). The remaining 1,997 customers share a default embedding model with namespace isolation. Cost per tenant is tracked and billed monthly from the observability data.

## Common Pitfalls

- **Trusting application code for isolation.** A junior engineer removes a `WHERE tenant_id =` clause for debugging and deploys to production. Without RLS or equivalent database-level enforcement, every customer's data is exposed. Always layer: application filter + database-level enforcement.
- **Mixing embedding dimensions in one index.** If tenant A uses 1536-dim vectors and tenant B uses 768-dim, storing both in the same pgvector table corrupts search results. Vector dimensions must match per index or per partition.
- **Noisy-tenant resource exhaustion.** A tenant uploading 100,000 documents in a batch saturates the shared index, degrading query latency for all other tenants. Implement per-tenant rate limiting at the ingestion and query layers.

## Next Steps

- PostgreSQL Row-Level Security documentation
- Lesson: **Rate Limiting & Throttling** for tenant fairness
