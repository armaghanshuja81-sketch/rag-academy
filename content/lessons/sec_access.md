---
id: sec_access
title: Access Control for RAG
tier: senior
difficulty: advanced
estimated_minutes: 25
module: security
prerequisites: [flask_middleware, sec_pii]
tags: [security, access-control, acl, authorization, oauth, oidc]
---

## Concept Introduction

A RAG system without access control will serve HR documents to engineering interns and confidential financials to contractors. Unlike traditional databases where row-level security is built into the query engine, vector databases have minimal built-in access control. You must implement document-level authorization in the application layer, and the architectural choice -- filtering at query time vs at index time -- has profound latency, cost, and correctness implications. This lesson covers ACL architectures, integration with OAuth/OIDC, and the query-time vs index-time tradeoff.

## How It Works

Document-level ACLs attach a list of authorized principals (user IDs, group IDs, roles) to each document chunk at ingestion time. At query time, the retriever must exclude chunks the caller cannot access. There are two architectures for doing this.

Query-time filtering (post-retrieval filtering) retrieves K chunks normally, then discards chunks the caller cannot access, keeping the top K' that remain. This is simple to implement and works with any vector database. The fatal flaw: if a user can only access 1% of documents and you retrieve K=10, after filtering you may have 0-2 results. The vector search exhausted its budget on inaccessible documents. Mitigation: retrieve a larger K (100-200) and filter. This works but multiplies latency and cost.

Index-time filtering (pre-retrieval filtering) applies access control as part of the vector search. In pgvector, you add `WHERE user_id = ANY($allowed_ids)` to the SQL query. In Pinecone, you use metadata filtering with `user_id` in the filter expression. This guarantees every retrieved chunk is authorized and no retrieval budget is wasted. The disadvantage: ACL changes require updating metadata on every affected vector (a re-upsert, not a re-embed), and group membership changes trigger bulk metadata updates.

The modern approach combines both: index-time filtering for the primary access dimension (e.g., `organization_id`) and query-time filtering for fine-grained permissions (e.g., `project_id` within the organization). This avoids the N+1 index problem while ensuring precision.

OAuth/OIDC integration: the JWT from your identity provider (Auth0, Okta, Azure AD) carries user claims. After JWT validation in middleware (see Flask Middleware lesson), extract the user ID and group memberships, then inject them into every retrieval call. The retriever uses these claims as filter parameters without the user's code needing to know about authorization logic.

## Code Examples

```python
async def authorized_retrieval(
    query_embedding: list[float],
    user_id: str,
    user_groups: list[str],
    db_pool,
    top_k: int = 10,
) -> list[dict]:
    """Index-time filtering: ACL check in SQL WHERE clause."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT content, 1 - (embedding <=> $1::vector) AS score
            FROM documents
            WHERE owner_id = $2
               OR group_id = ANY($3::text[])
               OR is_public = true
            ORDER BY embedding <=> $1::vector
            LIMIT $4
        """, query_embedding, user_id, user_groups, top_k)
    return [dict(r) for r in rows]

# Two-tier: org at index time, project at query time
async def two_tier_retrieval(
    query_embedding: list[float],
    org_id: str,
    project_ids: list[str],
    db_pool,
) -> list[dict]:
    async with db_pool.acquire() as conn:
        # Org filter at index time (always applied)
        rows = await conn.fetch("""
            SELECT content, metadata, 1 - (embedding <=> $1::vector) AS score
            FROM documents
            WHERE org_id = $2
            ORDER BY embedding <=> $1::vector
            LIMIT 100
        """, query_embedding, org_id)
    # Fine-grained project filter at query time (post-filter)
    return [dict(r) for r in rows if json.loads(r["metadata"]).get("project_id") in project_ids][:10]
```

```python
# Middleware that injects claims into Flask g
@app.before_request
def extract_claims():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    claims = jwt.decode(token, options={"verify_signature": False})  # Verified by gateway
    g.user_id = claims["sub"]
    g.groups = claims.get("groups", [])
    g.org_id = claims.get("org_id")

@app.route("/search")
def search():
    return authorized_retrieval(embed(request.args["q"]), g.user_id, g.groups, db_pool)
```

## Try It Yourself

Create a document table with an `owner_id` column. Insert 1,000 documents: 500 owned by user A, 500 by user B. Embed a query and run retrieval with and without the `WHERE owner_id = 'user_a'` filter. Verify that without the filter, user A sees user B's documents. Then simulate an ACL change: update the `owner_id` on 50 documents from user A to user B, and verify that subsequent queries reflect the new permissions.

## Real-World RAG Connection

An enterprise knowledge base at a Fortune 500 company serves 50,000 employees across 200 departments. Each document has a `department_id` ACL. Index-time filtering on `department_id` in pgvector ensures marketing queries never retrieve engineering documents, and vice versa. The query `WHERE department_id = $dept_id` adds 2ms to retrieval latency and eliminates an entire class of data leakage incidents.

## Common Pitfalls

- **Post-filtering with fixed K.** Retrieve 10, filter to 3, send 3 to the LLM. The LLM has 30% of the context it expects. Always retrieve a larger K' = K / selectivity_estimate, then filter, then trim to K.
- **Forgetting that group membership changes.** If user X leaves the "executives" group, their cached JWT still grants executive access until it expires. Keep JWT lifetimes short (15-30 minutes) for permission-sensitive applications.
- **Embedding ACL metadata in the vector.** Do not prepend "Document for HR department" to the text before embedding, expecting the embedding to capture the ACL concept. Embeddings are for semantic similarity, not access control. Use explicit WHERE clauses.

## Next Steps

- OAuth 2.0 and OIDC specifications for claims-based authorization
- Lesson: **Multi-Tenant RAG** for cross-tenant isolation
