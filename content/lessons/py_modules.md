---
id: py_modules
title: Modules, pip & Virtual Envs
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: python
prerequisites: [py_file_io, install_setup]
tags: [python, modules, pip, venv]
---

## Concept Introduction

Real projects are never a single file. Modules let you split code across files.
pip installs third-party packages. Virtual environments isolate dependencies
per project so two apps can use different versions of the same library. By the
end of this lesson you'll structure multi-file projects, manage dependencies,
and never again break a project with a global pip install.

## How It Works

A module is any `.py` file. A package is a directory containing `__init__.py`.
When you `import rag_pipeline`, Python searches `sys.path` for a file or
directory matching that name, executes it once, and caches the result in
`sys.modules`. Subsequent imports are free.

pip fetches packages from PyPI (Python Package Index), resolves dependencies,
and installs them into your Python environment. `pip freeze` snapshots the
current environment; `pip install -r requirements.txt` reproduces it.

Virtual environments create isolated Python installations. `python -m venv
.venv` creates a local copy of the Python interpreter with its own
`site-packages` directory. Activate it, and pip installs go there instead of
the global Python. Never install project dependencies globally.

## Code Examples

Project structure with modules:

```
rag_app/
├── __init__.py
├── retriever.py       # def search(query, top_k): ...
├── generator.py       # def generate(context, question): ...
├── pipeline.py        # from .retriever import search; from .generator import generate
└── main.py            # from rag_app.pipeline import run_rag
```

Using modules:

```python
# main.py
from rag_app.pipeline import run_rag

result = run_rag("What is RAG?")
print(result)
```

Virtual environment workflow:

```bash
python -m venv .venv              # Create
source .venv/bin/activate         # Activate (Linux/Mac)
# .venv\Scripts\activate          # Activate (Windows)

pip install chromadb langchain    # Install into .venv
pip freeze > requirements.txt     # Lock dependencies

deactivate                        # Exit venv
```

## Try It Yourself

Create a mini RAG package. Structure it as `mini_rag/` with modules
`embedder.py`, `retriever.py`, and `main.py`. Each module imports from the
others. Create a virtual environment, install `sentence-transformers`, and
verify the package runs:

```python
# mini_rag/embedder.py
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
def embed(text): return model.encode(text)

# mini_rag/main.py
from mini_rag.embedder import embed
v = embed("test")
print(f"Embedding shape: {v.shape}")
```

## Real-World RAG Connection

Every production RAG project uses virtual environments. When your RAG API
needs LangChain v0.3 and your evaluation scripts need v0.2, they live in
separate venvs. When you deploy to Render or Railway, the platform reads your
`requirements.txt` to rebuild your environment.

## Common Pitfalls

- **Pitfall:** Installing everything globally (`pip install` without venv).
  Two projects need different versions of the same library → they break each
  other. **Fix:** Always create a venv before `pip install`.
- **Pitfall:** Circular imports — `a.py` imports from `b.py` which imports
  from `a.py`. **Fix:** Move shared code to a third module, or import inside
  the function instead of at module level.
- **Pitfall:** Committing `.venv/` to git — huge directory full of binaries.
  **Fix:** Add `.venv/` to `.gitignore`.

## Next Steps

- **Practice:** Create a `rag_project/` with 3 modules, a venv, and a
  `requirements.txt`. Activate the venv, install chromadb, and run.
- **Read:** [Python Packaging User Guide](https://packaging.python.org/tutorials/installing-packages/)
- **Related:** [py_oop](/lesson/py_oop) — modules become classes for larger
  projects
