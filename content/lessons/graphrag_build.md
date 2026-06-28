---
id: graphrag_build
title: GraphRAG Full Implementation
tier: expert
difficulty: expert
estimated_minutes: 30
module: graph-rag
prerequisites: [graphrag_concepts, graphrag_neo4j]
tags: [microsoft-graphrag, leiden, community-detection, global-search, local-search]
---

## Concept Introduction
Microsoft's GraphRAG paper (Edge et al., 2024) introduced a paradigm shift: use community detection on a knowledge graph to generate structured summaries of topic clusters, then answer questions by locating the relevant community and reading its precomputed summary. This is "global search" — understanding the shape of a corpus before drilling into specifics. Combined with "local search" (entity-centric graph traversal), it produces answers that capture both granular facts and high-level themes.

## How It Works
The Microsoft GraphRAG pipeline has five stages:

**Stage 1 — Entity and Relationship Extraction:** An LLM processes each document chunk and extracts entities, relationships, and claims. Entities have types (PERSON, ORGANIZATION, EVENT, CONCEPT), descriptions, and source citations. Relationships connect entities with a verb phrase and weight (frequency across documents). Claims are extracted assertions with a truthiness score.

**Stage 2 — Graph Construction:** Entities become nodes, relationships become edges. The graph is weighted by co-occurrence frequency. Entity resolution merges duplicate nodes using embedding similarity on entity names and descriptions.

**Stage 3 — Community Detection:** The Leiden algorithm (an improved version of Louvain) partitions the graph into communities — clusters of tightly interconnected entities. The key insight: a community represents a coherent topic or theme. Leiden runs in near-linear time and produces hierarchical community structures at multiple resolution levels.

**Stage 4 — Community Summarization:** For each detected community, the LLM generates a structured summary: title, key entities, main themes, and relationships between entities. These summaries become the "global index" — instead of chunk-level vector search, a query can be matched against community summaries to find the relevant topic area.

**Stage 5 — Query Modes: Global Search** operates at the community level. The query is matched against community summaries, the top communities are selected, and their summaries are combined (using map-reduce over a sliding window of summaries) to produce an answer. **Local Search** operates at the entity level: the query is embedded, semantically matching entities are found, their 1-hop neighborhood is retrieved, and an LLM synthesizes an answer from the local subgraph context.

The critical performance decision is the community resolution parameter — higher resolution produces more and smaller communities, improving local search specificity but fragmenting global search context. Lower resolution produces fewer, larger communities that give richer global summaries but less precise topic boundaries.

## Code Examples

