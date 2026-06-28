---
id: rag_conv_mem
title: Conversational Memory for RAG
tier: expert
difficulty: expert
estimated_minutes: 30
module: optimization
prerequisites: [advanced_retrieval, agentic_rag_intro]
tags: [conversational-memory, buffering, entity-memory, memgpt, letta, persistence]
---

## Concept Introduction
Stateless RAG treats every query as a blank slate. Conversational RAG maintains memory across turns, so "what about the second one?" actually works. The challenge goes beyond appending chat history to the prompt — you need structured memory that persists entity references, tracks what the user knows, and compresses conversation history so you do not burn your context window on "hello" and "thanks" from 20 turns ago. The MemGPT/Letta pattern is the current frontier: treating memory as an operating system resource managed by an LLM agent.

## How It Works
**Conversation buffering** is the simplest layer: keep the last N turns (typically 5-10) as immediate context. The buffer is a sliding window; old messages are evicted. This handles pronoun resolution ("it," "they," "the first option") and follow-up intent. The buffer is a list of `{role, content, timestamp, retrieval_context}` objects.

**Summary memory** compresses older conversation segments into structured summaries. When the buffer fills, the oldest buffer entries are summarized by a lightweight LLM into a single paragraph capturing: topics discussed, decisions made, questions answered, and open threads. Summaries accumulate in a summary store. At query time, relevant summaries are retrieved alongside the current buffer.

**Entity memory** tracks entities mentioned across the conversation: people, products, dates, numbers, concepts. Each entity gets a running state — the user's stated preferences about it, facts established, questions asked. When the user says "the third one," entity memory resolves what "the third one" refers to by checking the entity state against the conversation history.

**MemGPT / Letta pattern** (Packer et al., 2023) models memory as a virtual operating system. The LLM agent manages its own memory: it can read from "main memory" (full context), write to "working memory" (scratchpad), and page data between main memory and "external storage" (vector DB + conversation store). The agent decides what to keep in context, what to archive, and what to retrieve. A memory management function call (`core_memory_append`, `archival_memory_insert`, `archival_memory_search`) executes the agent's memory decisions.

**Multi-session persistence** stores memory across user sessions, so the RAG system remembers what was discussed last week. This requires a user-scoped memory store (vector DB, key-value store, or relational DB) and a session-resumption protocol that loads relevant memories before the first turn of a new session. The key design decision is what to persist: full conversation transcripts (expensive, privacy-implicated) or extracted summaries/entities (lossy but compact and auditable).

## Code Examples

