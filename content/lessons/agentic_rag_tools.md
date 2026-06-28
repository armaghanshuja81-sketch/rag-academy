---
id: agentic_rag_tools
title: Agentic RAG Tool Use
tier: expert
difficulty: expert
estimated_minutes: 30
module: agentic-rag
prerequisites: [agentic_rag_intro]
tags: [tools, tool-design, vector-search, code-interpreter, error-handling]
---

## Concept Introduction
Tools are the agent's hands. A well-designed tool suite determines whether an agentic RAG system succeeds or collapses into hallucination. Tool design for RAG agents goes beyond simple API wrappers — it requires careful input schema design, output formatting that the LLM can reason over, and composition patterns that let tools chain predictably. The difference between a toy agent and a production system lives in tool ergonomics.

## How It Works
Each tool is a typed function with a JSON Schema description the LLM reads to decide when and how to invoke it. The schema must communicate not just parameter types but semantic intent: a vector search tool should describe that it finds semantically similar content, not that it accepts a string and returns a list.

**Vector search tool** — Wraps an embedding model and vector database. The input schema should accept query string, top_k, filter metadata, and optionally a retrieval method (dense, sparse, hybrid). Output should include document content, metadata, and relevance scores.

**SQL tool** — Accepts a natural language question and a table schema description. Internally generates SQL via a lightweight LLM, executes against a read-replica, and returns rows + column names. Critical: this tool must be read-only and run with a query timeout and row limit.

**Web search tool** — Queries a search API, fetches top-N result pages, extracts clean text, and returns structured snippets with source URLs. Requires HTML-to-text extraction and a token budget per result to avoid context pollution.

**Code interpreter** — Sandboxed Python execution environment. Accepts code string, returns stdout/stderr and any generated plots as base64. Essential for computing statistics on retrieved numerical data that the LLM should not attempt to calculate in its head.

**Tool composition** is the practice of designing tools that accept output from other tools. For example, the vector search tool returns document IDs that a "get full document" tool can expand. The SQL tool returns table names that a "describe table" tool can inspect. This creates a composable tool graph the agent can navigate.

Error handling in tool calls follows a structured pattern: every tool returns `{success: bool, data: Any, error: str | None, retry_hint: str | None}`. The agent can use retry_hint to adjust its next attempt.

## Code Examples

```python
import json
from typing import Any
from dataclasses import dataclass, field

@dataclass
class ToolResult:
    success: bool
    data: Any
    error: str | None = None
    retry_hint: str | None = None

def tool(func):
    """Decorator that wraps any function as a tool with structured output."""
    func._tool_name = func.__name__
    func._tool_schema = {
        "name": func.__name__,
        "description": func.__doc__ or "",
        "parameters": getattr(func, "_parameters", {})
    }
    return func

def _p(name: str, desc: str, type_str: str = "string", required: bool = True):
    """Builder for a parameter entry in a tool schema."""
    return {"name": name, "description": desc, "type": type_str, "required": required}

def tool_params(*params):
    """Decorator: attach parameter schema to a tool function."""
    def decorator(func):
        func._parameters = {
            "type": "object",
            "properties": {p["name"]: {"type": p["type"], "description": p["description"]} for p in params},
            "required": [p["name"] for p in params if p.get("required", True)]
        }
        return func
    return decorator

@tool
@tool_params(
    _p("query", "Natural language search query"),
    _p("top_k", "Number of results to return", "integer"),
    _p("filters", "Metadata filter as JSON key-value pairs", "object", required=False)
)
def vector_search(query: str, top_k: int = 5, filters: dict | None = None) -> ToolResult:
    """Search the vector database for semantically similar chunks."""
    try:
        # embedding + ANN lookup would go here
        results = [{"content": f"Doc {i} about {query}", "score": 0.95 - i*0.05} for i in range(top_k)]
        return ToolResult(success=True, data=results)
    except Exception as e:
        return ToolResult(
            success=False, error=str(e),
            retry_hint="Try broadening your query or reducing filter constraints."
        )

@tool
@tool_params(
    _p("code", "Python code string to execute"),
    _p("timeout_ms", "Execution timeout in milliseconds", "integer", required=False)
)
def code_interpreter(code: str, timeout_ms: int = 5000) -> ToolResult:
    """Execute Python code in a sandbox and return stdout/stderr."""
    import subprocess, tempfile, os
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(code)
        tmp = f.name
    try:
        result = subprocess.run(
            ["python", tmp], capture_output=True, text=True, timeout=timeout_ms/1000
        )
        return ToolResult(success=result.returncode == 0,
                          data={"stdout": result.stdout, "stderr": result.stderr})
    except subprocess.TimeoutExpired:
        return ToolResult(success=False, error="Execution timed out",
                          retry_hint="Optimize your code or increase timeout_ms.")
    finally:
        os.unlink(tmp)

# Tool registry for agent dispatch
registry = {t._tool_name: t for t in [vector_search, code_interpreter]}
```

## Try It Yourself
Design and implement an "aggregate" tool that accepts results from multiple prior tool calls and produces a merged, deduplicated, and ranked final result set. The tool must handle conflicting information between sources by returning a confidence-weighted consensus. Then build an agent that uses vector search, web search, and your aggregate tool to answer "What are the three leading theories about [current scientific controversy]? Rank them by evidence strength." The agent must call aggregate before producing its final answer.

## Real-World RAG Connection
Anthropic's tool-use API with 256+ tool definitions pushes the boundary of how many tools an agent can reason over. OpenAI's structured outputs guarantee tool input adherence. In production systems like Perplexity, the tool orchestration layer is the core IP — the retrieval quality depends less on the underlying search engine and more on how well the agent selects, chains, and validates tool calls.

## Common Pitfalls
**Pitfall:** Tool description drift — the tool implementation changes but the schema description stays stale, causing the LLM to call it with wrong assumptions. **Fix:** Generate tool descriptions from code at build time using introspection and enforce that schema tests run in CI.

**Pitfall:** A tool returns 50KB of text but the agent only needs 3 values. The context window fills with noise. **Fix:** Design every tool to accept a `fields` parameter that subsets the output. The agent learns to request only the fields it needs for the current reasoning step.

**Pitfall:** Two tools have overlapping capabilities (e.g., both can "find documents about X") and the agent oscillates between them without making progress. **Fix:** Define clear capability boundaries. If tools overlap, add a "preference" hint to one tool's description and include a `suggested_tool` field in error responses that guides the agent to the better option.

## Next Steps
Read the Anthropic tool-use documentation. Study how LangChain's StructuredTool class validates inputs. Take agentic_rag_multi to scale tool use across multiple agents.
