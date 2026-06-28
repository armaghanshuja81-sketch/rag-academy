---
id: rag_routing
title: Query Routing for RAG
tier: expert
difficulty: expert
estimated_minutes: 30
module: optimization
prerequisites: [advanced_retrieval, agentic_rag_intro]
tags: [routing, intent-classification, cost-based-routing, fallback, synthetic-data]
---

## Concept Introduction
Query routing is the decision layer that sits in front of every retrieval pipeline and answers: "which retriever, which index, which model, for this specific query?" A router that sends a simple factoid question through an expensive agentic loop wastes money. A router that sends a complex multi-hop question through a single vector lookup produces a wrong answer. The routing architecture directly multiplies the quality-per-dollar of your RAG system — it is the highest-leverage optimization you can make after getting retrieval working.

## How It Works
**Intent classification** is the core routing mechanism. A classifier maps each user query to a route: `{vector_search, keyword_search, hybrid_search, sql_query, agentic_loop, direct_llm, graph_traversal}`. The classifier can be: (a) an LLM with a structured prompt (high accuracy, ~200ms latency), (b) a fine-tuned BERT-based classifier (comparable accuracy, <10ms latency), (c) a keyword/pattern matcher (low accuracy, zero latency).

**Router training with synthetic data:** The most effective approach is to use a strong LLM to generate 5,000-10,000 diverse queries covering all expected routes, label each with the correct route, then distill a BERT classifier. The synthetic query generation prompt should specify: query type, complexity, domain, expected information need, and variations. Train with cross-entropy loss and calibrate the output probabilities on a held-out set.

**Semantic vs keyword routing:** Semantic routing embeds the query, embeds route descriptions ("vector search is best for conceptual questions about..."), and routes to the closest description embedding. Keyword routing uses pattern matching (regex, keyword lists, entity detection). Semantic routing handles paraphrased queries better; keyword routing is deterministic and debuggable. Production systems often use keyword as a fast-path with semantic as fallback.

**Cost-based routing** adds an economic dimension: each route has a known compute cost (LLM calls, embedding operations, database queries). The router chooses the cheapest route that can handle the query, escalating to more expensive routes only when necessary. This is the "progressive disclosure" pattern: try vector search first (cheapest), if results are low-relevance, try hybrid search, if still insufficient, escalate to agentic loop.

**Fallback chains** are ordered lists of retrieval strategies. When route A returns low-confidence results, the system falls back to route B, then C. The fallback trigger is a relevance score threshold — if the top-K retrieval results have an average similarity below 0.6 (for cosine similarity), trigger fallback. Each fallback layer adds latency but improves recall.

## Code Examples

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from transformers import AutoTokenizer, AutoModel

