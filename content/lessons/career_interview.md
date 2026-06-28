---
id: career_interview
title: Interview Prep for AI Engineers
tier: bonus
difficulty: advanced
estimated_minutes: 30
module: career
prerequisites: [rag_pipeline_full, langchain_chains]
tags: [career, interview, salary]
---

## Concept Introduction

AI engineering interviews test three things: system design for RAG pipelines, live
coding under time pressure, and your ability to explain tradeoffs. The companies
hiring for these roles pay $160K-$350K for senior positions. By the end of this
lesson you will have a battle-tested interview strategy for each round type and
concrete salary data to anchor your negotiation.

## How It Works

**System design interviews** for RAG fall into a predictable pattern. The prompt
is always: "Design a system that answers questions from a knowledge base." Your
job is to walk through the pipeline step by step -- ingestion, chunking,
embedding, storage, retrieval, augmentation, generation -- while surfacing
tradeoffs at each decision point. Interviewers want to hear you say "I would use
semantic chunking with 256-token overlap because it preserves context better than
fixed-size chunks, at the cost of 30% more embeddings to store."

**Live coding** rounds usually ask you to build a retriever in 30 minutes. You
get a small document set and must implement cosine similarity search from scratch
or wire up a vector DB with an embedding model. The bar is not "does it work
perfectly" but "can you think through the problem while writing clean code."

**Behavioral** rounds for AI roles focus on ambiguity. Expect questions like
"Tell me about a time you deployed an AI feature that didn't perform as
expected" and "How do you evaluate whether a RAG pipeline is good enough?"

Salary data points (2025-2026, US market): junior AI engineer $120K-$160K; mid
$160K-$220K; senior $220K-$350K; staff $350K+. Equity typically 0.05%-0.5%
depending on stage. Always negotiate -- 68% of candidates who counter-offer get
a higher number.

## Code Examples

Live coding round: build a dense retriever with cosine similarity in 15 minutes.

```python
"""Dense Retriever — Live Coding Interview Solution
Given: list of documents, query string
Goal: return top-k most relevant documents by cosine similarity
"""
import numpy as np
from sentence_transformers import SentenceTransformer

class DenseRetriever:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.embeddings = None

    def index(self, documents: list[str]):
        self.documents = documents
        self.embeddings = self.model.encode(documents, normalize_embeddings=True)

    def search(self, query: str, k: int = 3) -> list[tuple[str, float]]:
        q_vec = self.model.encode([query], normalize_embeddings=True)
        scores = self.embeddings @ q_vec.T  # cosine via dot product
        top_k_idx = np.argsort(scores.flatten())[::-1][:k]
        return [(self.documents[i], float(scores[i])) for i in top_k_idx]

# Interview speed-run:
retriever = DenseRetriever()
retriever.index([
    "Transformers use self-attention to process sequences.",
    "Vector databases store embeddings for similarity search.",
    "RAG combines retrieval with language model generation."
])
results = retriever.search("How do vector databases work?")
for doc, score in results:
    print(f"{score:.3f} | {doc}")
```

Take-home project strategy: choose a niche dataset (no one else uses arXiv papers
on a specific subfield, or regulatory filings for one industry). Build a full
pipeline with evaluation metrics (hit rate, MRR). Deploy it. Record a 3-minute
walkthrough video. Hiring managers review 50+ projects -- yours stands out when
it is specific, shipped, and measurable.

## Try It Yourself

Time-box this: 30 minutes, stop even if incomplete. Build a retriever for
10 documents of your choice. Run a query. Then write 3 bullet points answering:
"What failed?", "What would you do differently with a full day?", "Why?"

## Real-World RAG Connection

When a company like Notion or Cursor interviews for an AI engineer, they hand
you an actual internal problem -- "users say search misses relevant docs" -- and
ask you to design the retrieval improvement. The system design frameworks in
this lesson map directly to that conversation. Every tradeoff you articulate
(recall vs. latency, dense vs. sparse, chunk size vs. context fidelity)
demonstrates the judgment they are evaluating you for.

## Common Pitfalls

- **Pitfall:** Over-designing in system design rounds by jumping to complex
  architectures (multi-agent, recursive retrieval) before nailing the basics.
  **Fix:** Build the simplest pipeline first, then layer on complexity as
  requirements demand it. Interviewers want to see you can scope down.
- **Pitfall:** Not stating salary expectations when asked, deferring with "I'm
  flexible." **Fix:** Anchor with a researched range: "Based on market data for
  senior AI engineers, I'm targeting $250K-$300K base." You lose leverage when
  the company names the first number.
- **Pitfall:** Submit a take-home that "kind of works" with no evaluation.
  **Fix:** Include a 5-row metrics table (hit rate, MRR, latency, cost, recall)
  and two sentences on what you would improve. Quantified results beat
  feature count every time.

## Next Steps

- **Practice:** Run a mock system design interview with Claude or ChatGPT. Use
  the prompt: "Interview me for a senior AI engineer role. Ask me to design a
  RAG system for a legal document search product. Push me on tradeoffs."
- **Read:** [Levels.fyi Salary Data](https://levels.fyi) for AI/ML engineer
  compensation at specific companies.
- **Related:** [career_portfolio](/lesson/career_portfolio) -- the project you
  build there is the centerpiece of every interview answer
