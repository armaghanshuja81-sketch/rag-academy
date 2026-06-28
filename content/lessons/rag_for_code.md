---
id: rag_for_code
title: RAG for Code
tier: expert
difficulty: expert
estimated_minutes: 30
module: production
prerequisites: [advanced_retrieval]
tags: [code-embeddings, codebert, unixcoder, ast-chunking, repo-retrieval, swe-bench]
---

## Concept Introduction
Code RAG retrieves and reasons over source code — not natural language documents about code. The retrieval primitives are different: chunking is not by paragraph but by AST node (function, class, method), embeddings must capture both natural language (docstrings, comments) and code semantics (control flow, type signatures, call graphs), and queries mix natural language intent ("find where authentication logic checks the JWT expiry") with code fragments. The frontier is repo-level retrieval that understands cross-file dependencies, making RAG viable for SWE-bench tasks where an agent must locate and edit the right code across thousands of files.

## How It Works
**Code embeddings** are specialized models trained on (natural language, code) pairs. CodeBERT (Microsoft) uses a BERT architecture pre-trained on CodeSearchNet — 2.1M (docstring, function) pairs across 6 languages. UniXCoder (Guo et al., 2022) uses a unified cross-modal architecture with multi-modal contrastive learning and cross-modal generation, achieving stronger performance on code search. For production, these models map code into an embedding space where "def authenticate(token): ..." is near "JWT token validation function" even if those words never appear in the code.

**AST-aware chunking** parses source code into abstract syntax trees and chunks at semantic boundaries: functions, classes, methods, and sometimes logical blocks within functions (e.g., a complex conditional chain). The chunk preserves metadata: function signature, parent class, imports, and calls-to/called-by relationships. This is qualitatively different from text chunking — a 200-line function is one chunk even if it exceeds a token limit, because splitting mid-function destroys semantics. For very large functions (> 2K tokens), sub-function chunking extracts logical blocks using control flow boundaries.

**Repo-level retrieval** is the killer feature that distinguishes code RAG from document RAG. A codebase is a graph of cross-file dependencies: imports, function calls, class inheritance, type references. Retrieval traverses this graph: start from a candidate function found via embedding similarity, follow its callers and callees to gather context, include the interface/type definitions of referenced types. The retrieved context for a query about authentication might include: the `authenticate()` function, the `JWTService` class it calls, the `User` model it references, and the `@auth_required` decorator that wraps it.

**Code + natural language search** combines embedding similarity with lexical matching (BM25 over code tokens) and graph traversal in a fusion pipeline. A query like "rate limiting middleware for FastAPI" searches both docstrings ("rate limiting") and code structures ("middleware", FastAPI decorator patterns). Fusion ranking weights: 0.4 embedding score + 0.3 BM25 score + 0.3 graph relevance (distance from known entry points).

**SWE-bench** is the benchmark that drives the field. It contains 2,294 real GitHub issues with corresponding pull requests. A code RAG system must: (a) locate the files and functions that need to change (retrieval), (b) understand the intended behavior from the issue description (NL understanding), (c) generate a patch that fixes the bug or adds the feature (generation). State-of-the-art systems (Devin, SWE-Agent, Claude Code) achieve 30-50% resolution rates on the full SWE-bench test set.

## Code Examples

