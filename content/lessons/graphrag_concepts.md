---
id: graphrag_concepts
title: GraphRAG Concepts
tier: expert
difficulty: expert
estimated_minutes: 30
module: graph-rag
prerequisites: [advanced_retrieval]
tags: [knowledge-graph, entity-extraction, relationship-extraction, graph-vs-vector]
---

## Concept Introduction
GraphRAG replaces flat document chunks with a structured knowledge graph — entities as nodes, relationships as edges — and retrieves by traversing connections rather than measuring vector similarity. This fundamentally changes what questions the system can answer. "What drug interacts with the enzyme that metabolizes the active ingredient in Drug X?" requires following a chain of relationships (Drug X → ingredient → metabolizing enzyme → interacting drugs) that a vector search over document paragraphs cannot reconstruct because the connection is distributed across documents.

## How It Works
**Knowledge graph construction** from text is the core extraction problem. An LLM reads each document chunk and produces structured triples: `(subject_entity, relationship, object_entity)`. For pharmaceutical text: `("Aspirin", "INHIBITS", "COX-1 enzyme")`, `("COX-1 enzyme", "PRODUCES", "Thromboxane A2")`. Extraction quality determines retrieval quality — a missing entity or wrong relationship breaks the traversal chain.

**Entity extraction** identifies the nouns that represent real-world objects: people, organizations, drugs, genes, legal cases, products. Entity resolution (linking "Aspirin" and "acetylsalicylic acid" and "ASA" to the same node) is the hardest sub-problem. Without resolution, the graph fragments and traversal paths break at synonym boundaries.

**Relationship extraction** identifies the verbs connecting entities. The relationship ontology matters — using 500 fine-grained relationship types gives more precise traversal than 10 generic types, but extraction reliability drops with type count. The sweet spot for most domains is 30-80 relationship types with an "OTHER" fallback.

**When graph structure beats flat chunks:** GraphRAG wins on multi-hop questions where the answer depends on a chain of relationships spanning multiple documents. It also wins on summarization-style questions ("what are the main themes across this corpus?") because community detection in the graph surfaces emergent topics invisible to individual chunks. Vector search wins on single-hop factual lookup and when the query is a natural language passage that semantically matches a document passage.

**Graph + vector hybrid** is the production answer. Use vector search for candidate generation (find entry points into the graph), then traverse the graph from those entry points to gather related context. This gives you the recall of vector search with the precision and reasoning depth of graph traversal.

## Code Examples

```python
import json
from typing import TypedDict
import networkx as nx

class Triple(TypedDict):
    subject: str
    relationship: str
    object: str
    source_doc: str

def extract_triples(chunk: str, llm) -> list[Triple]:
    """Extract subject-relation-object triples from a text chunk."""
    prompt = f"""Extract knowledge graph triples from this text.
    Return JSON array of {{"subject": "...", "relationship": "...", "object": "..."}}.
    Use entity types: DRUG, GENE, DISEASE, ENZYME, PATHWAY, PROTEIN.
    Use relationship types: INHIBITS, ACTIVATES, METABOLIZES, TREATS, CAUSES, INTERACTS_WITH.

    Text: {chunk}"""
    response = llm(prompt)
    return json.loads(response)

def build_graph(triples: list[Triple]) -> nx.DiGraph:
    """Construct a directed graph from extracted triples."""
    G = nx.DiGraph()
    for t in triples:
        G.add_node(t["subject"], type="entity")
        G.add_node(t["object"], type="entity")
        G.add_edge(t["subject"], t["object"],
                   relationship=t["relationship"],
                   source=t.get("source_doc", ""))
    return G

def entity_resolution(G: nx.DiGraph, synonym_map: dict[str, str]) -> nx.DiGraph:
    """Merge synonymous nodes using a provided mapping."""
    for variant, canonical in synonym_map.items():
        if variant in G and canonical in G:
            G = nx.contracted_nodes(G, canonical, variant, self_loops=False)
    return G

def graph_traverse(G: nx.DiGraph, start_entity: str,
                   relationship_path: list[str], max_depth: int = 3) -> list:
    """Follow a path of relationships from a starting entity."""
    results = []
    current_nodes = [start_entity]
    for rel in relationship_path[:max_depth]:
        next_nodes = []
        for node in current_nodes:
            for _, neighbor, edge_data in G.out_edges(node, data=True):
                if edge_data["relationship"] == rel:
                    next_nodes.append(neighbor)
                    results.append({"from": node, "relationship": rel, "to": neighbor})
        current_nodes = next_nodes
        if not current_nodes:
            break
    return results

def hybrid_retrieve(query: str, vector_index, G: nx.DiGraph,
                    top_k: int = 5, hop_depth: int = 2) -> list:
    """Vector search for entry points, then graph traverse for context."""
    candidates = vector_index.search(query, top_k)
    entities_found = set()
    # Entity linking: extract entity mentions from candidates, link to graph nodes
    for doc in candidates:
        for node in G.nodes():
            if node.lower() in doc["content"].lower():
                entities_found.add(node)
    # Traverse from each found entity
    context = []
    for entity in entities_found:
        neighbors = list(G.neighbors(entity))
        for neighbor in neighbors:
            edge = G.edges[entity, neighbor]
            context.append(f"{entity} {edge['relationship']} {neighbor}")
    return context
```

## Try It Yourself
Take a dataset of 100 PubMed abstracts about a disease pathway. Build a knowledge graph: (a) extract triples from each abstract, (b) perform entity resolution to merge synonyms, (c) construct the graph in NetworkX. Implement two QA systems: vector-only RAG and graph-traversal RAG. Test on 20 multi-hop questions (e.g., "Which drugs inhibit proteins downstream of the mTOR pathway?"). Measure: accuracy, average number of retrieved context pieces, and whether graph traversal finds answers that vector search misses.

## Real-World RAG Connection
GraphRAG is deployed in pharmaceutical research at companies like BenevolentAI, where drug-disease-gene graphs enable drug repurposing discovery. Neo4j powers operational knowledge graphs at NASA, eBay, and the ECDC. The frontier is automated graph construction from unstructured text at scale — current LLM-based extraction is accurate but too expensive for web-scale corpora, driving research into specialized extraction models that approximate LLM quality at a fraction of the cost.

## Common Pitfalls
**Pitfall:** The LLM extracts entity names inconsistently ("IL-6" vs "Interleukin-6" vs "IL6"), fragmenting the graph so traversal paths break at every synonym boundary. **Fix:** Run a second LLM pass specifically for entity resolution — feed all extracted entities to the model with instructions to group synonyms. Maintain a canonical entity registry updated with each new extraction batch.

**Pitfall:** The extraction model hallucinates relationships that sound plausible but are not in the source text, producing a graph that generates confident and wrong traversal paths. **Fix:** Store the source document span with every triple. During retrieval, validate that each traversal step is supported by its source. Flag paths where >50% of edges lack source verification.

**Pitfall:** Graph size explodes — extracting from 100K documents produces millions of nodes and edges, making traversal latency unacceptable. **Fix:** Prune low-degree nodes that are only connected to one other node. Merge leaf entities into their parent. Use community detection to partition the graph and pre-compute traversal tables for frequent query patterns.

## Next Steps
Read the original GraphRAG paper (Microsoft Research). Study the biomedical knowledge graph literature (PrimeKG, Hetionet). Take graphrag_neo4j to learn production graph infrastructure.
