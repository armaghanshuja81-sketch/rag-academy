---
id: chromadb
title: ChromaDB Fundamentals
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: vector_dbs
prerequisites: [vectordb_what, embeddings]
tags: [chromadb, vector-database, similarity-search]
---

## Concept Introduction

ChromaDB is the fastest path from zero to a working vector database. It runs
locally, requires no server setup, and can auto-embed your text using
sentence-transformers. By the end of this lesson you will create collections,
add documents with embeddings, query by semantic similarity, filter by
metadata, and persist your data to disk.

## How It Works

ChromaDB stores documents, their embeddings (vectors), and optional metadata in
collections. A collection is like a table in SQL — it groups related vectors
and supports add, query, update, upsert, and delete operations.

Under the hood, ChromaDB embeds text using a configurable embedding function
and indexes vectors for approximate nearest neighbor (ANN) search. When you
query with text, ChromaDB embeds the query, then finds the stored vectors
closest to the query vector using cosine distance (default) or L2.

ChromaDB runs in two modes: ephemeral (in-memory, gone when the process exits)
and persistent (saved to disk at a path you specify). Persistent mode is what
you will use for any real project — it survives restarts and can handle
collections with hundreds of thousands of documents.

Metadata filtering lets you narrow similarity search to documents matching
specific criteria: date ranges, document types, source URLs, author names.
This filtering happens after the ANN search, so you always get the top-k
semantically similar results within the filtered subset.

## Code Examples

Install and create your first collection:

```bash
pip install chromadb sentence-transformers
```

```python
import chromadb
from chromadb.utils import embedding_functions

# Persistent client — data survives restart
client = chromadb.PersistentClient(path="./chroma_data")

# Embedding function — converts text to 384-dim vectors
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Create a collection with this embedding function
collection = client.create_collection(
    name="knowledge_base",
    embedding_function=ef,
    metadata={"description": "RAG Academy knowledge base"}
)

print(f"Collection created: {collection.name}")
print(f"Collection count: {collection.count()}")
```

Add documents with metadata:

```python
documents = [
    "The Eiffel Tower is a wrought-iron lattice tower in Paris, France.",
    "Python was created by Guido van Rossum and first released in 1991.",
    "RAG stands for Retrieval-Augmented Generation and combines search with LLMs.",
    "Vector databases store embeddings and enable semantic similarity search.",
    "Mount Everest is the highest mountain on Earth at 8,848 meters.",
]
metadatas = [
    {"topic": "geography", "source": "encyclopedia", "year": 2023},
    {"topic": "programming", "source": "docs", "year": 2024},
    {"topic": "ai", "source": "paper", "year": 2024},
    {"topic": "databases", "source": "tutorial", "year": 2024},
    {"topic": "geography", "source": "encyclopedia", "year": 2023},
]
ids = [f"doc_{i}" for i in range(len(documents))]

collection.add(documents=documents, metadatas=metadatas, ids=ids)
print(f"Added {len(documents)} documents")
```

Semantic search — find relevant documents by meaning:

```python
# Query by text — ChromaDB embeds automatically
results = collection.query(
    query_texts=["Tell me about AI techniques for search"],
    n_results=3,
)
print("Text Query Results:")
for i, (doc, dist) in enumerate(zip(results["documents"][0],
                                      results["distances"][0])):
    print(f"  {i+1}. [distance: {dist:.3f}] {doc}")

# Query with metadata filter — only programming/AI docs since 2024
results = collection.query(
    query_texts=["How to build search systems?"],
    n_results=2,
    where={"year": {"$gte": 2024}},
)
print("\nFiltered Results (year >= 2024):")
for doc in results["documents"][0]:
    print(f"  - {doc}")
```

Update and delete operations:

```python
# Update a document — replace text and metadata
collection.update(
    ids=["doc_0"],
    documents=["The Eiffel Tower in Paris is 330 meters tall and was built in 1889."],
    metadatas=[{"topic": "geography", "source": "encyclopedia", "year": 2024}],
)

# Upsert — add if new, update if existing
collection.upsert(
    documents=["SQLite is a lightweight embedded database engine."],
    metadatas=[{"topic": "databases", "source": "docs", "year": 2024}],
    ids=["doc_5"],
)

# Delete by ID
collection.delete(ids=["doc_3"])

# Get by ID
doc = collection.get(ids=["doc_0"])
print(f"Updated doc_0: {doc['documents'][0]}")

# Total count
print(f"Collection size: {collection.count()}")
```

Query by embedding directly (when you have pre-computed vectors):

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
query_vector = model.encode("search technology").tolist()

results = collection.query(
    query_embeddings=[query_vector],
    n_results=2,
)
print("Embedding Query Results:")
for doc in results["documents"][0]:
    print(f"  - {doc}")
```

## Try It Yourself

Build a mini document search engine:
1. Create a persistent ChromaDB collection with the sentence-transformers
   embedding function
2. Add 8 documents spanning 3-4 different topics with metadata (topic, source,
   date)
3. Write a `search(query, topic=None, min_year=None)` function that queries
   with optional metadata filters
4. Test that filtering by topic returns only documents from that topic while
   still ranking by semantic similarity

```python
import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./my_search_engine")
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
collection = client.get_or_create_collection(
    name="documents", embedding_function=ef
)

def search(query, topic=None, min_year=None, n=3):
    where = {}
    if topic:
        where["topic"] = topic
    if min_year:
        where["year"] = {"$gte": min_year}
    return collection.query(
        query_texts=[query],
        n_results=n,
        where=where if where else None,
    )

# Add your 8 documents, then test:
# print(search("AI systems"))               # All topics
# print(search("AI systems", topic="ai"))   # Only AI docs
```

## Real-World RAG Connection

ChromaDB is the retrieval engine in the RAG pipeline. When you build a RAG
application, your ingestion script chunks documents, generates embeddings with
sentence-transformers (or an API embedding service), and stores everything in
ChromaDB. At query time, the user's question is embedded and compared against
every stored vector. The top-k most similar chunks are retrieved, concatenated
into a prompt, and sent to the LLM for answer generation. If your collection
is poorly organized or your metadata isn't queryable, the LLM generates answers
from the wrong context.

## Common Pitfalls

- **Pitfall:** Using ephemeral client (`chromadb.Client()`) and losing all data
  when the script exits. **Fix:** Always use `chromadb.PersistentClient(path=...)`
  for any project you care about.
- **Pitfall:** Mixing embedding models — adding documents with
  `all-MiniLM-L6-v2` but querying with an OpenAI embedding, or changing the
  embedding function after data is stored. **Fix:** Record the embedding model
  name in collection metadata and never change it for an existing collection.
- **Pitfall:** Returning too few results (`n_results=1`) and missing relevant
  context, or too many (`n_results=50`) and overflowing the LLM's context
  window. **Fix:** Start with `n_results=5` and tune based on your chunk size
  and the LLM's context limit.

## Next Steps

- **Practice:** Take 20 paragraphs from Wikipedia articles on different topics,
  chunk each into individual sentences, store them in ChromaDB, and write a
  function that answers questions by retrieving the top 5 sentences and
  printing them.
- **Read:** [ChromaDB Usage Guide](https://docs.trychroma.com/usage-guide)
- **Related:** [rag_pipeline_full](/lesson/rag_pipeline_full) — connect
  ChromaDB retrieval to an LLM to build your first complete RAG pipeline
