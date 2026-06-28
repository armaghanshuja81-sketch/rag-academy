---
id: agentic_rag_intro
title: Agentic RAG Concepts
tier: expert
difficulty: expert
estimated_minutes: 30
module: agentic-rag
prerequisites: [advanced_retrieval, llm_foundations]
tags: [agents, react, langgraph, orchestration, tool-calling]
---

## Concept Introduction
Agentic RAG replaces the linear retrieve-then-read pipeline with an autonomous agent that decides what to retrieve, when to retrieve it, and how to synthesize multiple retrieval passes into a coherent answer. The agent operates in a tool-calling loop, observing intermediate results and reflecting on whether it needs more information before committing to a final response. This architecture outperforms static RAG on multi-hop questions, comparative analyses, and any query requiring information not capturable in a single vector similarity pass.

## How It Works
The canonical pattern is ReAct (Reasoning + Acting), where the LLM alternates between generating a reasoning trace and invoking tools. Each cycle produces an observation (tool output) that feeds into the next reasoning step. The loop terminates when the model emits a final answer instead of another tool call.

In a RAG context, tools are retrieval primitives: vector search, keyword search, SQL query, web search, code interpreter. The agent picks the right tool for each retrieval sub-problem, chains tools when one result informs the next query, and validates retrieved content before using it.

LangGraph models this as a state graph with nodes for tool execution and LLM reasoning, plus a conditional edge that routes back to reasoning or exits to the answer node. CrewAI uses a role-based metaphor with delegated task execution. AutoGen favors conversational agent chat. The key architectural choice is control flow: graph-based (LangGraph) gives you deterministic routing with full observability; role-based (CrewAI) simplifies multi-agent coordination at the cost of predictability; chat-based (AutoGen) maximizes flexibility but complicates debugging.

The decision boundary for agentic RAG: if the user question requires more than two retrieval passes, involves comparison across sources, or demands computation on retrieved data, an agent loop outperforms a static pipeline. If the question is a straightforward factoid lookup, a single retrieval pass is faster and cheaper.

## Code Examples

```python
from langgraph.graph import StateGraph, END
from langchain.tools import tool
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    query: str
    messages: Annotated[list, operator.add]
    tool_results: list
    final_answer: str

@tool
def vector_search(question: str) -> str:
    """Search the vector store for relevant documents."""
    from openai import OpenAI
    import numpy as np
    client = OpenAI()
    resp = client.embeddings.create(model="text-embedding-3-small", input=question)
    query_vec = np.array(resp.data[0].embedding)
    # simulate retrieval
    results = [{"content": "...", "score": 0.92}]
    return str(results)

def should_continue(state: AgentState) -> str:
    last_msg = state["messages"][-1]
    if "FINAL ANSWER:" in last_msg:
        return "end"
    return "tools"

def call_model(state: AgentState) -> AgentState:
    # LLM decides: call a tool or produce final answer
    system = "You are a research agent. Use tools to gather info, then provide FINAL ANSWER:"
    # In production, this calls an LLM with tool definitions bound
    state["messages"].append("FINAL ANSWER: The retrieved data shows...")
    return state

builder = StateGraph(AgentState)
builder.add_node("agent", call_model)
builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph = builder.compile()
```

## Try It Yourself
Implement a ReAct agent that must answer "What is the revenue of the company that acquired Stripe's largest competitor in 2024?" The agent needs a web search tool, a company-info tool, and a financial data tool. Add a reflection step where the agent validates each retrieved fact against at least one other source before using it. Measure the number of tool calls required and compare against a static two-pass RAG pipeline on the same question.

## Real-World RAG Connection
LangChain's LangGraph library powers production agentic RAG at companies like Elastic and MongoDB. The CrewAI framework is used by financial services firms for multi-source research synthesis. Anthropic's tool-use API with extended thinking enables agentic retrieval patterns without an explicit framework. Open problems include hallucination during tool selection (picking the wrong tool), infinite loops when the agent never converges, and the latency-cost tradeoff of multiple LLM calls versus a single retrieval pass.

## Common Pitfalls
**Pitfall:** Agent enters a retrieval loop, calling vector_search repeatedly with slightly reworded queries that return the same documents. **Fix:** Implement a deduplication check that compares each new tool call against the history of previous calls. If the agent tries the same tool with semantically similar input (cosine similarity > 0.95), force it to either pick a different tool or produce a final answer.

**Pitfall:** Tool outputs overflow the context window, causing the agent to lose track of early retrieval results. **Fix:** Summarize each tool output to a fixed token budget (e.g., 512 tokens) before appending it to the message history. Use a lightweight model for summarization to keep latency low.

**Pitfall:** The agent "hallucinates" tool results by generating plausible but fabricated content instead of actually calling the tool. **Fix:** Always route tool calls through a verified execution layer, never accept model-generated text as a substitute for tool output. Log every tool invocation with input, output, and latency for debugging.

## Next Steps
Read the ReAct paper (Yao et al., 2022). Study the LangGraph agent tutorial. Take the agentic_rag_tools lesson to learn tool design patterns.
