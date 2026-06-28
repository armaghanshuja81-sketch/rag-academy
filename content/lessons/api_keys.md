---
id: api_keys
title: Getting API Keys
tier: mid
difficulty: intermediate
estimated_minutes: 15
module: ai_llm
prerequisites: [llm_what]
tags: [api, keys, authentication, security]
---

## Concept Introduction

API keys are the credentials that let your code talk to LLM providers like
OpenAI, Anthropic, and Cohere. Without a key, every API call returns a 401
error. By the end of this lesson you will sign up for free tiers on three
providers, store keys in environment variables, and call each API from Python.

## How It Works

An API key is a long random string that identifies and bills your account.
You include it in every HTTP request — typically as an `Authorization: Bearer
<key>` header. The provider's SDKs handle this for you: you pass the key once
when constructing the client, and the SDK attaches it to every subsequent call.

The industry standard for storing keys is environment variables. You set them
in your shell (`export OPENAI_API_KEY=sk-...`) or in a `.env` file that
`python-dotenv` reads at startup. Never hardcode a key in source code —
committing one to GitHub means anyone can find it with a search and run up
charges on your account.

Free tiers give you enough credits to learn. OpenAI provides $5 in credit for
new accounts (expires after 3 months). Anthropic's free tier is rate-limited
but has no time cap. Cohere offers a free trial key with 100 calls/minute.
All three require a phone-verified account and, for paid tiers, a billing
method.

## Code Examples

Create a `.env` file in your project root (add `.env` to `.gitignore` immediately):

```bash
# .env — NEVER commit this file
OPENAI_API_KEY=sk-proj-abc123...
ANTHROPIC_API_KEY=sk-ant-api03-xyz789...
COHERE_API_KEY=CohereApiKeyHere...
```

Load keys in Python with `python-dotenv`:

```python
import os
from dotenv import load_dotenv

load_dotenv()  # Reads .env into os.environ

openai_key = os.getenv("OPENAI_API_KEY")
anthropic_key = os.getenv("ANTHROPIC_API_KEY")
cohere_key = os.getenv("COHERE_API_KEY")

# Validate keys exist before constructing clients
for name, key in [("OpenAI", openai_key),
                   ("Anthropic", anthropic_key),
                   ("Cohere", cohere_key)]:
    if not key:
        print(f"WARNING: {name} key not found. Set {name.upper()}_API_KEY in .env")
    else:
        print(f"{name} key loaded ({len(key)} chars)")
```

Test your key with a minimal API call to each provider:

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say 'keys work' in one word."}],
        max_tokens=5,
    )
    print(f"OpenAI: {response.choices[0].message.content}")
except Exception as e:
    print(f"OpenAI error: {e}")
```

```python
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
try:
    message = client.messages.create(
        model="claude-haiku-4-6",
        max_tokens=10,
        messages=[{"role": "user", "content": "Say 'keys work' in one word."}],
    )
    print(f"Anthropic: {message.content[0].text}")
except Exception as e:
    print(f"Anthropic error: {e}")
```

```python
import os
import cohere

co = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))
try:
    response = co.generate(
        model="command-r",
        prompt="Say 'keys work' in one word.",
        max_tokens=5,
    )
    print(f"Cohere: {response.generations[0].text.strip()}")
except Exception as e:
    print(f"Cohere error: {e}")
```

## Try It Yourself

Sign up for all three providers and write a `key_status()` function that:
1. Reads keys from a `.env` file using `python-dotenv`
2. Calls each provider's simplest endpoint (list models, or a 1-token completion)
3. Prints the provider name, remaining credits/quota, and rate limit headers
4. Handles the case where a key is missing with a clear message

Hint: OpenAI returns usage info in `response.usage`. Anthropic returns rate-limit
info in response headers. Cohere's `generate` response includes `meta.billed_units`.

```python
import os
from dotenv import load_dotenv

load_dotenv()

def key_status():
    providers = []

    # OpenAI check
    key = os.getenv("OPENAI_API_KEY")
    if key:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        try:
            models = client.models.list()
            providers.append(("OpenAI", f"Connected ({len(list(models.data))} models visible)"))
        except Exception as e:
            providers.append(("OpenAI", f"Error: {e}"))
    else:
        providers.append(("OpenAI", "No key found"))

    # Add Anthropic and Cohere checks here...
    for name, status in providers:
        print(f"{name}: {status}")
```

## Real-World RAG Connection

Every RAG pipeline starts with an API key. The generation step — where an LLM
reads retrieved context and produces an answer — requires at least one
provider's key. In production, you may use different keys for different
purposes: a cheap model (GPT-4o-mini, Claude Haiku) for query classification,
and a more capable model (GPT-4o, Claude Sonnet) for final answer generation.
Rotate keys quarterly and monitor usage per key — a key leak can mean thousands
of dollars in unauthorized charges within hours.

## Common Pitfalls

- **Pitfall:** Committing `.env` to git. Anyone who clones your repo sees your
  keys. **Fix:** Add `.env` to `.gitignore` before your first commit, and use
  `.env.example` with placeholder values for documentation.
- **Pitfall:** Hardcoding keys in source files, even temporarily. **Fix:** Use
  `os.getenv("KEY_NAME")` from day one. If you need to debug a key issue, print
  the first 8 characters and length, never the full key.
- **Pitfall:** Using the same API key across development, staging, and
  production. A dev environment crash that floods the API will eat production
  quota. **Fix:** Create separate API keys per environment and set usage limits
  on each.

## Next Steps

- **Practice:** Set up all three providers, call each one from Python, and
  compare the response latency and token usage for identical prompts.
- **Read:** [OpenAI API Keys](https://platform.openai.com/api-keys) and
  [Anthropic Console](https://console.anthropic.com/)
- **Related:** [llm_apis](/lesson/llm_apis) — use your new keys to make
  real API calls and build the generation step of RAG