class QueryRouter:
    def __init__(self, embedder_model: str = "BAAI/bge-small-en-v1.5"):
        self.tokenizer = AutoTokenizer.from_pretrained(embedder_model)
        self.embedder = AutoModel.from_pretrained(embedder_model)
        self.classifier = LogisticRegression(max_iter=1000)
        self.routes = []
        self.route_descriptions = {}
        self.route_costs = {}

    def register_route(self, name: str, description: str, cost: float):
        self.route_descriptions[name] = description
        self.route_costs[name] = cost
        self.routes.append(name)

    def _embed(self, text: str) -> np.ndarray:
        tokens = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():  # type: ignore
            output = self.embedder(**tokens)
        return output.last_hidden_state[:, 0, :].numpy().flatten()

    def train_with_synthetic_data(self, synthetic_queries: list[dict]):
        """Train on synthetic (query, route) pairs."""
        X = np.array([self._embed(q["query"]) for q in synthetic_queries])
        y = [q["route"] for q in synthetic_queries]
        self.classifier.fit(X, y)

    def route(self, query: str, strategy: str = "classifier") -> str:
        """Route a query to the best retrieval strategy."""
        if strategy == "keyword":
            return self._keyword_route(query)
        elif strategy == "semantic":
            return self._semantic_route(query)
        else:  # classifier
            emb = self._embed(query).reshape(1, -1)
            probs = self.classifier.predict_proba(emb)[0]
            route_idx = np.argmax(probs)
            return self.classifier.classes_[route_idx]

    def cost_based_route(self, query: str, relevance_threshold: float = 0.6,
                         retriever_fn=None) -> tuple[str, list]:
        """Progressive disclosure: try cheapest routes first."""
        ordered_routes = sorted(self.routes, key=lambda r: self.route_costs[r])
        for route in ordered_routes:
            results = retriever_fn(query, route)  # In production, this uses actual retrievers
            avg_score = np.mean([r.get("score", 0) for r in results])
            if avg_score >= relevance_threshold:
                return route, results
        # All routes failed — return most expensive route results as best effort
        return ordered_routes[-1], retriever_fn(query, ordered_routes[-1])

    def _semantic_route(self, query: str) -> str:
        query_emb = self._embed(query)
        scores = {}
        for route, desc in self.route_descriptions.items():
            desc_emb = self._embed(desc)
            scores[route] = np.dot(query_emb, desc_emb)
        return max(scores, key=scores.get)

    def _keyword_route(self, query: str) -> str:
        ql = query.lower()
        if any(w in ql for w in ["compare", "difference", "vs", "versus"]):
            return "hybrid_search"
        if any(w in ql for w in ["how many", "count", "total", "sum", "average"]):
            return "sql_query"
        if any(w in ql for w in ["who", "what", "when", "where"]):
            return "vector_search"
        return "agentic_loop"

import torch
```

## Try It Yourself
Build a router for a production RAG system with four routes: vector_search, keyword_search, sql_query, and agentic_loop. Generate 2,000 synthetic queries covering all routes using an LLM. Train three router variants: BERT-based classifier, semantic router (embedding similarity to route descriptions), and keyword router (regex patterns). Evaluate all three on 200 real queries with ground-truth route labels. Measure accuracy, latency, and "expensive mistakes" (routing a simple query to the agentic loop). Determine which variant gives the best cost-accuracy tradeoff for your query distribution. Implement a progressive disclosure fallback chain and measure the added latency cost of fallback vs the recall improvement.

## Real-World RAG Connection
Query routing is deployed at scale at companies like Perplexity (route between search, Wolfram Alpha, and direct LLM) and RAG-based customer support systems (route between FAQ lookup, documentation search, and live agent escalation). The state-of-the-art is LLM-as-judge routing: a fast model (Haiku, Flash) classifies the query, and only complex queries are forwarded to a more accurate but slower router. This two-tier architecture gives the best of both speed and accuracy.

## Common Pitfalls
**Pitfall:** The router is trained on synthetic data that does not match the distribution of real user queries — users phrase things differently than the synthetic generator. **Fix:** Deploy with the synthetic-data router, log real queries, manually label a sample (500 queries is enough), and fine-tune the router on real data. Repeat quarterly as query distributions shift.

**Pitfall:** The keyword router overrides the classifier for certain patterns, but those patterns have high false-positive rates (e.g., "how many" matches both "how many users signed up" (SQL) and "how many ways can you approach this problem" (not SQL)). **Fix:** Use keyword as a pre-filter to narrow candidates, not as a final decision. Have the semantic or classifier router verify keyword-suggested routes before dispatching.

**Pitfall:** Cost-based routing greedily chooses the cheapest route even when it is clearly inappropriate, causing high failure rates that trigger expensive fallbacks anyway. **Fix:** Include a query complexity estimate (e.g., number of entities, presence of comparison language, question length) in the routing decision. Complex queries skip the cheap routes entirely.

## Next Steps
Read the query routing documentation in LangChain and LlamaIndex. Study the Perplexity architecture. Take rag_conv_mem to add conversational memory to your routing decisions.
