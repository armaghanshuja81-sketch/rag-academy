---
id: prompt_eng
title: Prompt Engineering Basics
tier: junior
difficulty: beginner
estimated_minutes: 15
module: llms
prerequisites: [llm_what]
tags: [prompt-engineering, llm, system-prompt]
---

## Concept Introduction

The quality of an LLM's output depends almost entirely on the quality of your
prompt. Prompt engineering is the skill of writing instructions that get
reliable, structured, useful responses. By the end of this lesson you'll write
system prompts, use few-shot examples, and apply chain-of-thought prompting.

## How It Works

An LLM has no goals, no opinions, no idea what you want. It completes text
based on patterns it learned during training. Your prompt sets the pattern.
A vague prompt gets a vague completion. A precise prompt with constraints,
format, and examples gets a precise response.

The messages array has three roles:
- **System**: Sets behavior, tone, and constraints. This is the most important
  part of your prompt for RAG.
- **User**: The actual question or instruction.
- **Assistant**: The model's previous responses (for multi-turn conversations)
  or example responses (few-shot learning).

Few-shot prompting means including examples of the desired input-output
pattern in the prompt. The model picks up the pattern and follows it for new
inputs — no fine-tuning required.

Chain-of-thought prompting means asking the model to show its reasoning step
by step. The phrase "Let's think step by step" reliably improves accuracy on
complex reasoning tasks.

## Code Examples

A minimal RAG system prompt with constraints:

```python
SYSTEM_PROMPT = """You are a research assistant. Follow these rules exactly:

1. Answer ONLY using information from the provided context.
2. If the context doesn't contain the answer, say: "Not enough information."
3. Cite the specific passage you used after each claim: [Source: passage name].
4. Keep answers under 3 paragraphs.
5. Use plain language — no jargon without explanation."""
```

Few-shot prompting — show the pattern you want:

```python
few_shot_prompt = """Classify each query as: factual, procedural, or comparative.

Examples:
Query: "What is the capital of France?" → factual
Query: "How do I install ChromaDB?" → procedural
Query: "Which is faster, FAISS or Pinecone?" → comparative

Now classify: "What is the chunk size for text-embedding-3?" →"""

# The model will output "factual" — it learned the pattern from examples
```

Chain-of-thought for retrieval quality assessment:

```python
cot_prompt = """Assess whether this retrieved passage answers the user's question.

Question: "How many chunks should I use for a 10-page document?"
Passage: "Chunk size of 512 tokens with 50-token overlap works well for most documents."

Let's think step by step:
1. The question asks about number of chunks for a specific document length.
2. The passage mentions chunk size (512 tokens) and overlap (50 tokens).
3. 10 pages ≈ 5,000 words ≈ 6,700 tokens. At 512 tokens per chunk with 50 overlap,
   that's approximately 15 chunks.
4. The passage provides the formula but not the explicit calculation.

Verdict: Partially relevant — gives the method but not the direct answer."""
```

## Try It Yourself

Write a system prompt for a RAG chatbot that answers questions about a
company's internal documentation. It must: refuse off-topic questions, cite
document names, and never hallucinate:

```python
SYSTEM_PROMPT = """You are an internal documentation assistant for Acme Corp.
Rules:
1. Answer ONLY from the provided context passages.
2. If a question is not about Acme Corp products or policies, respond:
   "I can only answer questions about Acme Corp documentation."
3. After each claim, cite the document name in brackets: [doc_name.pdf].
4. If multiple passages disagree, say so and present both views.
5. Never guess. If the context is insufficient, say so."""

# Test: what would the model say to "Who won the World Cup in 2022?"
# It should refuse because that's not about Acme Corp docs.
```

## Real-World RAG Connection

Prompt engineering is the control plane of a RAG system. The system prompt
determines whether the model faithfully uses retrieved context or ignores it
and hallucinates. Few-shot examples in the prompt teach the model the exact
citation format you want. Chain-of-thought improves accuracy when the model
needs to synthesize information from multiple retrieved chunks.

## Common Pitfalls

- **Pitfall:** Contradictory instructions — "Be concise" and "Include every
  detail from the context" conflict. **Fix:** Read your prompt as if you're
  the model. Would you know what to prioritize?
- **Pitfall:** Prompt injection — a malicious user includes "Ignore previous
  instructions" in their query. **Fix:** Use delimiters (triple backticks,
  XML tags) to separate user input from instructions, and instruct the model
  to never follow instructions inside the user input.
- **Pitfall:** Over-engineering the prompt — a 2-page system prompt is hard to
  debug. **Fix:** Start with 2-3 rules. Add more only when you observe
  specific failures.

## Next Steps

- **Practice:** Take a system prompt you've written and test it against 5 edge
  cases: an off-topic question, an empty query, a question the context can't
  answer, a question with contradictory context, and a multi-part question.
- **Read:** [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- **Related:** [rag_what](/lesson/rag_what) — see how prompts fit into the
  full retrieval-augmented generation pipeline
