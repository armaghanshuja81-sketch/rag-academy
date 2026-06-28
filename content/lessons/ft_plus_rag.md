---
id: ft_plus_rag
title: Fine-Tuning + RAG
tier: expert
difficulty: expert
estimated_minutes: 30
module: optimization
prerequisites: [advanced_retrieval, llm_foundations]
tags: [fine-tuning, raft, lora, embedding-fine-tuning, domain-adaptation]
---

## Concept Introduction
The false dichotomy is "fine-tune or RAG." The frontier is combining them. Fine-tuning teaches the model your domain vocabulary, output format, and reasoning patterns. RAG supplies fresh, specific, verifiable facts at inference time. Together they produce answers that are both stylistically native to your domain and factually grounded in retrieved evidence. The orchestration question is which model parameters to fine-tune (the full LLM, the embedding model, or both) and which retrieval architecture to pair with the fine-tuned model.

## How It Works
**When to fine-tune vs when to RAG:** If the failure mode is format (wrong output structure, wrong tone, wrong terminology), fine-tune. If the failure mode is facts (outdated information, missing knowledge), RAG. If you have a high-quality dataset of 500+ domain-specific (question, retrieved_context, answer) triples, consider RAFT — it trains the model to distinguish between relevant and irrelevant retrieved context, directly addressing the "LLM ignores retrieval" problem.

**RAFT (Retrieval-Augmented Fine-Tuning)** by Zhang et al. (2024) trains the model on `(question, gold_answer, retrieved_docs)` triples where a fraction of the retrieved documents are "distractor" documents (irrelevant to the question) and a fraction are "oracle" documents (containing the answer). The model learns to (a) extract answer-relevant information from a mixed-quality retrieval set, and (b) cite its sources. Training data construction: take a QA dataset, retrieve top-K documents for each question, label which documents contain the answer, and randomly swap in distractor documents for 20-40% of the oracle positions.

**Embedding model fine-tuning** adapts a base embedding model (e.g., BGE, E5, GTE) to your domain's semantics. The training data is (query, positive_passage, negative_passage) triples. Contrastive loss pulls the query and positive passage closer while pushing negatives apart. With as few as 1,000 domain-specific triples, fine-tuned embeddings can improve retrieval recall@10 by 10-30 points over the base model.

**LoRA for domain adaptation** (Low-Rank Adaptation, Hu et al., 2021) fine-tunes LLMs by training small adapter matrices (typically 0.1-1% of the original parameters) while freezing the base weights. For RAG, LoRA adapters are trained on domain QA data and swapped at inference time. A single base model deployment can serve 50 domains by swapping LoRA weights — the deployment cost savings are dramatic compared to serving 50 full fine-tuned models.

**The architecture decision tree:** (1) If retrieval recall is the bottleneck, fine-tune the embedding model. (2) If the LLM ignores or misuses retrieved context, use RAFT. (3) If domain terminology and output format are the bottleneck, use LoRA fine-tuning on domain QA pairs. (4) For maximum performance, do all three: fine-tuned embeddings + RAFT-trained LLM + domain LoRA.

## Code Examples

