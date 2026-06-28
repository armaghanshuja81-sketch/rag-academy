---
id: llm_apis
title: Calling LLM APIs from Python
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: llms
prerequisites: [llm_what, py_file_io]
tags: [llm, api, openai, anthropic]
---

## Concept Introduction

Knowing what an LLM is means nothing if you can't call one from code. LLM APIs
are the programmatic interface to models like GPT-4o and Claude. By the end of
this lesson you'll call OpenAI and Anthropic APIs from Python, handle errors,
stream responses, and manage API keys securely.

## How It Works

Every LLM API follows the same pattern: you send an HTTP request with your API
key, a model name, and a list of messages; the provider returns generated text
and token usage stats. Differences between providers (OpenAI vs Anthropic vs
Groq) are mostly in client library setup and parameter names — the conceptual
model is identical.

API keys identify and bill your account. Never hardcode them. Use environment
variables (`os.getenv("OPENAI_API_KEY")`) or a `.env` file with `python-dotenv`.
Add `.env` to `.gitignore` immediately.

Streaming returns tokens one at a time instead of waiting for the full
response. This feels faster to users and is essential for chat UIs. Enable it
by passing `stream=True` in most client libraries.

## Code Examples

OpenAI — the most common API for RAG:

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.0,
    messages=[
        {"role": "system", "content": "Answer using only the provided context."},
        {"role": "user", "content": "Context: RAG = Retrieval-Augmented Generation.\nQuestion: What is RAG?"}
    ]
)

answer = response.choices[0].message.content
print(f"Answer: {answer}")
print(f"Tokens: {response.usage.total_tokens}")
```

Anthropic (Claude) — strong for long-context RAG:

```python
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="Answer using only the provided context.",
    messages=[
        {"role": "user", "content": "Context: RAG = Retrieval-Augmented Generation.\nQuestion: What is RAG?"}
    ]
)
print(message.content[0].text)
```

Streaming response — tokens arrive one at a time:

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain RAG in 3 sentences."}],
    stream=True
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## Try It Yourself

Write a `call_llm(prompt, model, temperature)` function that works with both
"openai" and "anthropic" providers. Use a dict to map provider names to
client call signatures:

```python
import os

def call_llm(prompt, model="gpt-4o", temperature=0.0):
    if model.startswith("gpt"):
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        r = client.chat.completions.create(
            model=model, temperature=temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        return r.choices[0].message.content
    elif model.startswith("claude"):
        from anthropic import Anthropic
        client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        r = client.messages.create(
            model=model, max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return r.content[0].text
    raise ValueError(f"Unknown model: {model}")
```

## Real-World RAG Connection

Every RAG pipeline's generation step is an LLM API call. The retrieved context
is injected into the messages array and the model generates a grounded
response. In production, you'll add error handling for rate limits (429
status), timeouts, and empty responses — each a failure mode you'll encounter
within your first week of running a RAG app in production.

## Common Pitfalls

- **Pitfall:** Committing API keys to GitHub. Anyone can find them with a
  search. **Fix:** Use `.env` files, add `.env` to `.gitignore`, and never
  call `git add` on files containing keys.
- **Pitfall:** Not handling `RateLimitError` — the app crashes when you exceed
  your quota. **Fix:** Catch rate limit errors and implement exponential
  backoff with `time.sleep()`.
- **Pitfall:** Using `temperature > 0` with RAG. The model gets creative with
  your source material. **Fix:** Set `temperature=0.0` for factual RAG use
  cases.

## Next Steps

- **Practice:** Sign up for both OpenAI and Anthropic accounts, get API keys,
  and run the same RAG prompt through both. Compare the answers.
- **Read:** [OpenAI Python SDK](https://github.com/openai/openai-python)
- **Related:** [rag_pipeline_full](/lesson/rag_pipeline_full) — integrate API
  calls into a complete RAG pipeline
