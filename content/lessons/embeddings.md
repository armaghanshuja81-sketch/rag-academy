---
id: embeddings
title: Embeddings & Cosine Similarity
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: ai_llm
prerequisites: [py_numpy, llm_what]
tags: [embeddings, cosine-similarity, vectors, semantic-search]
---

## Concept Introduction

Text is not math, but machines need math. Embeddings solve this: they convert
sentences, paragraphs, and documents into dense vectors (lists of floats) where
similar meanings are close together in vector space. By the end of this lesson
you will generate embeddings, compute cosine similarity, and build a
semantic search engine from scratch.

## How It Works

An embedding model (like sentence-transformers' `all-MiniLM-L6-v2`) encodes
text into a fixed-size vector — typically 384, 768, or 1536 floats. Each float
represents the text's position along a learned semantic dimension. The key
property: texts with similar meanings produce vectors that point in similar
directions. "The cat sat on the mat" and "A feline rested on the rug" will
have high cosine similarity; "The cat sat on the mat" and "Database indexing
strategies" will have low similarity.

Cosine similarity measures the angle between two vectors, not the distance.
It ranges from -1 (opposite direction) to 1 (identical direction), with 0
meaning orthogonal (unrelated). The formula:
`cos(a, b) = (a dot b) / (||a|| * ||b||)`

Dot product of a with b, divided by the product of their magnitudes. When both
vectors are normalized (unit length), cosine similarity simplifies to just the
dot product. Most embedding models output normalized vectors, so in practice
you can often compute similarity with a single dot product.

The embed-then-search pattern: convert every document into an embedding, store
them, embed the user's query, find the nearest stored embeddings, return the
corresponding documents. This is semantic search — matching by meaning, not
keywords — and it is the retrieval engine at the core of every RAG system.

## Code Examples

Install and generate embeddings:

```bash
pip install sentence-transformers numpy
```

```python
from sentence_transformers import SentenceTransformer
import numpy as np

# Load the model — download happens once, then caches locally
model = SentenceTransformer("all-MiniLM-L6-v2")

# Embed a single sentence — returns np.ndarray of shape (384,)
text = "Retrieval-Augmented Generation grounds LLM outputs in real documents."
embedding = model.encode(text)
print(f"Shape: {embedding.shape}")
print(f"Dtype: {embedding.dtype}")
print(f"First 5 values: {embedding[:5]}")
print(f"Norm: {np.linalg.norm(embedding):.6f}")  # ~1.0 — normalized
```

Cosine similarity from scratch vs. using built-in utilities:

```python
def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

a = model.encode("Machine learning is a subset of artificial intelligence.")
b = model.encode("AI includes techniques like deep learning and reinforcement learning.")
c = model.encode("The Eiffel Tower is a famous landmark in Paris, France.")

print(f"Similar semantic:   {cosine_similarity(a, b):.4f}")  # High (> 0.5)
print(f"Dissimilar semantic: {cosine_similarity(a, c):.4f}")  # Low (< 0.3)

# For normalized vectors, dot product alone works:
a_norm = a / np.linalg.norm(a)
b_norm = b / np.linalg.norm(b)
print(f"Dot product check: {np.dot(a_norm, b_norm):.4f}")  # Same as cosine
```

Semantic search — the core RAG retrieval pattern:

```python
# Build a small search index
documents = [
    "RAG combines retrieval with language model generation.",
    "Python is a high-level programming language created by Guido van Rossum.",
    "Vector databases store embeddings and enable similarity search.",
    "The Eiffel Tower was built in 1889 for the Paris World's Fair.",
    "Embedding models convert text into dense vector representations.",
    "Flask is a lightweight Python web framework for building APIs.",
    "Cosine similarity measures the angle between two vectors.",
    "Paris receives over 30 million tourists annually.",
]
doc_embeddings = model.encode(documents)

def search(query, top_k=3):
    """Embed the query, compute similarity to all docs, return top-k."""
    query_embedding = model.encode(query)

    # Batch cosine similarity: query (384,) dot docs (8, 384).T
    similarities = np.dot(doc_embeddings, query_embedding) / (
        np.linalg.norm(doc_embeddings, axis=1) * np.linalg.norm(query_embedding)
    )

    # Get indices sorted by similarity (highest first)
    top_indices = np.argsort(similarities)[::-1][:top_k]

    for rank, idx in enumerate(top_indices):
        print(f"[{rank+1}] score={similarities[idx]:.4f} | {documents[idx][:70]}...")

print("Query: 'How does semantic search work?'")
search("How does semantic search work?")

print("\nQuery: 'Tell me about Paris landmarks.'")
search("Tell me about Paris landmarks.")

print("\nQuery: 'What is Python?'")
search("What is Python?")
```

Visualizing embeddings in 2D (to build intuition, not for production):

```python
from sklearn.decomposition import PCA

documents = [
    "RAG pipeline", "Vector search", "Embedding model", "Cosine similarity",
    "Python code", "Flask server", "API endpoint", "SQL database",
    "Paris France", "Eiffel Tower", "Tourist destination", "Travel guide",
]

embeddings = model.encode(documents)
pca = PCA(n_components=2)
reduced = pca.transform(embeddings) if hasattr(pca, 'transform') else PCA(n_components=2).fit_transform(embeddings)

# Print coordinates — you'd plot these in matplotlib or a notebook
for (x, y), doc in zip(reduced, documents):
    print(f"({x:+.3f}, {y:+.3f})  {doc}")

print(f"\nPCA explained variance: {sum(PCA(n_components=2).fit(embeddings).explained_variance_ratio_):.2%}")
# ~60-80% means the 2D projection captures most of the structure
```

## Try It Yourself

Build a semantic FAQ finder:
1. Write 10 FAQ questions and answers (real ones from a product or service you
   know)
2. Embed all the questions
3. Write a function that takes a user's natural-language question, embeds it,
   and returns the top 2 matching FAQ answers
4. Test edge cases: a question phrased completely differently from the FAQ but
   with the same intent; a question on a topic not in the FAQ

```python
faqs = [
    ("How do I reset my password?", "Go to Settings > Security > Reset Password..."),
    ("What payment methods do you accept?", "We accept Visa, Mastercard, PayPal..."),
    ("How long does shipping take?", "Standard shipping: 5-7 business days..."),
    ("Can I return an item?", "Returns accepted within 30 days of purchase..."),
    ("How do I contact support?", "Email support@example.com or call..."),
    ("Do you offer student discounts?", "Yes — verify with .edu email for 15% off..."),
    ("Where is my order?", "Track your order at example.com/track..."),
    ("How do I cancel my subscription?", "Go to Settings > Billing > Cancel..."),
    ("Is my data secure?", "We use 256-bit encryption and never share data..."),
    ("Can I change my delivery address?", "Edit your address in Account > Addresses..."),
]

faq_questions = [q for q, _ in faqs]
faq_answers = [a for _, a in faqs]
faq_embeddings = model.encode(faq_questions)

def find_answer(user_question):
    query_embedding = model.encode(user_question)
    similarities = np.dot(faq_embeddings, query_embedding) / (
        np.linalg.norm(faq_embeddings, axis=1) * np.linalg.norm(query_embedding)
    )
    top_idx = np.argmax(similarities)
    return faq_answers[top_idx], similarities[top_idx]

# Test — note how different phrasing still matches the right answer
for test_q in [
    "I forgot my password, what do I do?",
    "How can I pay for my order?",
    "What's the weather like today?",
]:
    answer, score = find_answer(test_q)
    print(f"Q: {test_q}")
    print(f"A: {answer[:60]}... (score: {score:.3f})\n")
```

## Real-World RAG Connection

The embed-then-search pattern is the "R" in RAG. When a user asks "what's your
refund policy?", your pipeline embeds that question, compares it against the
embeddings of every chunk in your vector database, retrieves the top 5 most
similar chunks, and injects them into the LLM prompt. If your embedding model
is misconfigured or your similarity threshold is too loose, the retrieved
chunks are irrelevant and the LLM hallucinates a plausible-sounding but wrong
answer. Embedding quality and similarity computation are the foundation of
retrieval accuracy.

## Common Pitfalls

- **Pitfall:** Computing Euclidean distance instead of cosine similarity. For
  high-dimensional vectors, Euclidean distance is dominated by vector magnitude
  rather than direction, producing different rankings. **Fix:** Use cosine
  similarity (or dot product on normalized vectors) for semantic comparison.
- **Pitfall:** Using different embedding models for indexing and querying. A
  `text-embedding-3-small` vector (1536 dims) cannot be compared to an
  `all-MiniLM-L6-v2` vector (384 dims) — the dimensions don't even align.
  **Fix:** Store the model name and version in your database metadata.
- **Pitfall:** Embedding the entire raw document including HTML tags, headers,
  navigation text, and footers. The embedding captures "Copyright 2024" and
  "Home | About | Contact" alongside your content. **Fix:** Extract and clean
  the main content before embedding.

## Next Steps

- **Practice:** Build a semantic search over 50 Wikipedia article snippets.
  Compare the results of keyword search (using `in` or `str.contains`) against
  embedding-based search. Identify 3 queries where semantic search finds
  relevant results that keyword search misses.
- **Read:** [Sentence-Transformers Documentation](https://www.sbert.net/docs/quickstart.html)
- **Related:** [chromadb](/lesson/chromadb) — store your embeddings in a
  vector database for production-scale similarity search
