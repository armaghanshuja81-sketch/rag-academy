---
id: vectordb_supabase
title: Supabase pgvector Stack
tier: bonus
difficulty: advanced
estimated_minutes: 30
module: vector_dbs
prerequisites: [db_pgvector, chromadb]
tags: [vector-db, supabase, pgvector, multi-tenant]
---

## Concept Introduction

Supabase is PostgreSQL with a built-in API layer, auth system, and real-time
subscriptions. Adding pgvector to that stack gives you a production-ready,
multi-tenant RAG backend in a single infrastructure component -- no separate
vector database, no custom auth wiring, no manual API construction. By the end
of this lesson you will know how to deploy a Supabase pgvector RAG backend with
Row-Level Security for multi-tenant isolation, edge functions for retrieval,
and user auth integrated at every layer.

## How It Works

The Supabase pgvector stack collapses three infrastructure concerns into one
Postgres database running inside Supabase's managed cloud:

1. **Vector storage**: pgvector extension stores embeddings alongside relational
   data. Your `documents` table has columns for text, embedding (1536-dim or
   384-dim vector), owner_id, and metadata JSONB. Queries can filter by owner
   AND rank by vector similarity in a single SQL statement.

2. **Auth integration**: Supabase Auth (ported from Netlify GoTrue) provides
   email/password, OAuth, and SSO out of the box. JWTs are validated at the
   Postgres level. Each query's `auth.uid()` matches against the `owner_id`
   column automatically, making multi-tenant isolation a schema-level property.

3. **Row-Level Security (RLS)**: Without RLS, every user can query every
   document. With RLS policies, Postgres enforces that `SELECT * FROM documents`
   only returns rows where `owner_id = auth.uid()` -- even for vector similarity
   queries. This is non-negotiable for SaaS products and enterprise deployments.
   You write one RLS policy and the database handles enforcement.

4. **Edge functions**: Deno-based serverless functions run close to users. A
   `retrieve` edge function accepts a query string, calls the embedding API, runs
   a pgvector similarity search through the Supabase client, and returns ranked
   chunks -- all inside a 50-line function that deploys with `supabase functions
   deploy retrieve`.

The combined advantage: you avoid running a separate vector database (Pinecone,
Weaviate), a separate auth service (Auth0, Clerk), and a separate API server
(Flask, FastAPI). For startups shipping their first RAG product, this reduces
infrastructure from 4 services to 1.

## Code Examples

Schema for a multi-tenant RAG backend with RLS:

```sql
-- Run in Supabase SQL Editor
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(384),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- HNSW index for fast approximate nearest neighbor
create index on documents using hnsw (embedding vector_cosine_ops);

-- RLS: users can only see their own documents
alter table documents enable row level security;
create policy "Users own their documents" on documents
  for all using (owner_id = auth.uid());
```

Edge function for retrieval with auth baked in:

```typescript
// supabase/functions/retrieve/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { query, embedding } = await req.json();

  // Supabase client auto-injects auth context from JWT
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  // RLS ensures user only searches their own documents
  const { data, error } = await supabaseClient.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5
  });

  if (error) return new Response(JSON.stringify({ error }), { status: 400, headers: corsHeaders });
  return new Response(JSON.stringify({ results: data }), { headers: corsHeaders });
});
```

```sql
-- RPC function for vector similarity (add in SQL Editor)
create or replace function match_documents(
  query_embedding vector(384),
  match_threshold float default 0.7,
  match_count int default 5
) returns table (
  id uuid, content text, metadata jsonb, similarity float
) language sql stable as $$
  select id, content, metadata,
         1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding <=> query_embedding < 1 - match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

## Try It Yourself

Create a free Supabase project. Run the SQL schema above in the SQL Editor.
Insert 3 documents with embeddings (use `all-MiniLM-L6-v2` locally, then paste
the vectors). Create two user accounts. Verify that User A's queries never return
User B's documents -- then intentionally disable RLS and observe the data leak.
Re-enable it. This 20-minute exercise demonstrates why RLS is the non-negotiable
foundation of multi-tenant RAG.

## Real-World RAG Connection

A SaaS company building a "Chat with your company docs" product for 500
customers needs every query filtered by tenant. Without RLS, an application bug
exposes Customer A's documents to Customer B -- a GDPR-violating data breach.
With the Supabase pgvector stack and RLS policies, the database guarantees
isolation regardless of application bugs. This architecture choice is what turns
a prototype into a SOC2-compliant product.

## Common Pitfalls

- **Pitfall:** Enabling RLS without writing policies, which defaults to denying
  all access. Every query returns zero rows with no obvious error. **Fix:**
  After `alter table documents enable row level security`, immediately create at
  least one `using` policy. Test with `select * from documents` as an
  authenticated user before building the application layer.
- **Pitfall:** Using `vector(1536)` (OpenAI dimension) when your embedding model
  outputs 384-dimensional vectors, wasting storage and compute. **Fix:** Match
  the vector dimension to your embedding model. Check `len(embedding)` before
  creating the schema.
- **Pitfall:** Deploying the edge function without a `cors.ts` shared file,
  causing browser requests to fail on preflight. **Fix:** Supabase CLI's
  `supabase functions new` includes CORS headers as a shared import. Always
  include them, even if you plan to call from a server -- you will eventually
  want a browser client.

## Next Steps

- **Practice:** Build the full stack: Supabase auth sign-up flow, document upload
  with embedding generation, and a chat UI that queries the `match_documents`
  RPC. Deploy all three via `supabase functions deploy`.
- **Read:** [Supabase pgvector Guide](https://supabase.com/docs/guides/database/extensions/pgvector) --
  the official documentation covers index types, performance tuning, and hybrid
  search
- **Related:** [vectordb_pinecone](/lesson/vectordb_pinecone) -- compare the
  managed vector DB approach; [db_pgvector](/lesson/db_pgvector) -- raw pgvector
  fundamentals before the Supabase convenience layer