```python
import networkx as nx
import numpy as np
from typing import TypedDict
import json

class CommunitySummary(TypedDict):
    community_id: int
    title: str
    entities: list[str]
    themes: list[str]
    summary: str

class GraphRAGPipeline:
    def __init__(self, llm, embedder):
        self.llm = llm
        self.embedder = embedder
        self.G = nx.Graph()
        self.communities = []
        self.community_summaries = []

    def stage3_leiden(self, resolution: float = 1.0) -> dict[int, list[str]]:
        """Run Leiden community detection on the constructed graph."""
        import leidenalg
        import igraph as ig
        # Convert NetworkX to igraph
        node_list = list(self.G.nodes())
        node_to_idx = {n: i for i, n in enumerate(node_list)}
        edges = [(node_to_idx[u], node_to_idx[v]) for u, v in self.G.edges()]
        ig_graph = ig.Graph(n=len(node_list), edges=edges, directed=False)
        # Leiden with modularity optimization
        partition = leidenalg.find_partition(
            ig_graph,
            leidenalg.ModularityVertexPartition,
            n_iterations=10,
            resolution_parameter=resolution,
            seed=42
        )
        # Map community IDs back to entity names
        communities = {}
        for community_id in set(partition.membership):
            members = [node_list[i] for i, c in enumerate(partition.membership) if c == community_id]
            communities[community_id] = members
        self.communities = communities
        return communities

    def stage4_summarize_communities(self) -> list[CommunitySummary]:
        """Generate structured summaries for each community."""
        summaries = []
        for comm_id, entities in self.communities.items():
            # Collect relationships within this community
            subgraph = self.G.subgraph(entities)
            edges = [(u, v, d["relationship"])
                     for u, v, d in subgraph.edges(data=True) if "relationship" in d]
            prompt = f"""Summarize this topic cluster:
            Entities: {entities[:50]}
            Relationships: {edges[:100]}
            Generate JSON with: title, entities (top 10), themes, summary (150 words)."""
            result = json.loads(self.llm(prompt))
            result["community_id"] = comm_id
            summaries.append(result)
        self.community_summaries = summaries
        return summaries

    def global_search(self, query: str, top_communities: int = 3) -> str:
        """Global search: match query to community summaries, synthesize answer."""
        query_emb = self.embedder(query)
        summary_embs = [self.embedder(s["summary"]) for s in self.community_summaries]
        scores = np.dot(np.array(summary_embs), np.array(query_emb))
        top_indices = np.argsort(scores)[-top_communities:][::-1]
        # Map-reduce over selected community summaries
        selected = [self.community_summaries[i] for i in top_indices]
        context = "\n\n".join(
            f"Topic: {s['title']}\nThemes: {', '.join(s['themes'])}\n{s['summary']}"
            for s in selected
        )
        answer_prompt = f"""Using these topic summaries, answer the question:

        Context:
        {context}

        Question: {query}

        Synthesize an answer that captures both the broad themes and specific facts."""
        return self.llm(answer_prompt)

    def local_search(self, query: str, top_entities: int = 5) -> str:
        """Local search: find entities by embedding, retrieve subgraph context."""
        query_emb = self.embedder(query)
        entity_names = list(self.G.nodes())
        entity_embs = [self.embedder(name) for name in entity_names]
        scores = np.dot(np.array(entity_embs), np.array(query_emb))
        top_indices = np.argsort(scores)[-top_entities:][::-1]
        # Collect 1-hop neighborhood
        context = []
        for i in top_indices:
            entity = entity_names[i]
            neighbors = list(self.G.neighbors(entity))
            for n in neighbors:
                edge_data = self.G.edges[entity, n]
                context.append(f"{entity} {edge_data.get('relationship', 'RELATES_TO')} {n}")
        prompt = f"""Answer using entity-relationship context:

        Graph Context:
        {chr(10).join(context)}

        Question: {query}"""
        return self.llm(prompt)
```

## Try It Yourself
Re-implement the Microsoft GraphRAG pipeline from scratch on the AP News dataset (or any corpus of ~1,000 documents). Build all five stages. Tune the Leiden resolution parameter at [0.5, 1.0, 2.0, 5.0] and evaluate global search quality at each setting using 10 queries with rubric-scored answers. Implement a "drill-down" query mode: global search identifies the relevant community, then local search within that community retrieves specific facts. Compare against a baseline vector-RAG system on answer completeness and ability to identify cross-document themes.

## Real-World RAG Connection
Microsoft's open-source GraphRAG implementation (github.com/microsoft/graphrag) is the reference pipeline and has been adopted across the enterprise for document intelligence. The approach has been evaluated on podcast transcripts, legal documents, and scientific literature. The leading open problem is cost: the LLM-based extraction and summarization stages are expensive for large corpora. Research into smaller extraction models, incremental index updates, and caching of community summaries is the current frontier.

## Common Pitfalls
**Pitfall:** Community detection produces one giant community containing 80% of entities because the graph is too densely connected. **Fix:** Increase the Leiden resolution parameter (try 2.0-5.0). Alternatively, prune low-weight edges before community detection — edges with weight below the 75th percentile often represent noise connections that collapse the community structure.

**Pitfall:** Community summaries are generic and unhelpful ("this community contains entities related to business") because the entities are too diverse for the LLM to find a coherent theme. **Fix:** Compute the community's internal connectivity (modularity contribution). If low, split the community by running Leiden recursively within it at higher resolution. Only summarize communities that pass a coherence threshold.

**Pitfall:** The global search context exceeds the LLM context window when the corpus has many communities, making map-reduce across all community summaries impossible. **Fix:** Pre-filter communities: embed the query, compute similarity to all community summaries, and keep only the top 20% before running map-reduce. This two-stage retrieval (community ranking, then in-depth reading) is the production pattern.

## Next Steps
Read the Microsoft GraphRAG paper (Edge et al., 2024). Study the open-source implementation at github.com/microsoft/graphrag. Take ft_plus_rag to learn when fine-tuning complements graph-based retrieval.