```python
import time, json
from typing import TypedDict

class MemoryEntry(TypedDict):
    role: str
    content: str
    timestamp: float
    entities: list[str]

class ConversationalMemoryManager:
    def __init__(self, buffer_size: int = 10, summary_llm=None, embedding_fn=None):
        self.buffer: list[MemoryEntry] = []
        self.buffer_size = buffer_size
        self.summary_store: list[dict] = []
        self.entity_store: dict[str, dict] = {}
        self.summary_llm = summary_llm
        self.embedding_fn = embedding_fn

    def add_turn(self, role: str, content: str, entities: list[str]):
        entry = MemoryEntry(role=role, content=content,
                           timestamp=time.time(), entities=entities)
        self.buffer.append(entry)
        self._update_entities(entry)
        if len(self.buffer) > self.buffer_size:
            self._compact()

    def _compact(self):
        """Summarize oldest buffer entries, evict them from buffer."""
        to_summarize = self.buffer[:-self.buffer_size]
        conv_text = "\n".join(f"{m['role']}: {m['content']}" for m in to_summarize)
        prompt = f"""Summarize this conversation segment concisely:
        {conv_text}
        Include: topics discussed, key facts established, decisions made,
        questions answered, and any open threads."""
        summary = self.summary_llm(prompt) if self.summary_llm else conv_text[:500]
        summary_emb = self.embedding_fn(summary) if self.embedding_fn else None
        self.summary_store.append({
            "summary": summary,
            "timestamp": to_summarize[0]["timestamp"],
            "embedding": summary_emb
        })
        self.buffer = self.buffer[-self.buffer_size:]

    def _update_entities(self, entry: MemoryEntry):
        for entity in entry["entities"]:
            if entity not in self.entity_store:
                self.entity_store[entity] = {"mentions": 0, "contexts": []}
            self.entity_store[entity]["mentions"] += 1
            self.entity_store[entity]["contexts"].append(entry["content"][:200])

    def resolve_reference(self, reference: str) -> dict | None:
        """Resolve entity references like 'the first one', 'that option'."""
        for entity, data in sorted(self.entity_store.items(),
                                   key=lambda x: x[1]["mentions"], reverse=True):
            if reference.lower() in entity.lower():
                return {"entity": entity, "data": data}
        return None

    def get_context_for_query(self, query: str, k_summaries: int = 3) -> str:
        """Assemble conversation context for a new query."""
        parts = []
        # Relevant summaries
        if self.summary_store and self.embedding_fn:
            query_emb = self.embedding_fn(query)
            scored = []
            for s in self.summary_store:
                if s.get("embedding") is not None:
                    import numpy as np
                    score = np.dot(s["embedding"], query_emb)
                    scored.append((score, s["summary"]))
            scored.sort(reverse=True)
            parts.append("## Previous conversation summaries:")
            parts.extend(s[1] for s in scored[:k_summaries])
        # Current buffer
        parts.append("## Recent conversation:")
        parts.extend(f"{m['role']}: {m['content']}" for m in self.buffer[-6:])
        return "\n\n".join(parts)

# MemGPT-inspired memory management
class MemGPTMemoryManager(ConversationalMemoryManager):
    def memory_management_tool(self, action: str, **kwargs):
        """Tool that the LLM agent calls to manage its own memory."""
        if action == "core_memory_append":
            self.buffer.append(MemoryEntry(
                role="memory", content=kwargs["content"],
                timestamp=time.time(), entities=kwargs.get("entities", [])
            ))
        elif action == "core_memory_replace":
            if kwargs.get("old_content") and self.buffer:
                self.buffer = [m for m in self.buffer
                              if m["content"] != kwargs["old_content"]]
        elif action == "archival_memory_insert":
            emb = self.embedding_fn(kwargs["content"]) if self.embedding_fn else None
            self.summary_store.append({
                "summary": kwargs["content"],
                "timestamp": time.time(),
                "embedding": emb
            })
        elif action == "archival_memory_search":
            return self._search_archival(kwargs["query"], kwargs.get("k", 5))

    def _search_archival(self, query: str, k: int = 5) -> list[dict]:
        if not self.embedding_fn:
            return self.summary_store[:k]
        import numpy as np
        query_emb = self.embedding_fn(query)
        scored = []
        for s in self.summary_store:
            if s.get("embedding") is not None:
                score = float(np.dot(s["embedding"], query_emb))
                scored.append((score, s))
        scored.sort(reverse=True)
        return [s for _, s in scored[:k]]
```

## Try It Yourself
Build a conversational RAG system with three memory layers: conversation buffer (last 8 turns), summary memory (LLM-compressed summaries of older turns), and entity memory (tracking entities across turns). Deploy it as a Q&A bot over a corpus of technical documentation. Test with 20 multi-turn conversations that include cross-turn references ("the second bullet point you mentioned earlier") and topic switches (returning to a topic from 15 turns ago). Measure: (a) accuracy improvement over stateless RAG, (b) average prompt token count with memory vs full history, (c) how often entity memory correctly resolves ambiguous references.

## Real-World RAG Connection
OpenAI's ChatGPT memory feature implements summary and entity memory for multi-session persistence. Letta (formerly MemGPT) is the open-source implementation of the OS-inspired memory architecture, enabling RAG agents to maintain coherent context over hundreds of turns. Anthropic's prompt caching reduces the cost of re-sending conversation history by caching the static portion of the context. The open problem is memory staleness — when the user learns new information during a conversation, old entity facts become outdated, and the system must detect and update them.

## Common Pitfalls
**Pitfall:** Summary memory compounds errors — the LLM makes a small mistake in a summary, the next summarization includes that mistake, and after 5 compactions the summary is factually wrong. **Fix:** Retain the original conversation turns alongside summaries. Periodically regenerate summaries from the original source rather than from previous summaries. Use a verification step that compares summary claims against original messages.

**Pitfall:** Entity memory leaks PII across users when entities are stored in a global store. **Fix:** Scope entity memory to user sessions. Use a user-specific namespace. Implement memory expiration — purge entity data after a configurable retention period. Encrypt entity stores at rest.

**Pitfall:** The buffer grows to include massive tool outputs (retrieval results, code execution output), leaving no room for conversation history. **Fix:** Separate system messages and tool outputs from conversation turns. Tool outputs go into a separate "working memory" that the agent can reference but that does not accumulate — it is replaced on each turn. Only conversation turns count toward the buffer limit.

## Next Steps
Read the MemGPT paper (Packer et al., 2023). Study the Letta open-source codebase. Take rag_benchmark to learn how to measure conversational RAG quality.
