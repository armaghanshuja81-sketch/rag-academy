---
id: chunking
title: Document Chunking
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: rag
prerequisites: [rag_architecture]
tags: [rag, chunking, text-splitting, preprocessing]
---

## Concept Introduction

You cannot feed an entire 500-page manual into an embedding model or an LLM
context window. Chunking splits documents into smaller pieces that are short
enough to embed meaningfully and fit inside the LLM's prompt. By the end of
this lesson you will implement four chunking strategies, understand the
tradeoffs of each, and choose the right one for different document types.

## How It Works

A chunker splits text into segments and optionally overlaps them. The goal:
each chunk contains one coherent idea, stays under the embedding model's token
limit, and retains enough context that the LLM can answer questions without
seeing the surrounding chunks.

The four strategies, in order of sophistication:
1. **Fixed-size** — split every N characters. Simple, predictable chunk sizes,
   but cuts sentences mid-word.
2. **Sentence-based** — split on sentence boundaries (`.`, `!`, `?`). Chunks
   stay semantically coherent but vary in size.
3. **Recursive** — try splitting on paragraph breaks, then sentences, then
   words. Produces the most natural boundaries but requires a separator
   hierarchy.
4. **Semantic** — split when the meaning shifts (uses embedding similarity
   between adjacent sentences). Most accurate but slowest, requires an
   embedding model.

Overlap preserves context across chunk boundaries. A sentence at the end of
chunk 3 reappears at the start of chunk 4. This prevents a question whose
answer spans a boundary from being lost. Typical overlap: 10-20% of the chunk
size.

Chunk size tradeoffs:
- **Small chunks (100-200 tokens):** Precise retrieval — the LLM sees exactly
  the relevant sentence. But loses surrounding context. Good for factoid QA.
- **Large chunks (500-1000 tokens):** Rich context — the LLM gets the full
  argument. But dilutes relevance and uses more tokens. Good for summarization.

## Code Examples

Fixed-size chunking with overlap:

```python
def fixed_chunk(text, chunk_size=500, overlap=100):
    """Split text into chunks of `chunk_size` chars with `overlap` overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start += chunk_size - overlap
        if start >= len(text):
            break
    return chunks

# Example
text = "RAG combines retrieval with generation. " * 50
chunks = fixed_chunk(text, chunk_size=200, overlap=50)
print(f"Fixed chunks: {len(chunks)} chunks, avg length: {sum(len(c) for c in chunks)//len(chunks)}")
```

Sentence-based chunking — cleaner boundaries:

```python
import re

def sentence_chunk(text, max_sentences=5, overlap_sentences=1):
    """Group sentences into chunks, overlapping across boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    i = 0
    while i < len(sentences):
        end = min(i + max_sentences, len(sentences))
        chunk = " ".join(sentences[i:end])
        chunks.append(chunk)
        i += max_sentences - overlap_sentences
        if i >= len(sentences):
            break
    return chunks

paragraph = (
    "Machine learning is a subset of AI. "
    "It uses statistical techniques to learn from data. "
    "Deep learning uses neural networks with many layers. "
    "Transformers revolutionized natural language processing. "
    "RAG combines retrieval with generation for grounded answers. "
    "Vector databases store embeddings for similarity search. "
    "Embedding models convert text into dense vectors. "
    "Semantic search finds documents by meaning, not keywords."
)
chunks = sentence_chunk(paragraph, max_sentences=3, overlap_sentences=1)
for i, chunk in enumerate(chunks):
    print(f"Chunk {i}: {chunk[:80]}...")
```

Recursive chunking with LangChain:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

text = """## Introduction

RAG is a technique that combines information retrieval with text generation.

## Architecture

The RAG pipeline has three main components: ingestion, retrieval, and generation.

### Ingestion

Documents are loaded, chunked, embedded, and stored in a vector database.

### Retrieval

The user's query is embedded and the most similar chunks are fetched.

## Conclusion

RAG reduces hallucinations by grounding LLM responses in real documents."""

splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=40,
    separators=["\n\n", "\n", ". ", " ", ""],  # Try these in order
    length_function=len,
)

