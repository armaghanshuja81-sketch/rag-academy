---
id: sec_privacy
title: Data Privacy for LLM Apps
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: security
prerequisites: [llm_apis]
tags: [security, privacy, compliance]
---

## Concept Introduction

Every query to a cloud LLM sends your data to a third party. For RAG
applications handling sensitive documents — legal contracts, medical records,
internal strategy — this is a compliance risk. By the end of this lesson
you'll understand the privacy risks, evaluate local vs cloud models, and
implement data sanitization before API calls.

## How It Works

When you call `openai.chat.completions.create()`, your prompt and retrieved
context leave your server, traverse the internet, and are processed on
OpenAI's infrastructure. Most providers log API calls for abuse monitoring
(typically 30 days). Some offer zero-data-retention policies for API users
(enterprise tier only), but the default is logging.

The risk tiers:
1. **Public data** — blog posts, documentation, marketing copy. Any model is
   fine.
2. **Internal data** — company strategy, code, meeting notes. Use providers
   with data processing agreements (DPA) and opt-out of training.
3. **Regulated data** — PII, medical (HIPAA), financial (SOC 2). Use
   self-hosted models or providers with BAA/DPA and zero retention.
4. **Classified data** — government, trade secrets. Self-hosted only, on
   air-gapped infrastructure.

PII detection should run BEFORE data reaches the LLM. If a retrieved document
contains a phone number, strip it or mask it before it enters the prompt.

## Code Examples

PII detection with regex and optional `presidio`:

```python
import re

# Simple PII patterns — use a proper tool in production
PII_PATTERNS = {
    "email": r"\b[\w.-]+@[\w.-]+\.\w{2,}\b",
    "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
}

def mask_pii(text):
    for label, pattern in PII_PATTERNS.items():
        text = re.sub(pattern, f"[REDACTED-{label}]", text)
    return text

doc = "Contact john@example.com or call 555-123-4567 for support."
print(mask_pii(doc))
# Contact [REDACTED-email] or call [REDACTED-phone] for support.
```

Check provider data policies from code:

```python
# Pseudocode — real implementation depends on provider
def safe_llm_call(prompt, provider="openai"):
    if provider == "local":
        from llama_cpp import Llama
        llm = Llama(model_path="./models/mistral.gguf")
        return llm(prompt)
    elif provider == "openai":
        # Verify enterprise agreement with zero retention
        assert os.getenv("OPENAI_ENTERPRISE") == "true"
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        return client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": mask_pii(prompt)}]
        )
```

## Try It Yourself

Audit a hypothetical RAG app: users upload HR documents containing employee
names, salaries, and performance reviews. Write the data flow and identify
every point where PII could leak:

1. Document upload → stored in S3 (encrypted at rest? ✓)
2. Chunking → employee names in chunks (mask before embedding? ✓)
3. Embedding → sent to OpenAI API (do they train on it? ✗ — need opt-out)
4. Query → user asks "What is John's salary?" → LLM sees retrieved chunk
5. Response → salary returned to user (authorization check needed)

## Real-World RAG Connection

Enterprise RAG adoption hinges on privacy. Companies won't connect their
internal knowledge bases to LLM APIs without data processing agreements,
audit logs, and PII redaction. The privacy layer is often more work than the
RAG pipeline itself — budget for it accordingly.

## Common Pitfalls

- **Pitfall:** Assuming "API opt-out of training" applies retroactively. It
  doesn't — data sent before opting out was already logged. **Fix:** Enable
  data controls before sending a single query.
- **Pitfall:** PII in embedding metadata (document titles, filenames) — even
  if chunk content is clean, metadata can leak. **Fix:** Scan metadata fields
  with the same PII detectors used for content.
- **Pitfall:** Running PII detection AFTER retrieval instead of before
  indexing. PII enters the vector store uncleaned. **Fix:** Redact PII at
  ingestion time, before embedding.

## Next Steps

- **Practice:** Install `presidio-analyzer` and `presidio-anonymizer`, run
  them on your own documents, and compare the output to your regex-based
  approach.
- **Read:** [Microsoft Presidio Documentation](https://microsoft.github.io/presidio/)
- **Related:** [sec_injection](/lesson/sec_injection) — protect your RAG
  pipeline from prompt injection attacks
