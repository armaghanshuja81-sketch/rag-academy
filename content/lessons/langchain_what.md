---
id: langchain_what
title: What is LangChain?
tier: junior
difficulty: beginner
estimated_minutes: 15
module: langchain
prerequisites: [rag_what]
tags: [langchain, framework, orchestration]
---

## Concept Introduction

You could write a RAG pipeline from scratch — manually calling the embedding
API, searching the vector database, formatting the prompt, and calling the
LLM. Or you could use LangChain, which provides pre-built components that wire
together into a RAG pipeline in under 30 lines of code. By the end of this
lesson you'll understand what LangChain is, what it provides, and when to use
it versus building your own.

## How It Works

LangChain is a Python framework for building LLM-powered applications. It
provides three layers of abstraction:

1. **Components**: Modular building blocks — LLM wrappers, prompt templates,
   document loaders, text splitters, vector store connectors, retrievers.
2. **Chains**: Sequences of components wired together. A basic RAG chain:
   retrieve → format prompt → call LLM → return answer.
3. **Agents**: Chains where the LLM decides which tools to use and in what
   order. The LLM reasons about the question and picks the right tool.

The key insight: LangChain standardizes the interfaces between components. Any
vector store, any LLM, any embedding model — they all conform to the same
interface, so you can swap them without rewriting your pipeline.

## Code Examples

A complete RAG pipeline in LangChain:

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama

# 1. Load and chunk
loader = TextLoader("knowledge_base.txt")
documents = loader.load()
chunks = RecursiveCharacterTextSplitter(
    chunk_size=512, chunk_overlap=50
).split_documents(documents)

# 2. Embed and store
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 3. Build QA chain
llm = Ollama(model="llama3")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# 4. Ask questions
answer = qa_chain.invoke("What is the return policy?")
print(answer)
```

Prompt templates — inject variables into prompts cleanly:

```python
from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "Answer using only this context:\n{context}"),
    ("user", "{question}")
])

formatted = template.format_messages(
    context="RAG stands for Retrieval-Augmented Generation.",
    question="What does RAG stand for?"
)
```

## Try It Yourself

Write a LangChain chain description (no code required) that implements a
"query rewriting" RAG step: the user's question is first rephrased by the LLM
into 3 search-optimized variants, then each variant is used to retrieve
documents, and the union of all results is deduplicated before generation:

```
User question → LLM rewriter (generates 3 variants) →
  variant 1 → vector store → results A
  variant 2 → vector store → results B
  variant 3 → vector store → results C
→ deduplicate(A ∪ B ∪ C) → top-5 → LLM generator → answer
```

## Real-World RAG Connection

LangChain is the most widely used RAG orchestration framework in production.
It handles the plumbing — chunking, embedding, vector store integration,
prompt templating, and output parsing — so you focus on retrieval quality and
prompt design. Most production RAG systems use either LangChain or LlamaIndex
(its main competitor) rather than raw API calls.

## Common Pitfalls

- **Pitfall:** Using LangChain without understanding the underlying concepts.
  If you can't build RAG from scratch, LangChain's abstractions will confuse
  rather than help. **Fix:** Learn the raw pipeline first (rag_what lesson),
  then adopt LangChain.
- **Pitfall:** Default chunk sizes — LangChain's default 1000-character chunks
  may not suit your documents. **Fix:** Tune `chunk_size` and `chunk_overlap`
  for your specific content type.
- **Pitfall:** LCEL (LangChain Expression Language) versus legacy chain syntax.
  New tutorials use `|` pipe syntax; old tutorials use `.from_chain_type()`.
  **Fix:** Both work, but LCEL (`chain = prompt | llm | parser`) is the
  modern approach.

## Next Steps

- **Practice:** Install LangChain (`pip install langchain langchain-community`)
  and run the 4-step RAG example above with your own text file as the
  knowledge base.
- **Read:** [LangChain Quickstart](https://python.langchain.com/docs/get_started/quickstart)
- **Related:** [chromadb](/lesson/chromadb) — the vector database that
  LangChain integrates with most cleanly
