---
id: rag_what
title: What is RAG?
tier: junior
difficulty: beginner
estimated_minutes: 15
module: rag
prerequisites: [llm_what, vectordb_what]
tags: [rag, retrieval, generation, pipeline]
---

## Concept Introduction

Retrieval-Augmented Generation (RAG) is the technique of giving an LLM access
to a search engine full of your documents. Instead of answering from memory
(and hallucinating), the LLM reads retrieved passages and grounds its answer
in evidence. By the end of this lesson you'll understand the RAG pipeline
end-to-end and why it's the dominant pattern for building AI applications on
private data.

## How It Works

The RAG pipeline has three stages:

1. **Indexing**: Documents are split into chunks, each chunk is converted to
   an embedding vector, and stored in a vector database.
2. **Retrieval**: When a user asks a question, the query is embedded using the
   same model. The vector database finds the k most similar chunks (semantic
   search, not keyword matching).
3. **Generation**: The retrieved chunks are inserted into the LLM's prompt
   alongside the user's question. The LLM generates an answer grounded in
   the provided context.

This solves the LLM's two biggest problems: hallucinations (the answer is
tethered to documents) and stale knowledge (you control the documents, so you
control what the model knows).

## Code Examples

A minimal RAG pipeline in pseudocode:

```python
# Stage 1: Indexing (done once, offline)
documents = ["RAG combines search with generation...", "Embeddings are..."]
chunks = [chunk for doc in documents for chunk in split(doc)]
embeddings = [embed(c) for c in chunks]
vector_db.insert(chunks, embeddings)

# Stage 2 & 3: Query-time (happens for every user request)
def rag_query(question, top_k=3):
    # Retrieve
    question_embedding = embed(question)
    relevant_chunks = vector_db.search(question_embedding, k=top_k)
    context = "\n\n".join(relevant_chunks)

    # Generate
    prompt = f"""Context:\n{context}\n\nQuestion: {question}
    Answer using only the context above."""
    return llm_generate(prompt)

print(rag_query("What does RAG stand for?"))
```

Without RAG vs. with RAG — the difference:

```python
# Without RAG: LLM answers from training data
# Q: "What's our company's return policy?"
# A: "I don't have access to your company's specific policies." (or worse, hallucinates)

# With RAG: LLM reads retrieved documents first
# Retrieved: "Returns accepted within 30 days with original receipt."
# A: "Your return policy allows returns within 30 days with the original receipt."
```

## Try It Yourself

Trace a query through the RAG pipeline by hand. Given these documents and a
question, identify which chunk(s) would be retrieved and what the answer
should be:

```python
documents = {
    "doc1": "Product X costs $49.99 and ships within 2 business days.",
    "doc2": "Our return policy allows returns within 30 days of purchase.",
    "doc3": "Customer support is available 24/7 via chat and email.",
}

question = "How much does Product X cost?"
# Your task: Which document answers this? What would RAG retrieve?
# Answer: doc1. A keyword or semantic search for "Product X cost"
# would rank doc1 highest.
```

## Real-World RAG Connection

RAG is the standard architecture for AI applications that need to answer
questions about specific, non-public information: company documentation,
legal contracts, medical records, technical manuals. Without RAG, you'd need
to fine-tune a model on your data (expensive, stale, needs retraining).
With RAG, you just add documents to your vector store and the model can
immediately answer questions about them.

## Common Pitfalls

- **Pitfall:** Retrieving too many chunks — stuffing the prompt with irrelevant
  text dilutes the answer and wastes tokens. **Fix:** Start with top_k=3 or 5;
  increase only if answers are incomplete.
- **Pitfall:** Chunking without overlap — a concept split across two chunks
  is invisible to retrieval. **Fix:** Use 10-20% overlap between chunks.
- **Pitfall:** Same embedding model for indexing and querying — using
  different models breaks the similarity comparison. **Fix:** Use the exact
  same embedding model for both documents and queries.

## Next Steps

- **Practice:** Take 3 short Wikipedia articles (copy-paste the text), split
  each into 2-3 chunks by paragraph, and manually simulate RAG: for a question
  you make up, find which chunk answers it best.
- **Read:** [IBM Research: What is RAG?](https://research.ibm.com/blog/retrieval-augmented-generation-RAG)
- **Related:** [vectordb_what](/lesson/vectordb_what) — the vector database
  that makes retrieval fast and semantic
