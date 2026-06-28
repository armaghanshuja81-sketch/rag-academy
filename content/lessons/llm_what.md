---
id: llm_what
title: What are LLMs?
tier: junior
difficulty: beginner
estimated_minutes: 15
module: llms
prerequisites: [py_functions]
tags: [llm, ai, language-models]
---

## Concept Introduction

A Large Language Model is an AI trained on vast amounts of text — books,
articles, code, conversations — to predict the next word in a sequence. When
you query ChatGPT or Claude, you're talking to an LLM. By the end of this
lesson you'll understand tokens, context windows, temperature, and why LLMs
need RAG.

## How It Works

LLMs are next-word predictors trained on internet-scale text. You give them a
prompt, they predict the most probable next word, append it, then predict the
next word after that — autoregressive generation — until they produce a
complete response. They don't "think" or "know" things; they pattern-match
against their training data.

Several key constraints define how an LLM behaves:

- **Tokens**: The basic unit LLMs process. Roughly 0.75 words = 1 token.
  "Retrieval-Augmented Generation" is about 6 tokens.
- **Context window**: Maximum tokens the model can "see" at once — input plus
  output combined. GPT-4o has 128K, Claude has 200K.
- **Temperature** (0.0 to 1.0+): Controls randomness. 0.0 gives the most
  probable (deterministic) output — use for factual RAG. Higher values
  produce creative, varied output — use for brainstorming.
- **Training cutoff**: Models only know events up to their training date.
  Without RAG or web search, they can't answer questions about recent events.

## Code Examples

Calling an LLM from Python (pseudocode — real calls need an API key):

```python
import openai

client = openai.OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.0,      # Deterministic — best for RAG
    max_tokens=256,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ]
)

print(response.choices[0].message.content)
print(f"Tokens used: {response.usage.total_tokens}")
```

The tokenizer determines how text becomes tokens:

```python
# Pseudocode — requires `tiktoken` package
# import tiktoken
# enc = tiktoken.encoding_for_model("gpt-4o")
# tokens = enc.encode("What is RAG?")
# print(f"'{text}' = {len(tokens)} tokens: {tokens}")
```

## Try It Yourself

Design a prompt for a RAG system. Given a user question and a retrieved
context passage, construct the messages array the LLM needs:

```python
def build_rag_prompt(question, context):
    system = "Answer using only the provided context. If the context doesn't contain the answer, say 'I don't have enough information.'"
    user = f"Context:\n{context}\n\nQuestion: {question}"
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user}
    ]

context = "RAG stands for Retrieval-Augmented Generation. It combines search with text generation."
question = "What does RAG stand for?"
messages = build_rag_prompt(question, context)
for msg in messages:
    print(f"[{msg['role']}]: {msg['content'][:100]}...")
```

## Real-World RAG Connection

LLMs are the "G" in RAG — the Generation step. After your retriever finds
relevant documents, they're inserted into the LLM's context as grounding
material. The LLM reads the retrieved context and the user's question together,
then generates an answer backed by evidence instead of relying on its training
data alone. Without RAG, LLMs hallucinate. With RAG, they cite sources.

## Common Pitfalls

- **Pitfall:** Exceeding the context window — your retrieved documents plus
  prompt and response exceed the token limit, causing an error or truncation.
  **Fix:** Count tokens before calling the API (`tiktoken`), and trim
  retrieved chunks to fit within `max_tokens - response_reserve`.
- **Pitfall:** Using high temperature for factual RAG — the LLM gets creative
  with source material. **Fix:** Set `temperature=0.0` for RAG use cases.
- **Pitfall:** Trusting LLM output without verification. LLMs are fluent but
  not always factual. **Fix:** Always show sources alongside answers so
  users can verify claims.

## Next Steps

- **Practice:** Sign up for an OpenAI API account, get an API key, and run the
  code example above with a real model. Compare `temperature=0.0` vs
  `temperature=1.0` on the same factual question.
- **Read:** [OpenAI API Documentation](https://platform.openai.com/docs)
- **Related:** [prompt_eng](/lesson/prompt_eng) — craft prompts that get
  reliable, structured responses from LLMs
