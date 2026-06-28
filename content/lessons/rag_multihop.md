---
id: rag_multihop
title: Multi-Hop Retrieval
tier: senior
difficulty: advanced
estimated_minutes: 25
module: retrieval
prerequisites: [rag_rerank, rag_hybrid]
tags: [multi-hop, retrieval, question-decomposition, ircot, iterative-retrieval]
---

## Concept Introduction

Single-hop retrieval fails on questions where the answer depends on information spread across multiple documents. "What drug did the researcher who discovered penicillin later warn about overuse of?" requires finding the discoverer (doc 1: Fleming) and then finding what drug he warned about (doc 2). Multi-hop retrieval chains lookups: each retrieval step uses information from the previous step to refine the next query. This lesson covers the three multi-hop architectures and when single-hop suffices.

## How It Works

There are three architectures for multi-hop retrieval. The simplest is sequential retrieval: retrieve, extract key entities or claims from the top result, formulate a follow-up query, retrieve again. This works for two-hop questions but degrades beyond that -- errors compound, and a wrong entity extracted from step 1 poisons step 2.

Question decomposition uses an LLM to break the original question into sub-questions before any retrieval happens: `["Who discovered penicillin?", "What drug did Alexander Fleming warn about?"]`. Each sub-question is answered independently, and a final LLM call synthesizes the answers. This is more robust than sequential because sub-questions are independent -- a failure in one does not poison the others. The tradeoff is cost: N sub-questions mean N retrieval calls and N+1 LLM calls.

IRCoT (Interleaving Retrieval with Chain-of-Thought) interleaves retrieval steps with reasoning steps. After each retrieval, the model thinks about what it found, what is missing, and what to search for next. This handles questions where decomposition is itself hard -- "What was the economic impact of the policy enacted after the event mentioned in document X?" -- because the reasoning chain guides retrieval adaptively.

When single-hop fails: the question has a relationship that spans documents (X who worked at Y which was acquired by Z), the question requires comparison ("how does A differ from B"), or the question has a temporal chain ("what happened after X led to Y").

## Code Examples

```python
import asyncio

async def decompose_and_answer(query: str, retriever, llm) -> str:
    # Step 1: LLM decomposes the question
    sub_questions: list[str] = await llm.call(
        f"Break this question into independent sub-questions:\n{query}\nOutput one per line."
    )

    # Step 2: Retrieve for each sub-question concurrently
    async def retrieve_one(sq: str) -> list[str]:
        return await retriever.search(sq, k=3)

    all_results = await asyncio.gather(*(retrieve_one(sq) for sq in sub_questions))

    # Step 3: Synthesize with all retrieved context
    context = "\n\n".join(
        f"Sub-question: {sq}\nResults: {results}"
        for sq, results in zip(sub_questions, all_results)
    )
    return await llm.call(f"Answer the question using this context:\n{context}\n\nQuestion: {query}")
```

```python
# IRCoT pattern: interleave reasoning and retrieval
async def ircot(query: str, retriever, llm, max_steps: int = 4) -> str:
    context_chunks: list[str] = []
    reasoning = ""

    for step in range(max_steps):
        # Retrieve based on accumulated reasoning
        search_query = f"{query} {reasoning}" if reasoning else query
        new_chunks = await retriever.search(search_query, k=3)
        context_chunks.extend(new_chunks)

        # Reason about what we have and what is missing
        reasoning = await llm.call(
            f"Context: {new_chunks}\nPrevious reasoning: {reasoning}\n"
            f"Original question: {query}\n"
            f"What information is still missing? What should we search for next?"
        )

        if "ANSWER:" in reasoning:
            break

    return await llm.call(f"Context: {context_chunks}\nAnswer: {query}")
```

## Try It Yourself

Using a Wikipedia-based retriever (or your own document set), craft 5 multi-hop questions. Run them through single-hop retrieval and record whether the top-5 results contain the answer. Then run them through question decomposition and IRCoT. Compare accuracy and total LLM calls for each approach.

## Real-World RAG Connection

A pharma RAG system answers researcher questions like "What compounds similar to drug X were tested against the target identified in paper Y?" The system decomposes into four sub-questions: (1) What is drug X's chemical structure? (2) What target does paper Y identify? (3) Which compounds have similar structure to X? (4) Which of those were tested against the target? Parallel retrieval across 3 million papers completes in under 2 seconds.

## Common Pitfalls

- **Decomposition without verification.** If sub-question 1 returns a hallucinated answer, sub-question 2 builds on a false premise. Always run a verification step: ask the LLM whether the retrieved context actually supports each sub-answer.
- **Unbounded retrieval depth.** A poorly-formulated IRCoT query can loop forever, adding marginal context each time. Always cap the number of retrieval steps and monitor the token budget.
- **Treating all sub-questions as equal.** Some sub-questions define the answer; others are supporting. Weight them in the final synthesis step rather than concatenating blindly.

## Next Steps

- Paper: "Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions" (IRCoT)
- Lesson: **Query Transformation** for complementary techniques
