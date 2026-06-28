---
id: rag_eval_adv
title: Advanced RAG Evaluation
tier: senior
difficulty: advanced
estimated_minutes: 25
module: production
prerequisites: [rag_observe]
tags: [evaluation, ragas, faithfulness, metrics, statistical-significance]
---

## Concept Introduction

A RAG system that "looks fine" in manual testing can drift silently: retrieval starts missing relevant documents, generation begins hallucinating, or the tone shifts toward hedging. Automated evaluation catches these degradations before users do. But not all evaluation metrics measure what you think they do. This lesson covers the RAGAS metric suite, what each metric actually captures, human eval protocols, and how to determine whether an improvement is statistically real.

## How It Works

RAGAS (RAG Assessment) defines a set of metrics that measure different failure modes. Faithfulness measures whether the generated answer can be inferred from the retrieved context alone -- a faithful answer contains no hallucinations but might be incomplete. Answer relevancy measures whether the answer addresses the question, penalizing correct-but-irrelevant responses. Context precision measures what fraction of retrieved chunks were actually relevant; context recall measures what fraction of all relevant chunks were retrieved. The critical insight: faithfulness and answer relevancy are about generation quality; context precision and recall are about retrieval quality. You must track both.

Human eval remains the gold standard, but it is expensive. The protocol that balances cost and reliability: have two annotators rate each answer on a 1-5 Likert scale for correctness, completeness, and tone. Inter-annotator agreement below 0.7 (Cohen's kappa) means your criteria are ambiguous. Run human eval once per sprint on 100 queries sampled from production traffic, not hand-picked cherry cases. Hand-picked queries inflate scores by 15-30% because they exclude the messy real-world queries that actually stress the system.

Statistical significance is non-negotiable for A/B comparisons. If your new reranker improves the mean RAGAS score from 0.82 to 0.84 on 50 test queries, a paired t-test tells you whether that difference is real or noise. With a sample of 50, you need roughly a 0.03 delta for significance at p<0.05. If your improvement is 0.01 on 50 queries, either collect more data or accept that the change is not proven better.

## Code Examples

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

eval_data = Dataset.from_dict({
    "question": ["What is the return policy?", "How do I reset my password?"],
    "answer": ["30-day return policy for unused items...", "Go to Settings..."],
    "contexts": [["Return policy: 30 days, unused condition..."], ["Password reset: Settings > Security > Reset..."]],
    "ground_truth": ["You can return items within 30 days if unused.", "Navigate to Settings, then Security, then Reset Password."],
})

result = evaluate(eval_data, metrics=[
    faithfulness, answer_relevancy, context_precision, context_recall
])
print(result)
# {'faithfulness': 0.92, 'answer_relevancy': 0.88,
#  'context_precision': 0.85, 'context_recall': 0.79}
```

```python
from scipy.stats import ttest_rel

def compare_models(baseline_scores: list[float], candidate_scores: list[float], alpha: float = 0.05):
    t_stat, p_value = ttest_rel(candidate_scores, baseline_scores)
    mean_delta = sum(candidate_scores) / len(candidate_scores) - sum(baseline_scores) / len(baseline_scores)
    significant = p_value < alpha
    return {"p_value": p_value, "mean_delta": mean_delta, "significant": significant}

# Only ship the improvement if significant
result = compare_models(baseline_scores, new_retriever_scores)
if result["significant"] and result["mean_delta"] > 0:
    deploy(new_retriever)
```

## Try It Yourself

Set up a RAGAS evaluation pipeline against your own RAG endpoint. Build a dataset of 50 question/ground-truth pairs from real user logs (not hand-written). Run the evaluation, then deliberately degrade your retriever (e.g., reduce top_k from 20 to 3) and run again. Verify that context_precision and context_recall drop measurably. Then restore the retriever, intentionally alter the system prompt to produce more verbose answers, and verify that faithfulness drops while answer_relevancy stays flat.

## Real-World RAG Connection

A fintech RAG system runs RAGAS evaluation on 200 production queries every night. When context_recall dropped from 0.81 to 0.73 after a reindex, the automated alert triggered. The team discovered that a chunk-size change from 512 to 256 tokens had fragmented key documents, causing retrieval to miss critical context. They reverted the change within hours, before user reports accumulated.

## Common Pitfalls

- **Evaluating on synthetic or hand-picked queries.** These are consistently easier than real user queries. Your 0.95 faithfulness score on synthetic data may correspond to 0.72 on production traffic. Always evaluate on a sample from actual user logs.
- **Tracking a single metric.** Faithfulness alone misses retrieval failures; context precision alone misses hallucinations. Always track at least one retrieval metric and one generation metric.
- **Ignoring inter-annotator agreement in human eval.** If two people rate the same answer 5/5 and 2/5, your eval criteria are broken. Fix the rubric, not the annotation.

## Next Steps

- RAGAS documentation for custom metric definitions
- Lesson: **Deploying RAG to Production** for automated eval in CI/CD
