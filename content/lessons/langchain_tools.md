---
id: langchain_tools
title: LangChain Tools & Agents
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: langchain
prerequisites: [langchain_chains]
tags: [langchain, agents, tools]
---

## Concept Introduction

Chains follow a fixed path. Agents decide their own path. A LangChain agent
has access to tools — functions it can call — and an LLM that decides which
tool to use and when. By the end of this lesson you'll build a RAG agent that
can search a vector store, run SQL queries, and execute Python code based on
the user's question.

## How It Works

The agent loop: (1) user asks a question, (2) the LLM decides which tool
would help, (3) the tool runs and returns output, (4) the LLM evaluates the
output and either calls another tool or gives a final answer. This repeats
until the LLM decides it has enough information.

Tools are functions wrapped with a name, description, and JSON schema for
arguments. The LLM uses the descriptions to decide which tool fits the current
task — this is function calling (tool use). The description is everything:
if it's vague, the LLM picks the wrong tool.

Agent types trade off reliability vs flexibility:
- **Tool-calling agents**: The LLM outputs a function call (structured, reliable)
- **ReAct agents**: The LLM alternates reasoning ("Thought:") and action
  ("Action:") steps (more transparent, more verbose)
- **Plan-and-execute**: The LLM makes a plan first, then executes each step
  (good for complex multi-step tasks)

## Code Examples

Define tools and create a simple agent:

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

@tool
def search_knowledge_base(query: str) -> str:
    """Search the internal knowledge base for documents matching the query."""
    # In production: call your vector store
    docs = {"rag": "RAG = Retrieval-Augmented Generation", "python": "Python 3.12"}
    for key, value in docs.items():
        if key in query.lower():
            return value
    return "No matching documents found."

@tool
def run_sql(query: str) -> str:
    """Run a SQL query against the analytics database."""
    if "COUNT" in query.upper():
        return "42 rows"
    return "Query executed successfully."

llm = ChatOpenAI(model="gpt-4o", temperature=0)
agent = create_react_agent(llm, [search_knowledge_base, run_sql])

result = agent.invoke({"messages": [{"role": "user", "content": "What is RAG? Also, how many records are in the database?"}]})
print(result["messages"][-1].content)
```

Custom tool that queries a vector store with specific parameters:

```python
@tool
def retrieve_chunks(query: str, top_k: int = 3) -> str:
    """Retrieve the top-k most relevant document chunks for a query."""
    # In production: use your actual retriever
    chunks = [f"Chunk {i}: Relevant information about {query}..." for i in range(top_k)]
    return "\n\n".join(chunks)
```

## Try It Yourself

Design an agent with 3 tools for a RAG troubleshooting assistant:
1. `check_index()` — reports how many documents are indexed
2. `search_logs(query_id)` — retrieves logs for a specific query
3. `compare_scores(query, model_a, model_b)` — compares relevance scores

Write the tool definitions (just the `@tool` decorators and function stubs).
The key is writing descriptions so the LLM selects the right tool:

```python
@tool
def check_index() -> str:
    """Report the number of indexed documents and last index timestamp."""
    return "Index: 1,523 documents | Last indexed: 2026-06-28 10:00 UTC"

@tool
def search_logs(query_id: str) -> str:
    """Retrieve the retrieval log for a specific query ID. Shows which chunks were retrieved and their scores."""
    return f"Query {query_id}: Retrieved 5 chunks, avg score 0.82"

@tool
def compare_scores(query: str, model_a: str, model_b: str) -> str:
    """Compare relevance scores between two embedding models for the same query."""
    return f"{model_a}: 0.89 | {model_b}: 0.76 | Winner: {model_a}"
```

## Real-World RAG Connection

Production RAG systems use agents to handle queries that span multiple data
sources. A user asks "What were Q3 sales and how do they compare to our RAG
pipeline latency?" — the agent queries the SQL database for sales figures and
the vector store for pipeline docs, then synthesizes an answer. Without
agents, you'd need separate UIs for each data source.

## Common Pitfalls

- **Pitfall:** Vague tool descriptions — the LLM can't distinguish between
  `search(query)` and `retrieve(query)`. **Fix:** Write descriptions a human
  would use to choose between them. Include when NOT to use each tool.
- **Pitfall:** Infinite agent loops — the LLM calls tools in circles without
  reaching an answer. **Fix:** Set `max_iterations` (default 10 in LangGraph)
  and monitor agent traces.
- **Pitfall:** Tool outputs too large for the context window — the agent
  retrieves 50 documents and the LLM has no room to reason. **Fix:** Return
  summaries from tools, not full documents. Let the agent request specifics.

## Next Steps

- **Practice:** Take any 2-tool agent you've built and add LangSmith tracing
  (`LANGCHAIN_TRACING_V2=true`). Watch the agent's decision process in the
  trace viewer.
- **Read:** [LangGraph Agents Documentation](https://langchain-ai.github.io/langgraph/)
- **Related:** [agentic_rag_intro](/lesson/agentic_rag_intro) — advanced agent
  patterns specialized for RAG use cases
