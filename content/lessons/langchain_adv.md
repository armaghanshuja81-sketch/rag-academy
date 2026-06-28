---
id: langchain_adv
title: "LangChain: Advanced Patterns"
tier: senior
difficulty: advanced
estimated_minutes: 25
module: frameworks
prerequisites: [rag_rerank, rag_cache]
tags: [langchain, lcel, langgraph, fallback, custom-retriever]
---

## Concept Introduction

LangChain is simultaneously the most popular RAG framework and the most criticized. The criticism is valid for the high-level `RetrievalQA` chain -- it hides too many decisions behind defaults that are wrong for production. But LangChain's lower-level primitives (LCEL, custom retrievers, LangGraph) are genuinely useful for composing RAG pipelines declaratively. This lesson covers the LangChain patterns worth adopting and the parts you should avoid.

## How It Works

LCEL (LangChain Expression Language) uses the `|` pipe operator to compose runnable components: `prompt | llm | output_parser`. Each component receives the output of the previous one, and the entire chain is a runnable with `.invoke()`, `.batch()`, and `.stream()` methods. The architectural benefit: LCEL automatically handles async dispatch, streaming passthrough, and parallel execution of independent branches. If you write `retriever | prompt | llm`, LCEL ensures that `stream()` propagates tokens from the LLM through the pipe without buffering.

Custom retrievers implement `BaseRetriever._get_relevant_documents(query)` and plug into any LCEL chain. This is the integration point where you inject your own retrieval logic (hybrid search, reranking, parent document lookup) while keeping the LCEL composition benefits for the rest of the pipeline. The pattern is: wrap your retrieval logic in a custom retriever class once, then compose it declaratively everywhere.

Fallback chains handle degraded operation. `chain.with_fallbacks([fallback_chain])` tries the primary chain and, if it raises an exception, retries with the fallback. For RAG: primary chain uses GPT-4o with a comprehensive prompt, fallback uses GPT-4o-mini with a simplified prompt. If the primary times out or hits a rate limit, the fallback runs automatically. This is harder to implement correctly without LangChain's built-in fallback routing.

LangGraph (also from the LangChain ecosystem) extends this to stateful, cyclic graphs. A RAG pipeline with an optional reranking step, a quality gate that loops back for re-retrieval, and conditional routing based on query type is awkward as a linear LCEL chain but natural as a LangGraph with nodes and conditional edges. Use LangGraph when your pipeline has branching, looping, or state persistence requirements; use plain LCEL for linear A-to-B pipelines.

## Code Examples

```python
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document

# Custom retriever wrapping your hybrid + rerank logic
class HybridRerankRetriever(BaseRetriever):
    def _get_relevant_documents(self, query: str, *, run_manager=None) -> list[Document]:
        # Your own retrieval logic here
        candidates = hybrid_search(query, k=50)
        reranked = cross_encoder_rerank(query, candidates, top_k=10)
        return [Document(page_content=r.content, metadata={"score": r.score}) for r in reranked]

# LCEL composition with parallel context retrieval
chain = (
    RunnableParallel({
        "context": HybridRerankRetriever() | (lambda docs: "\n\n".join(d.page_content for d in docs)),
        "question": RunnablePassthrough(),
    })
    | (lambda d: f"Context: {d['context']}\n\nQuestion: {d['question']}")
    | llm
    | StrOutputParser()
)

# Fallback: GPT-4o-mini if GPT-4o fails
primary = ChatOpenAI(model="gpt-4o") | prompt | StrOutputParser()
fallback = ChatOpenAI(model="gpt-4o-mini") | prompt | StrOutputParser()
robust_chain = primary.with_fallbacks([fallback])
```

```python
# LangGraph: quality gate with re-retrieval loop
from langgraph.graph import StateGraph, END

class RAGState(TypedDict):
    query: str
    context: list[str]
    answer: str
    quality_score: float

def retrieve(state: RAGState) -> RAGState:
    state["context"] = retriever.search(state["query"])
    return state

def generate(state: RAGState) -> RAGState:
    state["answer"] = llm.invoke(state["query"], state["context"])
    return state

def quality_gate(state: RAGState) -> str:
    return "pass" if state["quality_score"] > 0.8 else "rewrite_and_retry"

graph = StateGraph(RAGState)
graph.add_node("retrieve", retrieve)
graph.add_node("generate", generate)
graph.add_conditional_edges("generate", quality_gate, {"pass": END, "rewrite_and_retry": "retrieve"})
```

## Try It Yourself

Take your existing RAG pipeline and wrap the retrieval logic in a `BaseRetriever` subclass. Compose it with LCEL: `custom_retriever | prompt | llm`. Compare the code verbosity against your imperative implementation. Then add a `.with_fallbacks()` with a cheaper model and trigger a failure in the primary (e.g., wrong API key) to verify the fallback engages.

## Real-World RAG Connection

A production chatbot uses LangGraph for a complex pipeline: retrieve, generate, run a hallucination check, and if hallucination is detected, rewrite the query and loop back through retrieval and generation. The graph state persists across loops so the rewrite prompt includes what was attempted previously. Implementing this as imperative code with manual retry logic would be roughly 200 lines; the LangGraph implementation is 60.

## Common Pitfalls

- **Using `RetrievalQA.from_chain_type` for production.** This chains hides chunking strategy, prompt format, and retrieval defaults that are almost always wrong for your specific use case. Use it for prototyping, then rewrite with LCEL and explicit control.
- **LCEL magic that becomes unreadable.** Chain five `|` operators with lambdas and `RunnableParallel` and the pipeline becomes write-only. Name intermediate steps and use functions instead of inline lambdas for non-trivial transformations.
- **LangGraph for linear pipelines.** A LangGraph with three nodes and no branching is just a convoluted function call. Use LCEL for linear, LangGraph for branching/cycling.

## Next Steps

- LangChain documentation on LCEL and Runnable interface
- Lesson: **LlamaIndex Advanced Patterns** for when to choose LlamaIndex instead