```python
from transformers import AutoModel, AutoTokenizer
import torch
import torch.nn.functional as F

def fine_tune_embedding_model(base_model_name: str, training_triples: list[dict],
                              epochs: int = 3, lr: float = 2e-5) -> AutoModel:
    """Fine-tune a sentence embedding model with contrastive loss."""
    model = AutoModel.from_pretrained(base_model_name)
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    model.train()

    for epoch in range(epochs):
        total_loss = 0.0
        for batch in _chunk(training_triples, 16):
            queries = [t["query"] for t in batch]
            positives = [t["positive"] for t in batch]
            negatives = [t["negative"] for t in batch]
            # Encode all
            q_emb = _mean_pool(_encode(model, tokenizer, queries))
            p_emb = _mean_pool(_encode(model, tokenizer, positives))
            n_emb = _mean_pool(_encode(model, tokenizer, negatives))
            # Contrastive loss: pull positives, push negatives
            pos_score = (q_emb * p_emb).sum(dim=1)
            neg_score = (q_emb * n_emb).sum(dim=1)
            loss = F.margin_ranking_loss(
                pos_score, neg_score,
                target=torch.ones_like(pos_score), margin=0.5
            )
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
            total_loss += loss.item()
        print(f"Epoch {epoch}: loss={total_loss:.4f}")
    return model

def _mean_pool(last_hidden_state, attention_mask=None):
    if attention_mask is not None:
        mask = attention_mask.unsqueeze(-1).float()
        return (last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1)
    return last_hidden_state.mean(dim=1)

def _encode(model, tokenizer, texts: list[str]):
    tokens = tokenizer(texts, padding=True, truncation=True, return_tensors="pt", max_length=512)
    with torch.no_grad():
        output = model(**tokens)
    return output.last_hidden_state, tokens.get("attention_mask")

def _chunk(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i+n]

# RAFT data construction pattern
def build_raft_dataset(qa_pairs: list[dict], retriever, docs_corpus: list[str]) -> list[dict]:
    """Build RAFT training data: question + mixed oracle/distractor docs + answer."""
    dataset = []
    for qa in qa_pairs:
        retrieved = retriever(qa["question"], top_k=5)
        oracle_docs = [d for d in retrieved if qa["answer"] in d]
        distractor_docs = [d for d in retrieved if qa["answer"] not in d]
        # Mix: keep 60% oracle, replace 40% with distractors
        import random
        mixed = oracle_docs[:3] + random.sample(distractor_docs, min(2, len(distractor_docs)))
        random.shuffle(mixed)
        dataset.append({
            "question": qa["question"],
            "documents": mixed,
            "answer": qa["answer"],
            "oracle_indices": [i for i, d in enumerate(mixed) if d in oracle_docs]
        })
    return dataset
```

## Try It Yourself
Take a base RAG system (e.g., BGE-small-en + Llama-3-8B) on a domain-specific QA dataset (BioASQ for biomedical, or a custom dataset from your domain). Run three experiments: (a) baseline — no fine-tuning, (b) fine-tuned embeddings only, (c) fine-tuned embeddings + LoRA adapter on the LLM, (d) full RAFT training on the LLM. Measure retrieval recall@5, answer accuracy, and hallucination rate (claims not supported by retrieved context). Determine which combination gives the best accuracy-per-dollar.

## Real-World RAG Connection
RAFT was developed at Together AI and has been validated on biomedical and legal QA benchmarks. LoRA adapters are the production standard at companies serving multiple enterprise customers from a single model deployment. Embedding fine-tuning with Matryoshka representation learning (Google) enables a single fine-tuned embedding to serve multiple dimensionality targets. The cutting edge is continual fine-tuning — updating LoRA weights from user feedback without full retraining — enabling RAG systems that improve from every interaction.

## Common Pitfalls
**Pitfall:** Fine-tuning the embedding model on synthetic data generated by an LLM that does not understand your domain produces embeddings that overfit to the synthetic data's distribution and fail on real queries. **Fix:** Use real user queries and real document passages for training. If you lack real data, start with synthetic, deploy, collect real query logs, and re-fine-tune on real data. Synthetic is bootstrapping, not the final product.

**Pitfall:** LoRA fine-tuning on a small dataset (< 500 examples) produces a model that overfits — it memorizes the training answers instead of learning to reason from retrieved context. **Fix:** Monitor the training loss and validation loss divergence. Use LoRA rank r=8 or lower, add dropout to the adapter (0.1-0.2), and generate more training data via augmentation if needed. A validation perplexity that stops improving is your stop signal.

**Pitfall:** RAFT training teaches the model to always trust retrieved documents, so when retrieval returns all-distractor results, the model confidently produces hallucinated answers from irrelevant text. **Fix:** Include "no oracle" training examples — questions where all retrieved documents are distractors and the correct answer is "The provided documents do not contain sufficient information to answer this question." This teaches refusal.

## Next Steps
Read the RAFT paper (Zhang et al., 2024). Study the LoRA paper (Hu et al., 2021). Take longctx_vs_rag to understand when long-context models make retrieval unnecessary.
