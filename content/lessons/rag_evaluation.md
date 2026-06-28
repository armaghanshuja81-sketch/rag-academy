---
id: rag_evaluation
title: RAG Evaluation
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: rag
prerequisites: [rag_pipeline_full]
tags: [rag, evaluation, ragas, metrics]
---

## Concept Introduction

You cannot improve what you cannot measure. RAG evaluation quantifies whether your pipeline retrieves the right documents and generates faithful answers. Without evaluation, every change — a new chunk size, a different embedding model, a prompt tweak — is a guess. By the end of this lesson you'll measure retrieval and generation quality, run RAGAS on your pipeline, and interpret the scores to decide what to fix next.

## How It Works

RAG evaluation splits into two dimensions: retrieval quality (did we find the right documents?) and generation quality (did the LLM use them correctly?).

**Retrieval metrics** compare retrieved document IDs against a ground-truth list of relevant documents:
- **Precision@k:** Of the k retrieved documents, what fraction are actually relevant? High precision means few irrelevant docs pollute the context.
- **Recall@k:** Of all relevant documents in the corpus, what fraction did we retrieve? High recall means we found most of what matters.
- **MRR (Mean Reciprocal Rank):** Where does the first relevant document appear? 1/rank. If the first relevant doc is at position 1, MRR = 1.0; at position 5, MRR = 0.2.
- **NDCG (Normalized Discounted Cumulative Gain):** Like MRR but accounts for multiple relevant documents and graded relevance scores.

**Generation metrics** evaluate the LLM's output without needing reference answers:
- **Faithfulness:** Does every claim in the answer appear in the retrieved context? A score of 0.9 means 90% of claims are grounded. This is the single most important metric for RAG.
- **Answer Relevancy:** Does the answer actually address the question? The LLM might produce a faithful but irrelevant answer.
- **Context Relevancy:** Are the retrieved documents relevant to the question? Distinct from retrieval precision — this considers semantic relevance, not binary labels.

RAGAS (RAG Assessment) automates these metrics by using an evaluator LLM to check faithfulness and relevancy. You provide questions, retrieved contexts, and generated answers; RAGAS returns a scorecard.

The evaluation loop is: measure baseline scores, diagnose the worst metric, make one change, remeasure. Never change multiple things between evaluations — you won't know which change caused the score movement.

## Code Examples

Build a small evaluation dataset and compute retrieval metrics manually:

```python
# Ground truth: for each query, which doc IDs should be retrieved
eval_set = [
    {"query": "What is FAISS?", "relevant": [0, 2]},
    {"query": "How do embeddings work?", "relevant": [1, 3, 5]},
    {"query": "Explain RAG architecture", "relevant": [4, 6]},
]

def precision_at_k(retrieved_ids, relevant_ids, k):
    retrieved_k = retrieved_ids[:k]
    return len(set(retrieved_k) & set(relevant_ids)) / k

def recall_at_k(retrieved_ids, relevant_ids, k):
    retrieved_k = retrieved_ids[:k]
    return len(set(retrieved_k) & set(relevant_ids)) / len(relevant_ids)

def mrr(retrieved_ids, relevant_ids):
    for rank, doc_id in enumerate(retrieved_ids, start=1):
        if doc_id in relevant_ids:
            return 1.0 / rank
    return 0.0

# Simulated retrieval — your actual retriever output
mock_retrievals = [
    [0, 3, 1, 5],  # For query 1
    [1, 0, 2, 3],  # For query 2
    [6, 4, 0, 1],  # For query 3
]

for i, (item, retrieved) in enumerate(zip(eval_set, mock_retrievals)):
    p3 = precision_at_k(retrieved, item["relevant"], k=3)
    r3 = recall_at_k(retrieved, item["relevant"], k=3)
    m = mrr(retrieved, item["relevant"])
    print(f"Query {i+1}: P@3={p3:.2f} R@3={r3:.2f} MRR={m:.2f}")
```

Running RAGAS on a RAG pipeline:

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_relevancy
from datasets import Dataset

