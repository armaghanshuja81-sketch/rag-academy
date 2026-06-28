---
id: llamaindex_adv
title: "LlamaIndex: Advanced Patterns"
tier: senior
difficulty: advanced
estimated_minutes: 25
module: frameworks
prerequisites: [langchain_adv]
tags: [llamaindex, recursive-retrieval, knowledge-graph, auto-merging, retrieval]
---

## Concept Introduction

LlamaIndex started as a data ingestion framework (the "Llama" in the name is about loading data for LLMs) and that origin still defines where it excels: complex document parsing, hierarchical retrieval, and knowledge-graph-augmented RAG. Compared to LangChain's general-purpose agent/composition focus, LlamaIndex is purpose-built for retrieval. This lesson covers the three LlamaIndex patterns that justify adopting it, and when to stick with LangChain.

## How It Works

Recursive retrieval in LlamaIndex uses a two-level index: a summary index of document summaries and a vector index of chunks. A query first searches the summary index to identify which documents are relevant, then searches only the chunks within those documents. This is architecturally different from chunk-then-filter because the summary step eliminates entire documents before any vector search runs. For 10,000 documents, recursive retrieval searches 10K summaries (cheap keyword or small-vector search) plus the chunks of 3-5 documents, rather than searching all chunks of all documents.

Auto-merging retrieval in LlamaIndex is a more sophisticated version of the parent document pattern. Documents are chunked into a tree: page -> paragraph -> sentence. During retrieval, if enough children of a parent node are retrieved, LlamaIndex replaces the children with the parent. The engine iteratively merges: three retrieved sentences from the same paragraph become the paragraph node, and three retrieved paragraphs from the same page become the page node. This dynamically adjusts context granularity based on retrieval density without pre-defining window sizes.

The knowledge graph index starts with a vector search, then traverses a graph constructed from entities and relationships in your documents. Given the query "What drug interacts with the enzyme targeted by metformin?," the vector search finds metformin, the graph traversal follows the "targets" edge to the enzyme, then follows "inhibited_by" edges to interacting drugs. This captures multi-hop relationships that purely embedding-based retrieval misses. The tradeoff is indexing cost: entity extraction and relationship extraction for millions of documents is computationally expensive.

When LlamaIndex beats LangChain: (1) your primary challenge is document parsing and hierarchical indexing, not agent orchestration, (2) you need recursive or auto-merging retrieval out of the box, (3) your data is structured enough for knowledge graph extraction. When LangChain wins: agent-heavy workflows, extensive third-party integrations, or teams already invested in the ecosystem.

## Code Examples

```python
from llama_index.core import VectorStoreIndex, SummaryIndex, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.retrievers import RecursiveRetriever
from llama_index.core import Document

# Recursive retrieval: summary index -> vector index
docs = [Document(text="...") for _ in range(1000)]

# Build summary nodes and vector chunks
splitter = SentenceSplitter(chunk_size=1024, chunk_size_overlap=128)
nodes = splitter.get_nodes_from_documents(docs)

summary_index = SummaryIndex(nodes)        # document-level summaries
vector_index = VectorStoreIndex(nodes)     # paragraph-level vectors

recursive_retriever = RecursiveRetriever(
    "vector",
    retriever_dict={
        "vector": vector_index.as_retriever(similarity_top_k=2),
        "summary": summary_index.as_retriever(similarity_top_k=5),
    },
    node_dict={"vector": nodes, "summary": summary_nodes},
)

# Query: first search summaries, then vectors within those docs
results = recursive_retriever.retrieve("query")
```

```python
# Knowledge graph index
from llama_index.core.indices.knowledge_graph import KnowledgeGraphIndex
from llama_index.core.graph_stores import SimpleGraphStore

graph_store = SimpleGraphStore()
kg_index = KnowledgeGraphIndex.from_documents(
    documents=docs,
    kg_triplet_extract_fn=extract_triplets,  # Your entity extraction
    graph_store=graph_store,
)

# Query triggers: vector search -> graph traversal -> context assembly
response = kg_index.as_query_engine().query(
    "What drug interacts with the enzyme targeted by metformin?"
)
```

## Try It Yourself

Take 100 documents from your knowledge base. Build a standard flat vector index and a recursive retriever with LlamaIndex. For 10 queries that are specific to particular documents, compare which approach retrieves the correct document in the top 3. The recursive retriever should outperform on queries where similar vocabulary appears across many documents but only one is actually relevant.

## Real-World RAG Connection

An investment bank's research portal uses LlamaIndex recursive retrieval across 500,000 analyst reports. A flat vector search for "Q3 earnings guidance revision" would return relevant paragraphs scattered across 200 reports. The recursive retriever first identifies the 3 most relevant reports via their executive summaries, then searches only within those 3, ensuring the analyst sees coherent report-level context rather than decontextualized snippets.

## Common Pitfalls

- **Building a knowledge graph for flat factual data.** If your documents are straightforward procedures or FAQs with no cross-document relationships, the KG adds indexing cost and latency with no retrieval benefit.
- **Over-deep recursive retrieval.** Three levels (document -> section -> paragraph) is useful. Five levels (document -> section -> subsection -> paragraph -> sentence) multiplies latency and cache misses without proportional recall improvement.
- **Assuming LlamaIndex is "just a different LangChain."** LlamaIndex's data ingestion pipeline (parsers, node parsers, extractors) is its strength. Using it only as a retriever wrapper misses the value.

## Next Steps

- LlamaIndex documentation on recursive retrieval and node parsers
- Lesson: **Multi-Hop Retrieval** for graph-based retrieval patterns
