---
id: rag_pipeline_full
title: Complete RAG Pipeline
tier: mid
difficulty: intermediate
estimated_minutes: 30
module: rag
prerequisites: [chunking, chromadb]
tags: [rag, pipeline, end-to-end, chromadb]
---

## Concept Introduction

All the RAG theory you've learned so far — embeddings, chunking, vector search, LLM APIs — comes together in one pipeline. This lesson builds a complete, runnable RAG system from scratch: ingest documents, store embeddings, and answer questions with grounded responses. By the end of this lesson you'll have a reusable RAG class that processes documents and answers questions in under 200 lines of Python.

## How It Works

The `RAGPipeline` class encapsulates two workflows behind a clean interface. `ingest(source_dir)` walks a directory of `.txt` files, chunks each document with overlap, embeds every chunk, and stores them in ChromaDB. `query(question, k)` embeds the question, retrieves the top-k chunks, formats a prompt with citations, calls the LLM, and returns both the answer and the source documents that informed it.

The class is designed for reuse across projects: swap the embedding model in `__init__`, change the LLM provider in the `_generate` method, or override chunking logic for different document types. The persistent ChromaDB directory means you ingest once and query many times — restart your script and the knowledge base is still there.

Error handling at each stage is not optional. The embedding model might fail on empty text. The vector store might be corrupted. The LLM might time out. Each failure path gets a specific exception so you know which stage broke and why. A silent failure in production RAG is worse than a crash — the user gets a confident-sounding wrong answer.

## Code Examples

Full RAG pipeline class:

```python
import os
import re
from sentence_transformers import SentenceTransformer
import chromadb
from openai import OpenAI


class RAGPipeline:
    def __init__(self, persist_dir="./chroma_rag", model_name="all-MiniLM-L6-v2"):
        self.embedder = SentenceTransformer(model_name)
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.collection = self.client.get_or_create_collection("documents")

    def chunk_text(self, text, chunk_size=300, overlap=50):
        """Split text into overlapping word chunks."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if len(chunk.split()) >= 20:  # Skip tiny final chunks
                chunks.append(chunk)
        return chunks

    def ingest(self, source_dir):
        """Load all .txt files from directory, chunk, embed, and store."""
        all_ids, all_chunks, all_embeddings, all_metas = [], [], [], []
        for filename in os.listdir(source_dir):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(source_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
            if not text.strip():
                continue

            chunks = self.chunk_text(text)
            for i, chunk in enumerate(chunks):
                chunk_id = f"{filename}_chunk_{i}"
                embedding = self.embedder.encode(chunk).tolist()
                all_ids.append(chunk_id)
                all_chunks.append(chunk)
                all_embeddings.append(embedding)
                all_metas.append({"source": filename, "chunk_index": i})

        if all_ids:
            self.collection.add(
                ids=all_ids,
                documents=all_chunks,
                embeddings=all_embeddings,
                metadatas=all_metas,
            )
        print(f"Ingested {len(all_ids)} chunks from {source_dir}")

    def query(self, question, k=4):
        """Answer a question using retrieved context."""
        if self.collection.count() == 0:
            return "No documents ingested yet. Run .ingest() first.", []

        # Embed and retrieve
        q_embedding = self.embedder.encode(question).tolist()
        results = self.collection.query(query_embeddings=[q_embedding], n_results=k)
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        sources = [
            f"{m['source']} (chunk {m['chunk_index']})" for m in metas
        ]

        # Build prompt with citations
        context = "\n\n---\n\n".join(
            f"[{i+1}] {doc}" for i, doc in enumerate(docs)
        )
        prompt = (
            f"Answer using only the context below. Cite sources with [1], [2], etc.\n"
            f"If the context doesn't contain the answer, say so.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Answer:"
        )

        # Generate
        try:
            response = self.llm.chat.completions.create(
                model="gpt-4o",
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            answer = response.choices[0].message.content
        except Exception as e:
            answer = f"LLM call failed: {e}"

        return answer, sources

    def search(self, query_text, k=4):
        """Bare retrieval — returns chunks and metadata without LLM call."""
        q_embedding = self.embedder.encode(query_text).tolist()
        results = self.collection.query(query_embeddings=[q_embedding], n_results=k)
        return list(zip(results["documents"][0], results["metadatas"][0]))
```

Using the pipeline:

```python
# First time: ingest documents
rag = RAGPipeline()
rag.ingest("./my_documents")  # Put .txt files here

# Query
answer, sources = rag.query("What is the RAG retrieval process?")
print(f"Answer: {answer}")
print(f"Sources: {sources}")

# Raw search without generation
for doc, meta in rag.search("embedding models"):
    print(f"[{meta['source']}] {doc[:100]}...")
```

## Try It Yourself

Create 3-5 text files about a topic you know well (documentation pages, Wikipedia sections, or project notes). Ingest them, then write 5 test questions and score your pipeline's answers: (1) is the answer factually correct based on your source documents? (2) are the citations accurate? (3) does the model refuse to answer when it should? Add a method to your `RAGPipeline` class that formats the answer with source citations on separate lines for readability.

## Real-World RAG Connection

This class is the production skeleton for real RAG applications. In production you add: (a) incremental ingestion — only re-embed changed documents instead of rebuilding the entire index, (b) metadata filtering — restrict search to documents the user has permission to view, (c) streaming — return answer tokens as they're generated for responsive UIs, (d) caching — store frequent query/answer pairs to reduce LLM costs. Every real RAG system starts as a class like this, then grows feature by feature.

## Common Pitfalls

- **Pitfall:** Ingesting documents without checking for empty or near-empty chunks. A 3-word chunk embeds to noise and pollutes retrieval. **Fix:** Filter chunks with fewer than 20 words in `chunk_text()`, as shown above.
- **Pitfall:** Not persisting ChromaDB. If you use `chromadb.Client()` (ephemeral) instead of `chromadb.PersistentClient(path=...)`, your index evaporates when the script exits. **Fix:** Always use `PersistentClient` with an explicit path for any non-toy application.
- **Pitfall:** Embedding the question with a model that doesn't match what was used during ingestion. The ChromaDB collection stores vectors from one embedding space; querying from a different space produces random results. **Fix:** Store the model name in the collection metadata and validate at query time, or use the same `SentenceTransformer` instance for both operations.

## Next Steps

- **Practice:** Extend the pipeline to handle PDF files (use `PyMuPDF` or `pypdf`). Add a `--source-filter` parameter to `query()` that restricts retrieval to specific source files using ChromaDB's `where` filter.
- **Read:** [ChromaDB Usage Guide](https://docs.trychroma.com/docs/overview/introduction)
- **Related:** [rag_evaluation](/lesson/rag_evaluation) — evaluate your pipeline's retrieval and generation quality with RAGAS
