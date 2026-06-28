---
id: agentic_rag_patterns
title: Agentic RAG Patterns
tier: expert
difficulty: expert
estimated_minutes: 30
module: agentic-rag
prerequisites: [agentic_rag_intro, agentic_rag_multi]
tags: [self-rag, crag, adaptive-rag, reflection, agent-judge]
---

## Concept Introduction
Agentic RAG patterns are formalized decision algorithms that govern when an agent retrieves, what it retrieves, and crucially, when it stops retrieving. Self-RAG, Corrective RAG (CRAG), and Adaptive RAG each encode different assumptions about retrieval quality and agent capability. Picking the right pattern for your data and use case is a 2-5x multiplier on answer accuracy with zero change to the underlying retrieval infrastructure.

## How It Works
**Self-RAG** (Asai et al., 2023) trains the LLM to generate special reflection tokens — `<retrieve>`, `<relevant>`, `<irrelevant>`, `<supported>`, `<partially-supported>`, `<contradictory>` — alongside its output. The model decides mid-generation whether to retrieve, whether retrieved passages are relevant, and whether each claim in its answer is supported by retrieved text. This is the most deeply integrated pattern because the reflection logic lives inside the model weights, not in external orchestration code. The cost is that you need a fine-tuned model.

**Corrective RAG (CRAG)** wraps any LLM with an external retrieval evaluator. After each retrieval, a lightweight classifier (often a fine-tuned BERT variant) scores each retrieved passage for relevance. If the average relevance falls below a threshold, CRAG triggers a corrective action: re-query with a different strategy, fall back to web search, or broaden the query. This is the most practical pattern for production because it works with any model and catches retrieval failures before they poison the answer.

**Adaptive RAG** routes each query through a complexity classifier first. Simple factoid questions get zero-shot LLM answers (no retrieval). Medium-complexity questions get a single retrieval pass. Complex multi-hop questions go through a full agentic loop. The router is typically a distilled classifier trained on synthetic data labeled by a strong model.

**Agent-as-Judge** runs a separate evaluation LLM after answer generation. The judge scores the answer on faithfulness, completeness, and relevance. If the score is below threshold, the system re-enters the retrieval loop with a reformulated query based on the judge's critique. This is the highest-latency pattern but catches errors that in-line reflection misses.

**Reflection loops** are the common substrate: observe output, evaluate quality, decide whether to iterate. The key design choice is what feedback signal drives the loop — internal reflection tokens (Self-RAG), external classifier scores (CRAG), or LLM critique (Agent-as-Judge).

## Code Examples

```python
from enum import Enum
import json

class Relevance(Enum):
    RELEVANT = "relevant"
    IRRELEVANT = "irrelevant"

def crag_retrieve(query: str, retrieval_fn, eval_model) -> list[dict]:
    """CRAG: retrieve, evaluate relevance, correct if needed."""
    passages = retrieval_fn(query)
    scores = [eval_model.score(query, p["content"]) for p in passages]
    avg_score = sum(scores) / len(scores) if scores else 0
    THRESHOLD = 0.5
    if avg_score < THRESHOLD:
        # Corrective action: broaden and retry
        broadened = f"{query} overview fundamentals"
        passages = retrieval_fn(broadened)
    return passages

def adaptive_route(query: str, router_model) -> str:
    """Classify query complexity to choose RAG strategy."""
    prompt = f"""Classify this query:
    SIMPLE (factoid, single entity) | MEDIUM (comparison, explanation) | COMPLEX (multi-hop, analysis)
    Query: {query}
    Classification:"""
    complexity = router_model(prompt).strip().upper()
    if "SIMPLE" in complexity:
        return "no_retrieval"
    elif "MEDIUM" in complexity:
        return "single_pass"
    return "agentic_loop"

def self_rag_generate(prompt: str, model, retrieval_fn) -> str:
    """Model internally decides when to retrieve via reflection tokens."""
    response = model.generate(prompt)  # model trained to emit <retrieve> tokens
    if "<retrieve>" in response:
        query = extract_query(response)
        passages = retrieval_fn(query)
        augmented_prompt = f"{prompt}\n\nRetrieved:\n{json.dumps(passages)}"
        response = model.generate(augmented_prompt)
    # Model emits <supported>/<contradictory> tokens internally
    return response.replace("<supported>", "").replace("<contradictory>", "[DISPUTED]")
```

## Try It Yourself
Implement all four patterns (Self-RAG simulation, CRAG, Adaptive RAG, Agent-as-Judge) against the same retrieval index and the same set of 20 challenging queries. For Self-RAG, simulate reflection tokens by having the LLM output structured JSON with relevance judgments. Measure: (a) answer accuracy, (b) average retrieval calls per query, (c) end-to-end latency. Determine which pattern wins at each query complexity level and propose a hybrid that uses the best pattern per query.

## Real-World RAG Connection
Self-RAG was developed at the University of Washington and is implemented in LangChain's self-rag module. CRAG is used in production at several legal-tech companies where retrieval precision on case law is non-negotiable. Adaptive RAG powers customer support systems at scale where the query distribution is a mix of simple FAQs and complex troubleshooting — routing simple queries past retrieval saves significant compute.

## Common Pitfalls
**Pitfall:** The relevance classifier in CRAG is trained on a different domain than the production retrieval index, so it marks domain-appropriate passages as irrelevant. **Fix:** Fine-tune the classifier on in-domain (query, passage, relevance) triples. Even 500 labeled examples dramatically improve domain alignment.

**Pitfall:** The complexity router in Adaptive RAG over-classifies queries as complex (conservative bias), routing everything through the expensive agentic loop and eliminating the cost savings. **Fix:** Calibrate the router's decision threshold on a labeled validation set. Optimize the threshold to achieve a target recall for truly complex queries while maximizing the fraction routed to simple paths.

**Pitfall:** Agent-as-Judge uses the same model as the generator, so it suffers from the same blind spots and approves its own mistakes. **Fix:** Use a different model family for the judge than the generator (e.g., Claude as judge when GPT-4 is the generator, or vice versa). Diversity of model architecture breaks self-consistency biases.

## Next Steps
Read the Self-RAG paper (Asai et al., 2023) and the CRAG paper (Yan et al., 2024). Study the Adaptive RAG implementation in LangGraph. Take mm_rag_images to explore multi-modal retrieval.
