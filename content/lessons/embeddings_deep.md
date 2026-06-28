---
id: embeddings_deep
title: Embeddings Deep Dive
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: embeddings
prerequisites: [embeddings]
tags: [embeddings, similarity, models, dimensionality]
---

## Concept Introduction

An embedding is a dense vector that represents meaning as a point in
high-dimensional space. The closer two vectors, the more semantically similar
their text. By the end of this lesson you'll compare embedding models,
understand dimensionality tradeoffs, visualize embeddings, and catch the
failure modes that produce garbage retrievals.

## How It Works

Embedding models are trained to map semantically similar text to nearby
vectors. They're typically transformer-based encoders (BERT variants) trained
with contrastive learning: pairs of similar sentences are pulled together in
vector space, dissimilar pairs are pushed apart.

Key properties that determine model quality:
- **Dimensionality**: More dimensions = more capacity to encode nuance, but
  larger storage and slower search. 384 (MiniLM) vs 768 (MPNet) vs 1536
  (OpenAI) vs 3072 (text-embedding-3-large).
- **Max tokens**: Most models truncate input beyond 512 tokens. Longer
  documents need chunking before embedding.
- **Normalization**: Some models output normalized vectors (unit length),
  others don't. Cosine similarity on unnormalized vectors ≠ cosine distance.
- **Asymmetry**: Query embedding vs document embedding. Some models use
  different encoding for questions than for passages (e.g., DPR, Instructor).

## Code Examples

Compare multiple embedding models on the same text:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

models = {
    "mini": "all-MiniLM-L6-v2",     # 384-dim, fast
    "mpnet": "all-mpnet-base-v2",   # 768-dim, accurate
}

texts = ["RAG combines retrieval with generation",
         "Retrieval-augmented generation uses search",
         "Pizza is an Italian dish"]

for name, model_id in models.items():
    model = SentenceTransformer(model_id)
    embeddings = model.encode(texts)

    # Cosine similarity between first two (both about RAG)
    a, b = embeddings[0], embeddings[1]
    sim_rag = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    # Similarity between RAG text and unrelated text
    sim_unrelated = np.dot(a, embeddings[2]) / (np.linalg.norm(a) * np.linalg.norm(embeddings[2]))

    print(f"{name} ({embeddings.shape[1]}d): RAG-RAG={sim_rag:.3f}, RAG-pizza={sim_unrelated:.3f}")
```

Visualize embeddings in 2D with PCA:

```python
from sklearn.decomposition import PCA

model = SentenceTransformer("all-MiniLM-L6-v2")
docs = ["RAG pipeline design", "Vector search optimization",
        "Chunking strategies for documents", "Pizza recipe Margherita",
        "Italian cuisine basics", "How to make pasta"]
vectors = model.encode(docs)

# Reduce to 2D for visualization
pca = PCA(n_components=2)
reduced = pca.transform(vectors)
for i, (x, y) in enumerate(reduced):
    print(f"({x:.2f}, {y:.2f}) — {docs[i]}")
```

## Try It Yourself

Load 6 sentences (3 about RAG, 3 about cooking), embed them with
`all-MiniLM-L6-v2`, compute all pairwise cosine similarities, and find which
pair of unrelated sentences has the highest (misleading) similarity:

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

texts = [
    "RAG pipeline optimization", "Vector database indexing",
    "Semantic search with embeddings",
    "Baking chocolate chip cookies", "Italian pasta carbonara",
    "Slow-cooked beef stew"
]
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(texts)
sim_matrix = cosine_similarity(embeddings)

# Find the highest cross-domain similarity
for i in range(3):
    for j in range(3, 6):
        print(f"RAG[{i}] vs Food[{j-3}]: {sim_matrix[i][j]:.3f}")
```

## Real-World RAG Connection

Your choice of embedding model determines retrieval quality more than any
other single decision. A model that wasn't trained on your domain (legal,
medical, code) will produce poor embeddings regardless of how well you tune
everything else. Production RAG teams benchmark 3-5 embedding models on their
own data before committing to one.

## Common Pitfalls

- **Pitfall:** Using a general embedding model for a specialized domain.
  Legal text embedded with a Wikipedia-trained model loses domain-specific
  meaning. **Fix:** Evaluate models on your data, not benchmark leaderboards.
- **Pitfall:** Comparing embeddings from different models. A 384d MiniLM
  vector and a 1536d OpenAI vector can't be compared meaningfully.
  **Fix:** Store the embedding model name alongside vectors. Migrate all
  vectors when switching models.
- **Pitfall:** Not normalizing vectors before computing cosine similarity.
  **Fix:** Use `sklearn.metrics.pairwise.cosine_similarity` which handles
  normalization internally.

## Next Steps

- **Practice:** Run the comparison benchmark above on 50 sentence pairs from
  your domain. Measure: do embeddings capture the similarity distinctions
  that matter for your use case?
- **Read:** [Sentence Transformers Documentation](https://www.sbert.net/)
- **Related:** [vectordb_what](/lesson/vectordb_what) — where embeddings are
  stored and searched
