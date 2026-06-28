---
id: career_portfolio
title: Building a RAG Portfolio Project
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: career
prerequisites: [rag_pipeline_full]
tags: [career, portfolio, project]
---

## Concept Introduction

Employers don't hire based on courses completed. They hire based on projects
built. A single well-documented RAG project on your GitHub is worth more than
every certificate combined. By the end of this lesson you'll have a project
plan, an architecture, and the first 50 lines of code for a portfolio-worthy
RAG application.

## How It Works

A portfolio project must demonstrate three things: you can build something
that works end-to-end, you understand the tradeoffs you made, and you can
explain both to an interviewer. The project doesn't need to be novel — it
needs to be complete, documented, and deployed.

Project ideas ordered by difficulty:
- **RAG Q&A over your own notes**: Load your markdown notes, chunk, embed with
  MiniLM, store in ChromaDB, query via a Flask API.
- **Company docs search**: Scrape a public documentation site, build a
  semantic search interface, deploy on Render or Railway.
- **RAG-powered chatbot with history**: Add conversation memory, multi-turn
  retrieval, and a Streamlit UI.
- **Multi-source RAG agent**: Combine SQL + vector search + web search into
  an agent that picks the right tool.

## Code Examples

Project scaffold — `app.py` skeleton for a Flask RAG API:

```python
"""RAG Knowledge Base API — Portfolio Project
Stack: Flask + ChromaDB + SentenceTransformers + OpenAI
"""
from flask import Flask, request, jsonify
import chromadb
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path="./chroma_data")
collection = client.get_or_create_collection("knowledge_base")

@app.route("/index", methods=["POST"])
def index_document():
    data = request.get_json()
    text = data["text"]
    doc_id = data.get("id", str(hash(text)))
    embedding = model.encode(text).tolist()
    collection.add(documents=[text], embeddings=[embedding], ids=[doc_id])
    return jsonify({"status": "indexed", "id": doc_id})

@app.route("/search", methods=["POST"])
def search():
    query = request.get_json()["query"]
    q_embedding = model.encode(query).tolist()
    results = collection.query(query_embeddings=[q_embedding], n_results=3)
    return jsonify({
        "results": results["documents"][0],
        "distances": results["distances"][0]
    })

if __name__ == "__main__":
    app.run(debug=True)
```

## Try It Yourself

Design your portfolio project. Answer these 5 questions in a `README.md`:
1. **What problem does it solve?** (1 sentence)
2. **What's the tech stack?** (list every library and why)
3. **What data does it use?** (source, size, format)
4. **What's the architecture?** (text description of the pipeline)
5. **What would you improve with more time?** (shows engineering maturity)

## Real-World RAG Connection

Every RAG engineering job posting asks for "experience building RAG
applications." A deployed, documented GitHub project IS that experience. The
project you build this week becomes the answer to "Tell me about a RAG system
you built" — the question asked in every AI engineering interview.

## Common Pitfalls

- **Pitfall:** Building something too ambitious and never finishing. A working
  RAG API with 10 documents is better than a half-built multi-agent system.
  **Fix:** Ship v1 in one day — the minimal thing that works end-to-end.
  Then iterate.
- **Pitfall:** No README or documentation. A repo without a README is
  invisible to recruiters. **Fix:** Write the README BEFORE you write the
  code. It clarifies your thinking and ensures you don't skip it.
- **Pitfall:** Not deploying. A local-only project doesn't demonstrate the
  skills employers care about (deployment, error handling, environment
  management). **Fix:** Deploy on Render, Railway, or Hugging Face Spaces
  — all have free tiers.

## Next Steps

- **Practice:** Build the Flask RAG API above. Add 5 of your own documents.
  Deploy it to Render (free). Share the URL in your GitHub README.
- **Read:** [Render Flask Deployment Guide](https://render.com/docs/deploy-flask)
- **Related:** [career_guide](/lesson/career_guide) — full career strategy
  from portfolio to job offer
