---
id: graphrag_neo4j
title: GraphRAG Neo4j and Cypher
tier: expert
difficulty: expert
estimated_minutes: 30
module: graph-rag
prerequisites: [graphrag_concepts]
tags: [neo4j, cypher, graph-construction, hybrid-retrieval, vector-graph]
---

## Concept Introduction
Neo4j is the production-grade knowledge graph database for RAG systems that have outgrown in-memory NetworkX graphs. Its Cypher query language enables declarative graph traversal — pattern matching, path finding, and community detection expressed in SQL-like syntax over graph structures. The killer feature for RAG is hybrid retrieval: combining Cypher graph traversal with native vector search in a single query, giving you the reasoning depth of graph traversal and the fuzziness of semantic search in one database round-trip.

## How It Works
**Neo4j setup** for RAG requires the APOC plugin (graph algorithms) and the vector search plugin (ANN index). The minimal Docker setup runs a single-node instance; production uses causal clustering for read scalability. The key configuration decisions: heap size (50-80% of available RAM), page cache size (as large as possible), and index creation strategy (which properties to index for node lookup).

**Cypher query language** for RAG retrieval uses MATCH patterns to express graph traversals. `MATCH (d:Drug)-[:INHIBITS]->(e:Enzyme)-[:METABOLIZES]->(d2:Drug) RETURN d.name, d2.name` finds drug-drug interactions mediated by enzyme pathways. The WHERE clause filters on node/edge properties; WITH chains intermediate results; OPTIONAL MATCH handles missing edges gracefully.

**Vector indexes in Neo4j** store embedding vectors on nodes. Create with `CREATE VECTOR INDEX node_embeddings FOR (n:Document) ON (n.embedding)`. Query with `CALL db.index.vector.queryNodes('node_embeddings', 5, $query_embedding)`. This enables semantic entry into the graph: find the top-K semantically relevant nodes, then traverse their graph neighborhood.

**Hybrid vector+graph retrieval** pipeline: (1) embed the user query, (2) vector search to find seed nodes, (3) Cypher traversal to expand context, (4) rank results by combined vector similarity and graph centrality. The unified query pattern:

```
MATCH (seed:Document)
CALL db.index.vector.queryNodes('doc_embeddings', 5, $query_vec) YIELD node AS seed
MATCH (seed)-[:CONTAINS]->(e:Entity)-[r:RELATES_TO]-(other:Entity)
RETURN seed.id, e.name, r.type, other.name, seed.score
```

**Graph construction from documents** in Neo4j uses the UNWIND pattern to batch-insert extracted triples. Each batch: (a) MERGE entities (create if not exists), (b) CREATE relationships, (c) SET embedding properties for vector-indexed nodes. Transaction sizing matters — 5K-10K operations per transaction balances throughput against memory.

## Code Examples

