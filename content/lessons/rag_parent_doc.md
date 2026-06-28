---
id: rag_parent_doc
title: Parent Document Retriever
tier: senior
difficulty: advanced
estimated_minutes: 25
module: retrieval
prerequisites: [rag_hybrid, rag_rerank]
tags: [parent-document, chunking, sentence-window, auto-merging, retrieval]
---

## Concept Introduction

Small chunks are better for retrieval precision -- a 128-token chunk is more likely to be entirely relevant to a query than a 1024-token chunk. But small chunks are worse for generation -- they lack the surrounding context the LLM needs to produce a coherent answer. The parent document pattern decouples retrieval granularity from generation context: retrieve small chunks, then expand each result to its enclosing larger context. This lesson covers three expansion strategies and their storage tradeoffs.

## How It Works

The core insight is that you store each document at two granularities: small child chunks for embedding and retrieval, and larger parent chunks (or whole documents) for context injection. At query time, you embed the query, search against child embeddings, but return the corresponding parent texts. This is pure storage play -- no extra LLM calls, no latency beyond an additional DB lookup to map child IDs to parent content.

Sentence-window retrieval is the simplest variant: each sentence is a child chunk, and the parent is that sentence plus N sentences of context on either side. Implemented by storing sentence-level embeddings but returning sentence+window for each match. The tradeoff is duplicate storage: overlapping windows mean the same sentence appears in many parents, inflating your vector index.

Auto-merging retrieval uses a hierarchical chunk tree: each chunk has a parent and grandparent. During retrieval, if a threshold percentage of children from the same parent are retrieved, the parent replaces the children. This dynamically adapts context size based on retrieval density -- a document where 80% of its children match is likely highly relevant and deserves full context. The tradeoff is complexity: you need a tree structure, merge logic, and a merge threshold to tune.

The storage architecture decision: you can store parent-child relationships in a SQL join table (`chunk_id | parent_id | parent_text`), in document metadata on each vector (`{"parent_id": "doc_42_section_3"}`), or compute parents on the fly from positional offsets. The SQL join approach is most flexible (you can change parent boundaries without re-embedding) but requires two queries. The metadata approach is fastest (one query) but parent boundaries are fixed at index time.

## Code Examples

```python
from dataclasses import dataclass

@dataclass
class SentenceWindow:
    sentences: list[str]  # full document as sentence list
    window_size: int = 3

    def get_child(self, idx: int) -> str:
        """Sentence at idx -- this is what gets embedded."""
        return self.sentences[idx]

    def get_parent(self, idx: int) -> str:
        """Sentence + surrounding context -- this is what the LLM sees."""
        start = max(0, idx - self.window_size)
        end = min(len(self.sentences), idx + self.window_size + 1)
        return " ".join(self.sentences[start:end])

    def index_all(self, embedder, vector_store):
        """Embed each sentence, but map child ID to parent text."""
        for i in range(len(self.sentences)):
            embedding = embedder.embed(self.get_child(i))
            vector_store.add(
                id=f"doc_1_sentence_{i}",
                embedding=embedding,
                metadata={"sentence_idx": i},
                document=self.get_parent(i),  # store parent, embed child
            )
```

```python
# Auto-merging: if >= 60% of children from a parent are retrieved, merge
def auto_merge(
    results: list[dict], parent_map: dict[str, list[str]], threshold: float = 0.6
) -> list[dict]:
    parent_counts: dict[str, list[dict]] = {}
    for r in results:
        parent_id = r["metadata"].get("parent_id")
        if parent_id:
            parent_counts.setdefault(parent_id, []).append(r)

    merged = []
    for parent_id, children in parent_counts.items():
        if len(children) / len(parent_map[parent_id]) >= threshold:
            merged.append({"content": parent_map[parent_id]["full_text"], "score": max(c["score"] for c in children)})
        else:
            merged.extend(children)
    return sorted(merged, key=lambda x: x["score"], reverse=True)
```

## Try It Yourself

Take a 10-paragraph document. Index it three ways: (1) paragraph-level chunks only, (2) sentence-window retrieval with window=2, and (3) auto-merging with a 50% threshold. For 5 queries that require cross-paragraph context, compare the generation quality of answers produced from each method's top-3 results.

## Real-World RAG Connection

A contract review system stores 200-page legal agreements. Embedding each page would miss the fact that "termination conditions" on page 3 is modified by an addendum on page 47. Sentence-window retrieval at the paragraph level with auto-merging ensures that when enough paragraphs from the addendum are retrieved, the entire addendum section is provided as context.

## Common Pitfalls

- **Window size too large.** A sentence-level embed with a 20-sentence window effectively embeds the whole document, negating the precision benefit of small chunks. Keep windows at 3-5 sentences.
- **Redundant context across results.** If three retrieved sentences are from the same parent, returning the parent three times wastes context window. Deduplicate parents before passing to the LLM.
- **Forgetting to update parent boundaries.** If you change your chunking strategy, parent-child mappings in the metadata approach become stale. Use the SQL join approach when you expect to iterate on chunking.

## Next Steps

- LangChain's ParentDocumentRetriever implementation for reference API design
- Lesson: **Advanced RAG Evaluation** for measuring context precision