```python
import ast
import textwrap
from dataclasses import dataclass, field

@dataclass
class CodeChunk:
    file_path: str
    name: str
    chunk_type: str  # function, class, method, module
    code: str
    docstring: str
    signature: str
    start_line: int
    end_line: int
    imports: list[str] = field(default_factory=list)
    calls: list[str] = field(default_factory=list)
    called_by: list[str] = field(default_factory=list)

class ASTChunker:
    """AST-aware code chunking that preserves semantic boundaries."""

    def chunk_file(self, file_path: str, source: str) -> list[CodeChunk]:
        tree = ast.parse(source)
        chunks = []
        # Module-level docstring
        module_doc = ast.get_docstring(tree) or ""
        # Extract imports
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend(a.name for a in node.names)
            elif isinstance(node, ast.ImportFrom):
                imports.append(f"{node.module}.{node.names[0].name}")

        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.FunctionDef):
                chunks.append(self._chunk_function(node, source, file_path, imports))
            elif isinstance(node, ast.ClassDef):
                chunks.append(self._chunk_class(node, source, file_path, imports))
        return chunks

    def _chunk_function(self, node: ast.FunctionDef, source: str,
                        file_path: str, imports: list[str]) -> CodeChunk:
        code = ast.get_source_segment(source, node) or ""
        docstring = ast.get_docstring(node) or ""
        args = [a.arg for a in node.args.args]
        signature = f"def {node.name}({', '.join(args)})"
        calls = self._extract_calls(node)
        return CodeChunk(
            file_path=file_path, name=node.name, chunk_type="function",
            code=code, docstring=docstring, signature=signature,
            start_line=node.lineno, end_line=node.end_lineno,
            imports=imports, calls=calls
        )

    def _chunk_class(self, node: ast.ClassDef, source: str,
                     file_path: str, imports: list[str]) -> CodeChunk:
        code = ast.get_source_segment(source, node) or ""
        docstring = ast.get_docstring(node) or ""
        bases = [ast.unparse(b) for b in node.bases]
        signature = f"class {node.name}({', '.join(bases)})"
        return CodeChunk(
            file_path=file_path, name=node.name, chunk_type="class",
            code=code, docstring=docstring, signature=signature,
            start_line=node.lineno, end_line=node.end_lineno,
            imports=imports
        )

    @staticmethod
    def _extract_calls(node: ast.AST) -> list[str]:
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    calls.append(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    calls.append(ast.unparse(child.func))
        return list(set(calls))

def build_call_graph(chunks: list[CodeChunk]) -> dict[str, set[str]]:
    """Build a call graph from all chunks in a repository."""
    graph = {chunk.name: set(chunk.calls) for chunk in chunks}
    # Populate called_by (reverse edges)
    called_by = {chunk.name: set() for chunk in chunks}
    for caller, callees in graph.items():
        for callee in callees:
            if callee in called_by:
                called_by[callee].add(caller)
    # Attach called_by to chunks
    for chunk in chunks:
        chunk.called_by = list(called_by.get(chunk.name, set()))
    return graph

def repo_retrieve(query: str, chunks: list[CodeChunk],
                  embedding_model, call_graph: dict[str, set[str]],
                  top_k: int = 5, hop_depth: int = 1) -> list[dict]:
    """Repo-level retrieval: embeddings + call graph traversal."""
    import numpy as np
    # Dense retrieval
    texts = [f"{c.signature}\n{c.docstring}" for c in chunks]
    query_emb = embedding_model(query)
    chunk_embs = np.array([embedding_model(t) for t in texts])
    scores = np.dot(chunk_embs, query_emb.T).flatten()
    top_indices = np.argsort(scores)[-top_k * 2:][::-1]
    # Graph expansion
    retrieved = []
    seen = set()
    for idx in top_indices:
        for hop in range(hop_depth + 1):
            if idx in seen:
                continue
            seen.add(idx)
            chunk = chunks[idx]
            retrieved.append({"chunk": chunk, "score": float(scores[idx]), "hop": hop})
            # Follow callers and callees
            neighbors = set(chunk.calls + chunk.called_by)
            for neighbor_name in neighbors:
                for n_idx, n_chunk in enumerate(chunks):
                    if n_chunk.name == neighbor_name and n_idx not in seen:
                        idx = n_idx  # expand from this node in the next iteration
                        break
    return sorted(retrieved, key=lambda x: x["score"], reverse=True)[:top_k]
```

## Try It Yourself
Clone an open-source repository (~500+ files, e.g., FastAPI, Django REST Framework, or LangChain). Build the full code RAG pipeline: (a) AST-aware chunking with imports and call graph extraction, (b) dense retrieval using CodeBERT or UniXCoder embeddings, (c) BM25 lexical retrieval over code tokens, (d) fusion ranking combining dense + lexical + graph proximity scores, (e) LLM-based answer generation using retrieved code context. Evaluate on 20 real GitHub issues from the repo (the "locate" step — find the files/functions that need to change). Measure: file-level recall@5, function-level recall@5, and compare dense-only vs fusion retrieval.

## Real-World RAG Connection
Code RAG powers GitHub Copilot's codebase awareness, Sourcegraph Cody's repository search, and SWE-agent's automated bug fixing. Microsoft's CodeBERT and UniXCoder are the standard embedding models. The SWE-bench benchmark is the measuring stick, with top systems (Factory, CodeStory Aide, Devin) approaching 50% resolution rate on the full test set. The open problem is cross-repository retrieval — finding relevant code across thousands of repositories — which requires repository-level embeddings and scalable dependency graph traversal.

## Common Pitfalls
**Pitfall:** AST chunking treats entire large functions as single chunks, producing 3,000-token chunks that blow past embedding model context limits. **Fix:** For functions exceeding 1K tokens, apply intra-function chunking: split at top-level control flow boundaries (if/for/while blocks) and treat each block as a sub-chunk. Include the function signature and docstring as a prefix to each sub-chunk so it remains independently meaningful.

**Pitfall:** The call graph is built statically from AST analysis but misses dynamic call patterns — Python's `getattr()` calls, dependency injection, and factory patterns create edges invisible to AST parsing. **Fix:** Augment the static call graph with runtime traces. Run the test suite with a tracer, record actual function calls, and merge the dynamic call graph with the static one. This catches 80% of dynamically dispatched calls.

**Pitfall:** Code embeddings trained on English-centric docstrings perform poorly on codebases where comments and documentation are in other languages (Japanese, Chinese, Russian). **Fix:** Use a multilingual code embedding model (UniXCoder supports 6 languages) or translate non-English docstrings to English at indexing time using an LLM. The translation cost is one-time and significantly improves retrieval quality for English queries.

**Pitfall:** BM25 over code tokens over-indexes on common programming keywords (`def`, `return`, `import`, `class`) that appear in every file, diluting the signal from semantically meaningful tokens. **Fix:** Apply a programming-language-specific stopword list that filters language keywords. Use TF-IDF weighting that down-weights tokens appearing in more than 60% of files. Tokenize by camelCase and snake_case splitting so `authenticateUser` becomes `["authenticate", "user"]` and matches "user authentication" queries.

## Next Steps
Read the CodeBERT paper (Feng et al., 2020) and UniXCoder paper (Guo et al., 2022). Study the SWE-bench leaderboard and the SWE-agent architecture. Explore using RAG for code review, automated refactoring, and test generation.