```python
from neo4j import GraphDatabase
import numpy as np

class Neo4jGraphRAG:
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def setup_schema(self):
        """Create constraints and vector index for RAG."""
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT doc_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE")
            session.run("CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE")
            # Vector index requires Neo4j 5.15+ with vector plugin
            session.run("""
                CREATE VECTOR INDEX doc_embeddings IF NOT EXISTS
                FOR (d:Document) ON (d.embedding)
                OPTIONS {indexConfig: {
                    `vector.dimensions`: 1536,
                    `vector.similarity_function`: 'cosine'
                }}
            """)

    def insert_document(self, doc_id: str, text: str, embedding: list[float]):
        """Insert a document node with its embedding vector."""
        with self.driver.session() as session:
            session.run("""
                MERGE (d:Document {id: $id})
                SET d.text = $text, d.embedding = $embedding
            """, id=doc_id, text=text, embedding=embedding)

    def insert_triples_batch(self, triples: list[dict]):
        """Batch insert entity-relationship triples into the graph."""
        with self.driver.session() as session:
            session.run("""
                UNWIND $triples AS triple
                MERGE (s:Entity {name: triple.subject})
                MERGE (o:Entity {name: triple.object})
                CREATE (s)-[r:RELATES {type: triple.relationship,
                                       source: triple.source_doc}]->(o)
            """, triples=triples)

    def hybrid_retrieve(self, query_embedding: list[float],
                        seed_k: int = 5, traverse_hops: int = 2) -> list[dict]:
        """Vector search for seed docs, then graph traversal for context."""
        with self.driver.session() as session:
            result = session.run("""
                CALL db.index.vector.queryNodes('doc_embeddings', $k, $query_vec)
                YIELD node AS seed, score
                MATCH (seed)-[:CONTAINS]->(e:Entity)-[r:RELATES*1..$hops]-(other:Entity)
                RETURN seed.id AS doc_id, seed.score AS vector_score,
                       e.name AS entity, [rel IN r | rel.type] AS path,
                       other.name AS connected_entity
                LIMIT 50
            """, k=seed_k, query_vec=query_embedding, hops=traverse_hops)
            return [record.data() for record in result]

    def pagerank_entities(self, limit: int = 20) -> list[dict]:
        """Run PageRank to identify the most central entities in the graph."""
        with self.driver.session() as session:
            result = session.run("""
                CALL gds.pageRank.stream('entity-graph')
                YIELD nodeId, score
                MATCH (e:Entity) WHERE id(e) = nodeId
                RETURN e.name AS entity, score
                ORDER BY score DESC
                LIMIT $limit
            """, limit=limit)
            return [r.data() for r in result]

    def community_detect(self) -> list[dict]:
        """Leiden community detection for topic discovery."""
        with self.driver.session() as session:
            result = session.run("""
                CALL gds.leiden.stream('entity-graph', {randomSeed: 42})
                YIELD nodeId, communityId
                MATCH (e:Entity) WHERE id(e) = nodeId
                RETURN communityId, collect(e.name)[0..5] AS sample_entities
                ORDER BY communityId
            """)
            return [r.data() for r in result]
```

## Try It Yourself
Set up Neo4j via Docker, build a knowledge graph from 200 Wikipedia articles on a topic (e.g., climate change, AI safety, or genomics). Implement: (a) vector index on document embeddings, (b) Cypher traversal queries for 2-hop and 3-hop paths, (c) hybrid retrieval that combines vector search with traversal, (d) PageRank to identify central entities, (e) Leiden community detection to surface thematic clusters. Build a QA system and compare hybrid retrieval against pure vector search on 15 multi-hop questions.

## Real-World RAG Connection
Neo4j's graph data science library powers knowledge graph analytics at NASA's Lessons Learned database and the ECDC's disease surveillance system. LangChain and LlamaIndex both provide Neo4j integration for RAG. The hybrid vector+graph approach is gaining traction in legal document review (entity-relationship extraction from contracts) and biomedical literature mining (pathway discovery across PubMed).

## Common Pitfalls
**Pitfall:** Cypher queries with unbounded path lengths (`*..` or `*1..5`) cause exponential traversal, bringing the database to a halt on dense graphs. **Fix:** Always set a path length upper bound (max 3 hops). Use `WITH` to limit intermediate results before expanding the next hop. Add a `LIMIT` to every traversal query.

**Pitfall:** MERGE on entity names creates duplicate nodes when the same entity appears with different casing or whitespace ("IL-6" vs "il-6" vs "IL6"). **Fix:** Normalize entity names to lowercase-trimmed before MERGE. Use the `apoc.text.clean` function in Cypher or pre-normalize in Python before insertion.

**Pitfall:** Vector and graph retrieval produce disjoint result sets that are hard to merge into a single ranked list. **Fix:** Use a unified scoring formula: `final_score = alpha * normalized_vector_score + (1 - alpha) * normalized_pagerank`. Tune alpha on a validation set. Consider a learning-to-rank layer that takes both scores and produces a merged ranking.

## Next Steps
Read the Neo4j Graph Data Science documentation. Study the Neo4j + LangChain integration examples. Take graphrag_build to implement the full Microsoft GraphRAG pipeline.
