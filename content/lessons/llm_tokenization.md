---
id: llm_tokenization
title: Tokenization & Context Windows
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: llms
prerequisites: [llm_apis]
tags: [tokenization, context-window, tiktoken]
---

## Concept Introduction

Every word you send to an LLM costs money and consumes context window space.
Tokenization turns text into the atomic units LLMs actually process — tokens.
By the end of this lesson you'll count tokens before calling APIs, understand
how different models tokenize differently, and manage context windows across
retrieved documents.

## How It Works

Tokens aren't words. A token is roughly 0.75 words in English, but the ratio
varies dramatically: "RAG" is 1 token, "Retrieval-Augmented" could be 2-3
tokens in one tokenizer and 5 in another. Code, non-English text, and special
characters can be much more token-expensive.

Each model has a fixed context window — the maximum combined input + output
tokens it can process. If your retrieved documents plus prompt exceed this
limit, the API either truncates (losing information) or errors. You must count
tokens before calling the API and trim your context to fit.

Tokenizers are model-specific — GPT-4o uses `o200k_base`, Claude uses its own,
and open-source models use various SentencePiece or BPE tokenizers. Always use
the same tokenizer for counting that the model uses internally.

## Code Examples

Count tokens with `tiktoken` (OpenAI models):

```python
import tiktoken

def count_tokens(text, model="gpt-4o"):
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

context = "RAG combines retrieval with text generation."
print(f"'{context}' = {count_tokens(context)} tokens")

# Count messages array
def count_message_tokens(messages, model="gpt-4o"):
    enc = tiktoken.encoding_for_model(model)
    total = 0
    for msg in messages:
        total += 4  # Message framing tokens
        for key, value in msg.items():
            total += len(enc.encode(value))
    total += 2  # Reply priming
    return total

messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain RAG in detail."}
]
print(f"Messages: {count_message_tokens(messages)} tokens")
```

Trim context to fit within a budget:

```python
def trim_context(chunks, max_tokens=3000, model="gpt-4o"):
    """Keep adding chunks until we hit the token budget."""
    enc = tiktoken.encoding_for_model(model)
    selected = []
    token_count = 0
    for chunk in chunks:
        chunk_tokens = len(enc.encode(chunk))
        if token_count + chunk_tokens > max_tokens:
            break
        selected.append(chunk)
        token_count += chunk_tokens
    return selected, token_count
```

## Try It Yourself

Calculate your token costs: given a conversation with a 500-token system
prompt, 3 retrieved chunks averaging 400 tokens each, and a 200-token user
question, how many tokens remain for the LLM's response if the context window
is 4096 tokens? Write the calculation:

```python
context_window = 4096
system = 500
chunks = 3 * 400
user_q = 200
overhead = 50  # Message framing tokens
remaining = context_window - system - chunks - user_q - overhead
print(f"Remaining for response: {remaining} tokens")
# At 0.75 words/token, that's ~{remaining * 0.75:.0f} words
```

## Real-World RAG Connection

Token budget management is the difference between a RAG system that works and
one that silently drops critical context. Your chunking strategy, top-k
selection, and prompt template together determine whether the retrieved
documents actually reach the LLM or get truncated away. Every production RAG
pipeline includes a token counting step before the API call.

## Common Pitfalls

- **Pitfall:** Using character count as a proxy for token count. 1000
  characters is NOT 1000 tokens — it could be anywhere from 250 to 800 tokens.
  **Fix:** Always use `tiktoken` or the model's tokenizer for counting.
- **Pitfall:** Forgetting that the output also consumes context window.
  If you reserve no tokens for the response, the model has no room to answer.
  **Fix:** Reserve at least 512-1024 tokens for the response.
- **Pitfall:** Mixing tokenizers — counting with GPT-4's tokenizer then
  calling Claude. Token counts differ by 10-30%. **Fix:** Use each provider's
  tokenizer, or add a 20% safety margin.

## Next Steps

- **Practice:** Install `tiktoken`, load your 3 most recent documents, and
  count their tokens. How many fit in a 4096-token context window with a
  500-token system prompt and 512-token response reserve?
- **Read:** [OpenAI Tokenizer Guide](https://platform.openai.com/tokenizer)
- **Related:** [chunking](/lesson/chunking) — chunk sizes are measured in
  tokens, so understanding tokenization directly informs your chunking strategy
