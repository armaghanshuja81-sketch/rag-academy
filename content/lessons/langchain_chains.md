---
id: langchain_chains
title: Chains & RetrievalQA
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: frameworks
prerequisites: [langchain_intro]
tags: [langchain, chains, retrievalqa, lcel]
---

## Concept Introduction

Chains are LangChain's abstraction for composing multiple steps into a single callable pipeline. A chain takes an input, passes it through a sequence of operations, and returns a result — think of it as a function built from reusable components. By the end of this lesson you'll build RAG chains using RetrievalQA, compose custom chains with LCEL, and choose the right chain type for how you combine retrieved documents.

## How It Works

At the core, every chain is a sequence of Runnables connected by the pipe operator `|`. LangChain Expression Language (LCEL) makes this declarative: `chain = prompt | llm | output_parser` means "feed input through the prompt template, send the result to the LLM, parse the output." Each Runnable has `.invoke()` and `.stream()` methods, and chains automatically handle batching and async when available.

RetrievalQA wraps the full RAG flow into a single chain. It takes a question, calls a retriever to fetch documents, stuffs them into a prompt, calls the LLM, and returns the answer. Behind the scenes it's just an LCEL chain with a retriever prepended.

The "chain type" parameter controls how multiple documents are combined into the prompt:
- **stuff:** Dump all retrieved documents into one prompt. Simplest, fastest, but fails when documents exceed the model's context window.
- **map_reduce:** Send each document to the LLM separately, get individual answers, then combine them. Handles arbitrarily many documents but costs more (one LLM call per document + one combination call).
- **refine:** Feed documents one at a time, iteratively updating the answer. Better coherence than map_reduce, but sequential — you can't parallelize it.
- **map_rerank:** Score each document's relevance with the LLM, keep only the best. Useful when retrieval quality is low and you need a second filtering pass.

## Code Examples

Build a RetrievalQA chain from components:

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True,
)
result = qa_chain.invoke({"query": "What is FAISS?"})
print(f"Answer: {result['result']}")
for doc in result["source_documents"]:
    print(f"  Source: {doc.metadata.get('source', 'unknown')[:60]}")
```

Same chain, but built explicitly with LCEL so you can customize the prompt:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

template = """Answer using only the context below. If unsure, say so.

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

def format_docs(docs):
    return "\n\n".join(f"DOC {i}: {d.page_content}" for i, d in enumerate(docs))

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

answer = rag_chain.invoke("What is FAISS?")
print(answer)
```

A custom chain with two sequential LLM calls — first draft an answer, then critique it:

```python
from langchain_core.runnables import RunnableLambda

draft_chain = prompt | llm | StrOutputParser()

def critique_prompt(draft):
    return f"Critique this answer for factual errors:\n\n{draft}\n\nCritique:"

critique_chain = RunnableLambda(critique_prompt) | llm | StrOutputParser()

full_chain = {"answer": draft_chain, "question": RunnablePassthrough()}
# full_chain outputs the draft; critique runs after
```

## Try It Yourself

Build a RAG chain with LCEL that retrieves 6 documents, formats them into a structured context string, and uses a custom prompt that explicitly tells the model to cite document IDs in its answer. Then test it with a question that requires information from multiple documents:

```python
def format_with_ids(docs):
    parts = []
    for d in docs:
        doc_id = d.metadata.get("id", "unknown")
        parts.append(f"[{doc_id}] {d.page_content}")
    return "\n\n".join(parts)

prompt = ChatPromptTemplate.from_template(
    "Context:\n{context}\n\n"
    "Question: {question}\n\n"
    "Answer with inline citations like [doc_id]."
)
# Complete the chain and test with your retriever
```

## Real-World RAG Connection

In production, chains are your testing surface. You swap chain types — stuff is fast but breaks on 50-document retrievals; map_reduce handles volume but each LLM call sees only one document so cross-document connections are lost. The LCEL approach (`retriever | format | prompt | llm | parser`) is the standard production pattern because it gives you explicit control over how documents enter the prompt, which is where RAG quality is won or lost.

## Common Pitfalls

- **Pitfall:** Using "stuff" with large retrievals. If your retriever returns 10 documents of 1000 tokens each, you exceed the model's context window and get a truncation error or, worse, silently dropped context. **Fix:** Monitor `sum(len(d.page_content) for d in docs)` and switch to map_reduce or reduce k when it exceeds your model's limit.
- **Pitfall:** Not passing `return_source_documents=True`. You get an answer with no way to verify where it came from. **Fix:** Always request source documents and display them alongside the answer for user trust.
- **Pitfall:** Using the default prompt in RetrievalQA. The default "Use the following pieces of context to answer" prompt doesn't instruct the model to say "I don't know." **Fix:** Always provide a custom prompt that includes fallback language like "If the context doesn't contain the answer, say so clearly."

## Next Steps

- **Practice:** Build the same RAG query with stuff, map_reduce, and refine chain types on a set of 12 retrieved documents. Compare answer quality, latency, and token usage.
- **Read:** [LangChain LCEL](https://python.langchain.com/docs/expression_language/)
- **Related:** [langchain_tools](/lesson/langchain_tools) — extend your chain with tool-calling capabilities for agentic behavior