chunks = splitter.split_text(text)
print(f"Recursive chunks: {len(chunks)}")
for i, chunk in enumerate(chunks):
    print(f"  [{i}] {chunk[:60]}... ({len(chunk)} chars)")
```

Semantic chunking — split when meaning shifts:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

def semantic_chunk(text, similarity_threshold=0.5):
    """Split text where semantic similarity drops below threshold."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(sentences)

    # Compute cosine similarity between consecutive sentences
    similarities = []
    for i in range(len(embeddings) - 1):
        sim = np.dot(embeddings[i], embeddings[i+1]) / (
            np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i+1])
        )
        similarities.append(sim)

    # Split where similarity drops
    chunks = []
    current_chunk = [sentences[0]]
    for i, sim in enumerate(similarities):
        if sim < similarity_threshold:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentences[i + 1]]
        else:
            current_chunk.append(sentences[i + 1])
    chunks.append(" ".join(current_chunk))
    return chunks

# Two different topics in one text
mixed_text = (
    "Neural networks consist of layers of interconnected neurons. "
    "Backpropagation computes gradients to update weights. "
    "Activation functions introduce non-linearity into the network. "
    "The Eiffel Tower is located in Paris France. "
    "It was constructed in 1889 for the World's Fair. "
    "The tower receives over 7 million visitors annually."
)
chunks = semantic_chunk(mixed_text, similarity_threshold=0.4)
print(f"Semantic chunks: {len(chunks)} (expecting 2 — AI vs geography)")
for chunk in chunks:
    print(f"  - {chunk[:80]}...")
```

## Try It Yourself

Take a multi-paragraph Wikipedia article and apply all four chunking strategies.
Compare the output:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

article = """[Paste a Wikipedia article here with 5+ paragraphs]"""

# 1. Fixed-size
fixed = fixed_chunk(article, chunk_size=300, overlap=50)

# 2. Sentence-based
sent = sentence_chunk(article, max_sentences=4, overlap_sentences=1)

# 3. Recursive
splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
recursive = splitter.split_text(article)

# 4. Semantic
semantic = semantic_chunk(article, similarity_threshold=0.5)

for name, chunks in [("Fixed", fixed), ("Sentence", sent),
                      ("Recursive", recursive), ("Semantic", semantic)]:
    print(f"\n{name} ({len(chunks)} chunks):")
    for i, c in enumerate(chunks[:3]):
        print(f"  [{i}] {c[:60]}...")
```

Which strategy produces the most self-contained, readable chunks? Which loses
the most information at chunk boundaries?

## Real-World RAG Connection

Chunking is the first decision in your RAG ingestion pipeline — and it is
downstream from everything: retrieval quality, prompt construction cost,
and answer accuracy. If chunks are too large, the embedding dilutes across
multiple topics and retrieval returns the wrong chunk. If chunks are too small,
the LLM lacks context and hallucinates. Production RAG systems often use
recursive chunking with sentence-aware splitting as the default, then semantic
chunking for domain-specific content like legal or medical documents where
topic boundaries are critical.

## Common Pitfalls

- **Pitfall:** Chunking without overlap, causing answers that span chunk
  boundaries to be irretrievable. **Fix:** Always set overlap to 10-20% of
  chunk size. A 500-token chunk should have at least a 50-token overlap.
- **Pitfall:** Using the same chunk size for all document types — code, prose,
  and tables need different strategies. **Fix:** Route documents by type and
  apply type-specific splitters (code uses AST-aware chunking, tables use
  row-based splitting).
- **Pitfall:** Chunks that embed the LLM prompt template or wrapper text
  (headers, footers, boilerplate). **Fix:** Strip navigation, headers, footers,
  and repeated boilerplate before chunking. Clean text produces clean chunks.

## Next Steps

- **Practice:** Run all four chunking strategies on 3 different document types
  (Wikipedia article, README file, legal document) and identify which strategy
  works best for each.
- **Read:** [LangChain Text Splitters](https://python.langchain.com/docs/how_to/#text-splitters)
- **Related:** [rag_pipeline_full](/lesson/rag_pipeline_full) — pipe your
  chunks through embedding and into a vector database
