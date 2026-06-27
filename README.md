---
title: RAG Academy
emoji: 🎓
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 5000
---

# 🎓 RAG Academy

Complete learning platform that takes you from **absolute beginner** to **professional RAG developer**.

## 📚 What's Inside

| Tier | Modules | Lessons |
|------|---------|---------|
| 🟢 Junior | Setup, Python, Web, Flask, SQL, Git | ~25 |
| 🔵 Mid | LLMs, Embeddings, RAG Basics, Vector DBs, LangChain, Evaluation | ~25 |
| 🟣 Senior | Advanced Retrieval, Production RAG, Security, Enterprise RAG | ~18 |
| 🔴 Expert | Agentic RAG, Multi-Modal, GraphRAG, Advanced Topics | ~18 |
| ⭐ Bonus | Career, Specialized Deployments | ~8 |

**Total: 108 lessons across 5 tiers**

## 🚀 Run Locally

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 22+** with npm

### 1. Backend (Flask API)

```bash
# Install Python dependencies
pip install flask

# Start the Flask server
python app.py
# Runs on http://localhost:5000
```

### 2. Frontend (Vite + React)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# Runs on http://localhost:5173
```

The Vite dev server proxies `/api` and `/static` requests to Flask on port 5000. Open **http://localhost:5173** for the full SPA experience.

### Production Build

```bash
cd frontend
npm run build     # outputs to frontend/dist/
npm run preview   # preview the production build
```

## 🌐 Live Demo

Access the live app here: *(your HF Space URL will appear here)*

## 🔧 Features

- 📖 **108 interactive lessons** with code examples across 5 tiers (Junior → Expert)
- 🐍 **Python Playground** - write and run Python in your browser
- 🗄️ **Database Viewer** - explore the SQLite database, run SQL queries
- 🤖 **Working RAG Demo** - ask questions about documents with live retrieval
- 🔄 **Data Flow Visualizer** - animated diagram of browser → server → database flow
- 🧠 **MCQ Quizzes** after every lesson — auto-completion when you pass
- 📺 **Resources page** with YouTube channels, free courses, and tutorials
- ✅ **Progress tracking** — completed lessons save to SQLite
- 🎨 **Claymorphism UI** — soft shadows, rounded corners, card-based layout
- 🌙 **Dark mode** — persisted to localStorage, toggle in navbar
