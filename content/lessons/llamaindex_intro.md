---
id: llamaindex_intro
title: LlamaIndex Introduction
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: llamaindex
prerequisites: [langchain_intro, rag_pipeline_full]
tags: [llamaindex, framework, indexing]
---

## Concept Introduction

LlamaIndex is a data framework for building RAG applications. Where LangChain
focuses on general LLM orchestration, LlamaIndex specializes in the indexing
side: ingesting documents, structuring them into retrievable formats, and
building advanced retrieval strategies. By the end of this lesson you'll build
a complete LlamaIndex RAG pipeline and understand when to choose it over
LangChain.

## How It Works

LlamaIndex centers on the `Document` → `Node` → `Index` pipeline. Documents
are loaded from files, APIs, or databases. Nodes are the chunked
representations (like LangChain's Document objects). Indexes are the
retrievable data structures built from nodes — vector indexes, summary
indexes, tree indexes, keyword indexes.

LlamaIndex's key advantage over LangChain is its data connectors: 160+
built-in loaders for everything from PDFs and PowerPoint to Notion, Google
Drive, and Slack. For RAG on heterogeneous enterprise data, this is the
killer feature.

The query engine abstraction wraps retrieval + synthesis. A single
`index.as_query_engine()` call gives you a working RAG system. Advanced
retrievers like `RecursiveRetriever`, `AutoMergingRetriever`, and
`SentenceWindowRetriever` are built-in.

## Code Examples

Minimal LlamaIndex RAG in under 20 lines:

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# Load documents from a folder
documents = SimpleDirectoryReader("./knowledge_base").load_data()

# Build index (embed + store)
index = VectorStoreIndex.from_documents(documents)

# Query
query_engine = index.as_query_engine(similarity_top_k=3)
response = query_engine.query("What is the return policy?")
print(response)
```

Advanced retrieval with sentence window:

```python
from llama_index.core.node_parser import SentenceWindowNodeParser

node_parser = SentenceWindowNodeParser(
    window_size=3,           # 3 sentences on each side
    window_metadata_key="window"
)
nodes = node_parser.get_nodes_from_documents(documents)

# Now retrievals include surrounding context for better LLM synthesis
index = VectorStoreIndex(nodes)
query_engine = index.as_query_engine()
```

Customizing the prompt template:

```python
from llama_index.core import PromptTemplate

template = PromptTemplate(
    "Context information:\n{context_str}\n\n"
    "Answer the question using only the context. "
    "If uncertain, say 'Insufficient data.'\n"
    "Question: {query_str}\n"
    "Answer:"
)
query_engine.update_prompts({"response_synthesizer:text_qa_template": template})
```

## Try It Yourself

Compare LlamaIndex vs LangChain: build the same RAG pipeline (load 3 text
files, chunk, embed, query) in both frameworks. Which has fewer lines of
code? Which gives you more control over chunking?

```python
# LlamaIndex version (~12 lines)
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
docs = SimpleDirectoryReader("./docs").load_data()
index = VectorStoreIndex.from_documents(docs)
print(index.as_query_engine().query("Your question here"))
```

## Real-World RAG Connection

LlamaIndex powers RAG systems at companies with diverse document ecosystems.
If your knowledge base is scattered across SharePoint, Confluence, Google
Docs, and Slack — LlamaIndex's 160+ connectors save weeks of custom
integration code. For single-source RAG (all documents in one format),
LangChain's simpler abstraction is often preferable.

## Common Pitfalls

- **Pitfall:** Choosing LlamaIndex for LLM orchestration (agents, chains)
  when LangChain has more mature patterns for that. **Fix:** Use LlamaIndex
  for indexing and retrieval, LangChain/LangGraph for agent orchestration.
  They work together — you can use LlamaIndex retrievers in LangChain chains.
- **Pitfall:** Default chunk sizes — LlamaIndex defaults to 1024 tokens which
  is too large for precise retrieval. **Fix:** Override with
  `Settings.chunk_size = 512` and benchmark on your data.
- **Pitfall:** Not setting `Settings.embed_model` and `Settings.llm` globally
  — every index creation instantiates a new model. **Fix:** Configure
  `Settings` once at app startup.

## Next Steps

- **Practice:** Install `llama-index`, run the 20-line example above with 3
  of your own documents, and inspect the `.query()` response's source nodes.
- **Read:** [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- **Related:** [llamaindex_adv](/lesson/llamaindex_adv) — advanced retrieval
  strategies and custom index construction
