---
id: agentic_rag_multi
title: Agentic RAG Multi-Agent Systems
tier: expert
difficulty: expert
estimated_minutes: 30
module: agentic-rag
prerequisites: [agentic_rag_intro, agentic_rag_tools]
tags: [multi-agent, supervisor, debate, hierarchical, shared-memory]
---

## Concept Introduction
Multi-agent RAG distributes retrieval and reasoning across specialized agents that coordinate to answer questions no single agent can handle alone. A retriever agent finds documents, a critic agent validates them, a synthesizer agent writes the answer — each with its own tool set, prompt, and termination condition. The coordination pattern (supervisor-worker, debate, hierarchical) determines the system's accuracy ceiling and failure modes.

## How It Works
**Supervisor-Worker Pattern:** A supervisor agent receives the user query, decomposes it into sub-tasks, dispatches each to a specialized worker agent, collects results, and synthesizes the final answer. The supervisor maintains a task graph and can re-dispatch if a worker's output is insufficient. Workers never communicate directly — all information flows through the supervisor, giving you a single point of observability and control.

**Debate Pattern:** Two or more agents independently answer the same question using different retrieval strategies (e.g., dense vs sparse, vector vs graph). A judge agent compares their answers, identifies disagreements, asks for clarification, and iterates until consensus or until a maximum round limit. This pattern excels at reducing hallucination — if two independent agents with different tools converge on the same answer, confidence increases.

**Hierarchical Agents:** A tree structure where high-level agents decompose problems and low-level agents execute retrieval. Each level adds abstraction — the top agent reasons about the user's intent, mid-level agents manage retrieval strategies, leaf agents execute individual tool calls. This mirrors organizational structures and works well for complex research tasks with nested sub-questions.

**Agent Communication Protocols:** Agents exchange structured messages with explicit fields: `{sender, recipient, task, payload, confidence, request_type}`. This is not free-form chat — it is a protocol that enables deterministic routing and audit trails. Every inter-agent message is logged for debugging.

**Shared Memory:** All agents read and write to a shared state dictionary that persists across the entire session. This includes retrieval results, intermediate findings, and confidence scores. The key challenge is memory consistency — when agent A writes a finding and agent B later reads it, agent B must know whether that finding has been validated or is provisional.

## Code Examples

```python
from typing import TypedDict, Annotated
import operator, json

class SharedMemory(TypedDict):
    query: str
    task_queue: list[dict]
    findings: Annotated[list[dict], operator.add]
    consensus: dict | None
    round: int

class AgentMessage(TypedDict):
    sender: str
    recipient: str
    task: str
    payload: dict
    confidence: float

def supervisor_loop(state: SharedMemory) -> SharedMemory:
    """Decompose query, dispatch to workers, collect and synthesize."""
    subtasks = decompose(state["query"])  # LLM call to break query into sub-questions
    findings = []
    for task in subtasks:
        msg = AgentMessage(sender="supervisor", recipient=task["worker"],
                           task=task["question"], payload={}, confidence=1.0)
        result = dispatch_to_worker(msg, state)
        findings.append(result)
    state["findings"] = findings
    state["consensus"] = synthesize(findings)  # LLM call to merge findings
    return state

def debate_round(agent_a: dict, agent_b: dict, state: SharedMemory) -> dict:
    """One round of debate: each agent retrieves and argues, judge evaluates."""
    response_a = agent_a["retrieve"](state["query"])
    response_b = agent_b["retrieve"](state["query"])
    judge_prompt = f"""
    Agent A found: {json.dumps(response_a)}
    Agent B found: {json.dumps(response_b)}
    Are they consistent? If not, what clarification is needed?
    """
    verdict = judge(judge_prompt)  # LLM call
    return {"verdict": verdict, "round": state["round"] + 1,
            "converged": verdict.get("consistent", False)}

# Shared memory enables cross-agent context
def write_to_shared(state: SharedMemory, finding: dict) -> SharedMemory:
    return {**state, "findings": state["findings"] + [finding]}

def read_from_shared(state: SharedMemory, key: str) -> list[dict]:
    return [f for f in state["findings"] if f.get("key") == key]
```

## Try It Yourself
Build a 3-agent debate system: Agent A uses dense vector retrieval, Agent B uses sparse BM25 retrieval, and Agent C uses a knowledge graph. All three answer the same complex multi-hop question. Implement a judge that identifies factual discrepancies and generates targeted clarification questions. Run 10 queries from the MultiHop-RAG benchmark and measure: (a) how often debate corrects an error, (b) how many rounds are needed for convergence, and (c) whether 3 agents outperform the best single agent.

## Real-World RAG Connection
Microsoft's AutoGen framework pioneered multi-agent RAG patterns now used in enterprise settings. LangGraph's subgraph feature enables hierarchical agent architectures with independent state management per subgraph. In production, multi-agent systems are gated behind cost controls — each additional agent adds LLM calls, so routing logic must determine whether a query justifies multi-agent processing or can be handled by a single agent with a static pipeline.

## Common Pitfalls
**Pitfall:** Agents fall into "echo chamber" convergence where they agree on a wrong answer because they all share the same underlying retrieval index. **Fix:** Ensure each agent uses a different retrieval source — different vector stores, different embedding models, or different search APIs. Diversity of source is the mechanism that makes debate work.

**Pitfall:** Supervisor becomes a bottleneck — as worker count grows, the supervisor's context window overflows with worker outputs it must synthesize. **Fix:** Implement a "report format" that each worker must follow (max 500 tokens per finding, structured as claim/evidence/confidence). The supervisor reads reports, not raw output.

**Pitfall:** Shared memory grows unbounded across a long session, degrading agent performance on later queries. **Fix:** Implement memory compaction — every N rounds, summarize old findings into a compressed knowledge representation and discard the raw data.

## Next Steps
Read the AutoGen paper (Wu et al., 2023). Study LangGraph's multi-agent examples. Take agentic_rag_patterns to learn specific agentic RAG algorithm patterns.