# Data from your pipeline — replace with real outputs
eval_data = Dataset.from_dict({
    "question": [
        "What is FAISS?",
        "How do embeddings work?",
        "Explain RAG architecture",
    ],
    "answer": [
        "FAISS is Meta's vector search library for fast similarity search.",
        "Embeddings convert text into dense vectors that capture meaning.",
        "RAG has two pipelines: ingestion and query.",
    ],
    "contexts": [
        ["FAISS is Facebook AI Similarity Search, a library for efficient vector search."],
        ["Embedding models like text-embedding-3-small map text to 1536-dimensional vectors."],
        ["RAG architecture consists of an ingestion pipeline and a query pipeline."],
    ],
})

result = evaluate(
    eval_data,
    metrics=[faithfulness, answer_relevancy, context_relevancy],
)
print(result)
# Example output:
# faithfulness: 0.92, answer_relevancy: 0.87, context_relevancy: 0.78
```

Interpreting scores and deciding what to fix:

```python
def diagnose(result):
    scores = {m: result[m] for m in result}
    if scores.get("faithfulness", 1.0) < 0.7:
        return "ACTION: Improve prompt to constrain LLM to context. Add explicit 'do not guess' instruction."
    if scores.get("context_relevancy", 1.0) < 0.6:
        return "ACTION: Retrieved docs are not relevant. Try hybrid search or re-ranking."
    if scores.get("answer_relevancy", 1.0) < 0.7:
        return "ACTION: LLM drifts from question. Tighten prompt, reduce temperature."
    return "Scores look good. Run on a larger eval set to confirm."
```

## Try It Yourself

Create an eval set of 5 question-context-answer triples from your own RAG pipeline. Run RAGAS and compute faithfulness and answer relevancy. Then deliberately break your pipeline in one way (change k to 1, use a garbage prompt, or swap the embedding model) and rerun evaluation. Verify that the metric you expected to drop actually dropped:

```python
# Starter: create your eval Dataset
from datasets import Dataset

your_data = Dataset.from_dict({
    "question": ["..."],  # 5 real questions
    "answer": ["..."],    # Your pipeline's answers
    "contexts": [["..."]],  # Retrieved contexts for each question
})
```

## Real-World RAG Connection

Production RAG teams run evaluation on every pipeline change. Before deploying a new chunk size or embedding model, you run the eval suite against a golden dataset of 50-200 question/answer/context triples curated from real user queries. Faithfulness below 0.8 is a release blocker — it means your users are getting answers that aren't supported by your documents. The eval loop (measure, diagnose, improve, remeasure) turns RAG tuning from art into engineering.

## Common Pitfalls

- **Pitfall:** Evaluating with only 3-5 hand-picked questions that all happen to work well. Your scores look great but real users ask edge cases that fail. **Fix:** Build your eval set from real user queries or systematically varied synthetic questions covering different intents (factual, comparative, procedural, edge-case).
- **Pitfall:** Using `evaluate()` from RAGAS without setting LLM and embedding model explicitly. RAGAS defaults to GPT-3.5 for evaluation, which produces noisy scores. **Fix:** Pass `llm=ChatOpenAI(model="gpt-4o")` and `embeddings=OpenAIEmbeddings()` explicitly for consistent, reliable evaluation.
- **Pitfall:** Treating all metrics equally. A 0.95 faithfulness with 0.40 context relevancy means your LLM faithfully repeats irrelevant information — the worst possible outcome disguised by a good score. **Fix:** Always look at the full scorecard; context relevancy and faithfulness together tell you whether your RAG pipeline is actually working.

## Next Steps

- **Practice:** Run the same RAGAS evaluation twice — once with temperature=0.0 and once with temperature=0.7. Compare faithfulness scores and explain the difference.
- **Read:** [RAGAS Documentation](https://docs.ragas.io/en/latest/)
- **Related:** [rag_eval_adv](/lesson/rag_eval_adv) — advanced evaluation with human annotation, custom metrics, and continuous eval pipelines
