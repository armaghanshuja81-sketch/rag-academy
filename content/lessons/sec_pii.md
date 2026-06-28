---
id: sec_pii
title: PII Detection & Redaction
tier: senior
difficulty: advanced
estimated_minutes: 25
module: security
prerequisites: [sec_injection]
tags: [security, pii, redaction, presidio, gdpr, ccpa]
---

## Concept Introduction

RAG systems ingest whatever you give them -- customer support tickets, internal wikis, email threads -- and embedded personal data propagates through retrieval and into generated responses. In production, a single social security number accidentally surfaced in a chat response can be a compliance violation under GDPR, CCPA, or HIPAA. This lesson covers detection tooling, the redaction-vs-masking-vs-tokenization tradeoff, and where in the RAG pipeline to place PII controls.

## How It Works

Microsoft Presidio is the standard open-source PII detection library. It combines three detection layers: pattern matching (regex for SSNs, credit card numbers, phone numbers), named entity recognition via spaCy (PERSON, LOCATION, ORGANIZATION), and custom recognizers for domain-specific PII. Presidio returns spans with entity types and confidence scores, and you decide at what confidence threshold to take action.

The architectural decision is redaction vs masking vs tokenization. Redaction removes PII entirely (`[REDACTED]`) -- irreversible, safest for compliance, but destroys information the LLM might need (a support ticket about "John Smith's account" becomes about "[PERSON]'s account"). Masking preserves some information (last 4 digits of SSN, first letter of name) while de-identifying the individual. Tokenization replaces PII with a reversible pseudonym stored in a vault -- the LLM sees "User_7392," and downstream systems can re-identify if authorized. Tokenization is the most useful for RAG quality but requires maintaining a secure token vault.

Where to place PII controls in the pipeline: (1) at ingestion -- scan and tag documents before embedding, storing redacted versions in the vector index and original versions in an ACL-gated store, (2) at generation -- redact PII from retrieved chunks before they enter the prompt, (3) at output -- scan generated responses for PII that the LLM hallucinated (yes, LLMs invent plausible-looking PII). Production systems apply controls at all three points.

GDPR and CCPA require not just detection but also the right to access and delete personal data. If a user invokes their "right to be forgotten," your RAG system must be able to locate every chunk derived from documents containing their PII and delete or re-process them. This requires maintaining a mapping from PII entity back to source document chunks -- a separate index keyed by entity, not by embedding.

## Code Examples

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def redact_pii(text: str, threshold: float = 0.7) -> tuple[str, list[dict]]:
    results = analyzer.analyze(text=text, language="en", score_threshold=threshold)
    # results: [{"entity_type": "PERSON", "start": 0, "end": 10, "score": 0.85}, ...]
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized.text, results

# RAG pipeline insertion point: before prompt assembly
def build_prompt_safe(query: str, chunks: list[str]) -> str:
    safe_query, _ = redact_pii(query)
    safe_chunks = [redact_pii(c)[0] for c in chunks]
    return f"Query: {safe_query}\n\nContext:\n" + "\n".join(safe_chunks)

# Tokenization: reversible pseudonymization
from presidio_anonymizer.entities import OperatorConfig

def tokenize_pii(text: str) -> tuple[str, dict]:
    """Replace PII with USER_<hash>, return vault mapping."""
    results = analyzer.analyze(text=text, language="en")
    vault = {}
    operators = {}
    for r in results:
        token = f"USER_{hash(text[r.start:r.end]) % 10000:04d}"
        vault[token] = text[r.start:r.end]
        operators[r.entity_type] = OperatorConfig("replace", {"new_value": token})
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results, operators=operators)
    return anonymized.text, vault
```

## Try It Yourself

Create a test document containing real-looking PII: a name, email, SSN (use fake ones), and phone number. Run it through Presidio with default settings. Verify detection. Then modify the confidence threshold from 0.7 to 0.3 and 0.9 and observe how the detection set changes. Finally, simulate a "right to be forgotten" request by building a reverse index: given an entity, find all document IDs that contain it.

## Real-World RAG Connection

A healthcare RAG system processes patient records for clinical decision support. PII is tokenized at ingestion: "Patient Jane Doe, MRN 123456" becomes "Patient PATIENT_8472, MRN MRN_3910." The RAG system retrieves and answers questions using tokenized text. When the doctor needs to act on a recommendation, the token vault re-identifies the record for the EHR system. Neither the LLM nor the vector database ever sees real PII.

## Common Pitfalls

- **Redacting before embedding, then retrieving by redacted query.** If "John Smith" is redacted from both the indexed documents and the user's query, the retriever may still match redacted chunks by surrounding context. But if you replace "John Smith" with "PERSON" everywhere, you lose the ability to retrieve documents about specific people.
- **Presidio's default NLP model missing domain-specific PII.** The default spaCy model (`en_core_web_lg`) misses medical record numbers, internal project codes, and other domain identifiers. Train custom recognizers on your own data.
- **Ignoring PII in metadata.** Chunk metadata (`source_file`, `author`, `department`) often contains PII even if the chunk text is clean. Scan metadata too.

## Next Steps

- Microsoft Presidio documentation on custom recognizers and anonymizer operators
- Lesson: **Access Control for RAG** for document-level authorization
