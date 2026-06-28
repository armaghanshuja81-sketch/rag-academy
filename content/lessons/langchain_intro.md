---
id: langchain_intro
title: LangChain Overview
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: frameworks
prerequisites: [langchain_what, rag_pipeline_full]
tags: [langchain, orchestration, framework]
---

## Concept Introduction

LangChain is the standard Python framework for composing LLM-powered applications. It provides reusable building blocks — prompt templates, retrievers, chains, and agents — that you wire together instead of writing boilerplate from scratch. By the end of this lesson you'll install LangChain, understand its core abstractions, and build a working RAG chain using its components.

## How It Works

LangChain's architecture rests on five abstractions that compose together:

- **LLMs/ChatModels:** Wrappers around API providers (OpenAI, Anthropic, etc.) that standardize the interface. Switch from GPT-4o to Claude by changing one import — the rest of your code stays the same.
- **Prompts:** Templates with variables (`ChatPromptTemplate`). You define the structure once, then `.invoke({"variable": value})` with different inputs. Template serialization means you can version-control your prompts.
- **Chains:** Sequences of components connected with `|` (LCEL). Each component is a "Runnable" — anything with `.invoke()`, `.stream()`, `.batch()`. The framework handles parallelism, retries, and fallbacks automatically.
- **Retrievers:** Interface for fetching documents: `retriever.invoke("query")` returns a list of Document objects. LangChain ships retrievers for ChromaDB, FAISS, Pinecone, and 30+ other vector stores.
- **Tools:** Functions the LLM can call. A tool is a function with a name, description, and JSON schema. The LLM decides which tool to call and with what arguments.

The framework is split across packages: `langchain-core` (base abstractions), `langchain` (high-level chains like RetrievalQA), `langchain-community` (third-party integrations), and `langgraph` (stateful agent graphs). For production RAG, most teams use langchain-core + langchain-community directly and skip the high-level chains.

## Code Examples

Install the essentials:

```bash
pip install langchain langchain-core langchain-openai langchain-community chromadb
```

A complete RAG chain in LangChain — each component is explicit:

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import Chroma

# 1. Vector store with retriever
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# 2. Prompt template
prompt = ChatPromptTemplate.from_template(
    "Answer using only this context:\n{context}\n\nQuestion: {question}"
)

# 3. LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# 4. Format function — joins retrieved docs into one string
def format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)

# 5. The chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke("What is the RAG architecture?")
print(result)
```

LangChain vs raw Python — the same operation written both ways shows what the framework gives you. Raw version: you import two different provider libraries, handle their different interfaces, manage async yourself. LangChain version: one interface regardless of provider.

```python
# Raw Python — two different libraries, two different interfaces
from openai import OpenAI
oai = OpenAI(); oai.chat.completions.create(model="gpt-4o", messages=[...])

from anthropic import Anthropic
ant = Anthropic(); ant.messages.create(model="claude-sonnet-4-6", messages=[...])

# LangChain — unified interface, swap model with one line
from langchain_openai import ChatOpenAI
# from langchain_anthropic import ChatAnthropic  # Swap here
llm = ChatOpenAI(model="gpt-4o")
llm.invoke("Hello")  # Same .invoke() regardless of provider
```

## Try It Yourself

Install LangChain and build a chain that takes a topic, uses a prompt template to ask the LLM to generate 3 questions about that topic, and parse the output into a Python list. Use `StrOutputParser` for parsing and `ChatPromptTemplate` for the prompt:

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template(
    "Generate 3 specific questions about {topic}. "
    "Return one question per line, no numbering."
)
llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
chain = prompt | llm | StrOutputParser()

questions = chain.invoke({"topic": "vector databases"})
print(questions.split("\n"))
```

## Real-World RAG Connection

In a production RAG application, LangChain handles the plumbing: the retriever fetches documents from your vector store, the prompt template injects them into a structured format, the LLM generates the answer, and the output parser extracts just the text. When you change vector stores (ChromaDB to Pinecone) or LLM providers (OpenAI to Anthropic), only the import and initialization change — the chain structure stays identical. This provider-agnostic design is LangChain's primary value proposition for RAG development.

## Common Pitfalls

- **Pitfall:** Installing the wrong package. `pip install langchain` gives you the monolith with everything; `pip install langchain-core langchain-openai` gives you just what you need. **Fix:** Start with `langchain-core`, `langchain-openai`, and `langchain-community`. Add integrations as needed.
- **Pitfall:** Using `from langchain import X` when X moved to `langchain-core` or `langchain-community`. The monolith package is being deprecated in favor of the split packages. **Fix:** Check the import path in the documentation — core abstractions are in `langchain_core`, integrations in `langchain_community`, provider-specific in `langchain_openai`/`langchain_anthropic`.
- **Pitfall:** Relying on high-level chains (like `RetrievalQA`) without understanding what they do internally. When something breaks, you can't debug it. **Fix:** Build every chain with explicit LCEL first. Once you understand the data flow, the convenience wrappers are optional.

## Next Steps

- **Practice:** Build a RAG chain that uses two different retrievers (ChromaDB and a simple keyword search) and merges their results before passing them to the LLM.
- **Read:** [LangChain Python docs](https://python.langchain.com/docs/get_started/introduction)
- **Related:** [langchain_chains](/lesson/langchain_chains) — go deeper into chain types and the RetrievalQA abstraction
