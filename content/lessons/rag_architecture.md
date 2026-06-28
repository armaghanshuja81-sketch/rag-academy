---
id: rag_architecture
title: The RAG Architecture
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: rag
prerequisites: [rag_what, embeddings_deep]
tags: [rag, architecture, pipeline, ingestion]
---

## Concept Introduction

A RAG pipeline is two separate workflows sharing one knowledge base. The ingestion workflow loads documents, breaks them into chunks, embeds them, and stores the vectors. The query workflow takes a user question, embeds it, retrieves relevant chunks, formats them into a prompt, and calls the LLM. By the end of this lesson you'll draw both pipelines from memory and identify the failure mode at every stage.

## How It Works

The ingestion pipeline runs offline, whenever new documents are added:

1. **Load:** Read documents from files (PDF, TXT, HTML, Markdown). Output: raw text strings, one per document.
2. **Chunk:** Split text into overlapping segments. A 10-page document becomes 30-50 chunks of ~500 tokens each. Overlap (50-100 tokens) prevents splitting in the middle of a sentence that connects two ideas.
3. **Embed:** Pass each chunk through an embedding model (sentence-transformers, OpenAI embeddings). Output: a vector of 384-1536 floats representing semantic meaning.
4. **Store:** Insert vectors and original text into a vector database (ChromaDB, FAISS, Pinecone). The DB indexes vectors for fast nearest-neighbor search and stores metadata (source filename, page number, chunk index).

The query pipeline runs online, triggered by each user request:

1. **Embed query:** Convert the user's natural language question into a vector using the same embedding model. Using a different model than ingestion breaks everything — vectors from different models live in incompatible spaces.
2. **Search:** Query the vector database for the k nearest neighbors. Returns k (text, score) pairs. k=4 to 8 is typical; higher values add noise, lower values miss context.
3. **Augment:** Insert retrieved text into a prompt template. A simple template: "Context: {chunks}\n\nQuestion: {question}\n\nAnswer:". The prompt is the instruction interface between retrieved knowledge and the LLM.
4. **Generate:** Send the augmented prompt to the LLM. The model reads the context and produces an answer grounded in the retrieved text.
5. **Return:** Send the answer (often with source citations) back to the user.

The data flow: `Document → Chunks → Embeddings → Vector DB ← Embed(Query) ← User Question → LLM → Answer`

## Code Examples

The ingestion pipeline:

```python
from sentence_transformers import SentenceTransformer
import chromadb

# Load and chunk (simplified — production uses LangChain loaders)
chunks = [
    "RAG combines retrieval with generation.",
    "The retriever finds relevant documents.",
    "The generator produces grounded answers.",
    "Embedding models convert text to vectors.",
]

# Embed
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(chunks).tolist()

# Store
client = chromadb.Client()
collection = client.create_collection("knowledge_base")
collection.add(
    documents=chunks,
    embeddings=embeddings,
    ids=[f"chunk_{i}" for i in range(len(chunks))],
)
print(f"Stored {collection.count()} chunks")
```

The query pipeline:

```python
# Same embedding model as ingestion — this is critical
query = "How does RAG work?"
query_embedding = model.encode([query]).tolist()

# Retrieve
results = collection.query(query_embeddings=query_embedding, n_results=3)
context = "\n".join(results["documents"][0])
print(f"Retrieved: {results['documents'][0]}")

# Augment — build the prompt
prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"

# Generate — call your LLM (pseudocode — replace with actual API call)
# answer = llm.invoke(prompt)
print(f"Prompt to LLM:\n{prompt}")
```

Where naive RAG fails and what advanced RAG adds at each stage:

```python
# Naive RAG: one index, basic retrieval, simple prompt
naive = retrieve(query, top_k=4)  # Misses relevant docs on page 2 of results

# Advanced RAG additions:
# 1. Query transformation — rephrase the question before embedding
# 2. Hybrid search — combine vector + keyword (BM25) results
# 3. Re-ranking — score retrieved docs with a cross-encoder, keep top 3 of 10
# 4. Source filtering — only search documents the user has permission to see
```

## Try It Yourself

Take a set of 10 short text passages on a single topic (use Wikipedia paragraphs or your own notes). Run the full pipeline: chunk if needed, embed with `all-MiniLM-L6-v2`, store in ChromaDB, then query. Measure: (1) does the top-1 retrieved chunk actually answer your question? (2) does the prompt format give the LLM enough context? Experiment with k=1, k=3, and k=8 — where does retrieval quality plateau?

## Real-World RAG Connection

Every production RAG failure traces to a specific pipeline stage. The LLM hallucinates → either retrieval returned irrelevant chunks (fix the embedding model or add re-ranking) or the prompt didn't constrain the model sufficiently (fix the prompt template). Answers are outdated → ingestion hasn't run since the source documents were updated (add a sync schedule). The system is slow → embedding on CPU for 2000-character queries (batch queries or use a smaller model). You debug RAG by isolating stages, not by tweaking the entire pipeline at once.

## Common Pitfalls

- **Pitfall:** Using different embedding models for ingestion and query. A chunk embedded with `text-embedding-3-large` and a query embedded with `all-MiniLM-L6-v2` produces vectors in different semantic spaces. Similarity scores become meaningless. **Fix:** Store the embedding model name in vector metadata and validate at query time that the same model is used.
- **Pitfall:** Skipping chunk overlap. A user asks about two concepts that appear in adjacent sentences, but the chunk boundary splits them into separate chunks. Neither chunk alone answers the question. **Fix:** Always use overlap (10-20% of chunk size) and test retrieval quality on questions deliberately designed to span boundaries.
- **Pitfall:** Using k=10 because "more context is better." Noise from irrelevant chunks dilutes the useful context and the LLM gets confused or ignores everything. **Fix:** Start with k=4 and increase only when retrieval recall is low (use eval metrics, not intuition).

## Next Steps

- **Practice:** Build the ingestion and query pipeline as separate Python scripts. Ingest 5 documents, then query from a second script. This mirrors production, where ingestion and query often run as different services.
- **Read:** [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- **Related:** [rag_pipeline_full](/lesson/rag_pipeline_full) — implement both pipelines as a reusable Python class with error handling
