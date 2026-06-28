---
id: rag_benchmark
title: Benchmarking RAG Systems
tier: expert
difficulty: expert
estimated_minutes: 30
module: optimization
prerequisites: [advanced_retrieval]
tags: [benchmarks, beir, mteb, evaluation, statistical-testing, custom-benchmarks]
---

## Concept Introduction
You cannot improve what you do not measure. RAG benchmarking spans retrieval quality (did we find the right documents?), generation quality (did the LLM use them correctly?), and end-to-end accuracy (did the user get the right answer?). BEIR and MTEB are the standard retrieval benchmarks, but they measure retrieval in isolation. End-to-end RAG evaluation requires custom benchmarks that capture your domain, your documents, and your users' actual questions. The frontier is honest evaluation — measuring what matters, reporting uncertainty, and avoiding the benchmaxxing pathologies that inflate numbers without improving user experience.

## How It Works
**BEIR (Benchmarking IR)** evaluates retrieval models across 18 diverse datasets spanning biomedical, financial, QA, and fact-verification domains. Metrics: NDCG@10, Recall@100, MRR@10. BEIR is retrieval-only — it does not measure generation quality. A model that ranks well on BEIR may still produce bad end-to-end answers if the LLM misuses the retrieved passages.

**MTEB (Massive Text Embedding Benchmark)** expands BEIR to 58 datasets across 8 task categories: classification, clustering, pair classification, re-ranking, retrieval, STS, summarization, and bitext mining. MTEB measures embedding model quality across tasks, not just retrieval. It is the standard leaderboard for embedding model selection.

**Running evals** requires a test harness that: (a) loads a benchmark dataset, (b) runs retrieval for each query, (c) runs generation for the full RAG pipeline, (d) computes metrics, (e) reports with confidence intervals. The harness must be deterministic (fixed random seeds) and reproducible (versioned model weights, versioned benchmark data, pinned dependencies).

**Statistical comparison** between two RAG systems (e.g., embedding model A vs B) requires paired testing. For retrieval metrics, use a paired t-test or Wilcoxon signed-rank test on per-query metric differences. Report p-values and effect sizes (Cohen's d). A 0.5-point NDCG improvement with p=0.08 is not significant — do not ship it. The minimum detectable effect depends on your sample size; with 100 queries, you need roughly a 2-3 point difference to achieve statistical significance.

**Reporting results honestly** means: report on a held-out test set never used during development, disclose model versions and benchmark versions, report multiple metrics (not just the one that improved), include confidence intervals, and report per-category breakdowns (overall NDCG hides that you tanked on biomedical queries).

**Creating custom benchmarks** is necessary because public benchmarks do not capture your distribution. Collect 500+ real user queries from production logs. Have domain experts write ground-truth answers or relevance judgments. Split 70/15/15 into train/dev/test. The train set is for system development; the dev set for hyperparameter tuning; the test set for exactly one evaluation before launch.

## Code Examples

```python
import numpy as np
from scipy import stats
from typing import TypedDict

class BenchmarkResult(TypedDict):
    ndcg_at_10: float
    recall_at_100: float
    mrr_at_10: float
    per_query_metrics: list[dict]

def compute_retrieval_metrics(results: list[dict], k_values: list[int]) -> dict:
    """Compute NDCG, Recall, MRR from retrieval results."""
    metrics = {}
    for k in k_values:
        ndcg_scores, recall_scores, mrr_scores = [], [], []
        for res in results:
            relevant = set(res["relevant_doc_ids"])
            retrieved = [r["doc_id"] for r in res["retrieved"][:k]]
            # NDCG@k
            dcg = sum(1.0 / np.log2(i + 2) if doc in relevant else 0.0
                     for i, doc in enumerate(retrieved))
            ideal_size = min(len(relevant), k)
            idcg = sum(1.0 / np.log2(i + 2) for i in range(ideal_size))
            ndcg_scores.append(dcg / idcg if idcg > 0 else 0.0)
            # Recall@k
            recall = len(set(retrieved) & relevant) / len(relevant) if relevant else 0.0
            recall_scores.append(recall)
            # MRR@k
            for rank, doc in enumerate(retrieved):
                if doc in relevant:
                    mrr_scores.append(1.0 / (rank + 1))
                    break
            else:
                mrr_scores.append(0.0)
        metrics[f"ndcg@{k}"] = {"mean": np.mean(ndcg_scores), "std": np.std(ndcg_scores)}
        metrics[f"recall@{k}"] = {"mean": np.mean(recall_scores), "std": np.std(recall_scores)}
        metrics[f"mrr@{k}"] = {"mean": np.mean(mrr_scores), "std": np.std(mrr_scores)}
    return metrics

def paired_ttest(scores_a: list[float], scores_b: list[float],
                 metric_name: str) -> dict:
    """Compare two systems with a paired t-test and effect size."""
    diffs = [a - b for a, b in zip(scores_a, scores_b)]
    t_stat, p_value = stats.ttest_rel(scores_a, scores_b)
    cohens_d = np.mean(diffs) / np.std(diffs) if np.std(diffs) > 0 else 0.0
    ci = stats.t.interval(0.95, len(diffs) - 1,
                          loc=np.mean(diffs), scale=stats.sem(diffs))
    return {
        "metric": metric_name,
        "mean_a": np.mean(scores_a),
        "mean_b": np.mean(scores_b),
        "mean_diff": np.mean(diffs),
        "ci_95": ci,
        "p_value": p_value,
        "cohens_d": cohens_d,
        "significant": p_value < 0.05,
        "n_queries": len(scores_a)
    }

def report_results(system_results: dict[str, BenchmarkResult],
                   baseline_name: str) -> str:
    """Generate an honest evaluation report."""
    report = ["# RAG Benchmark Results\n"]
    baseline = system_results.pop(baseline_name)
    for sys_name, result in system_results.items():
        report.append(f"## {sys_name} vs {baseline_name}")
        for metric_name in ["ndcg@10", "recall@100", "mrr@10"]:
            test = paired_ttest(
                [q[metric_name] for q in baseline["per_query_metrics"]],
                [q[metric_name] for q in result["per_query_metrics"]],
                metric_name
            )
            sig = "SIGNIFICANT" if test["significant"] else "not significant"
            report.append(
                f"- {metric_name}: {test['mean_diff']:+.3f} "
                f"(CI: [{test['ci_95'][0]:.3f}, {test['ci_95'][1]:.3f}]), "
                f"p={test['p_value']:.4f}, d={test['cohens_d']:.2f} — {sig}"
            )
    return "\n".join(report)
```

## Try It Yourself
Build a RAG benchmark harness. Load the BEIR NFCorpus dataset (or any domain-relevant dataset). Evaluate five embedding models (BGE-small, BGE-large, E5-base, E5-large, GTE-base) on retrieval metrics. Run the full RAG pipeline with Llama-3-8B as the generator. Measure end-to-end answer accuracy using LLM-as-judge (use Claude or GPT-4 to score answers on faithfulness, relevance, completeness). Run paired statistical tests between each pair of models. Write a report that honestly presents which differences are statistically significant and which are noise. Create a small custom benchmark from 50 real queries and compare the ranking of models on BEIR vs your custom benchmark.

## Real-World RAG Connection
BEIR and MTEB are maintained by UKP Lab at TU Darmstadt and are the de facto standards for retrieval and embedding evaluation. The MTEB leaderboard on Hugging Face tracks over 200 embedding models. Production RAG teams at companies like Cohere and Anthropic maintain private evaluation sets built from customer data because public benchmarks do not capture production query distributions. The frontier is automated evaluation — using LLMs to generate ground-truth relevance judgments and answers at scale, validated against human annotations to ensure LLM-judge quality.

## Common Pitfalls
**Pitfall:** Evaluating on the same data you used to tune hyperparameters produces inflated scores that do not generalize. **Fix:** Three-way split (train/dev/test). The test set is touched exactly once — for the final report. If you look at test results and go back to tune, you have contaminated your test set and need a new one.

**Pitfall:** Reporting only overall metrics hides catastrophic failures on important subsets (e.g., factual accuracy on medical queries). **Fix:** Slice evaluation results by query type, topic, difficulty, and entity frequency. Report per-slice metrics. A 2-point overall NDCG improvement that comes with a 10-point drop on rare entities is a regression, not an improvement.

**Pitfall:** Using a different LLM for generation during evaluation than in production (e.g., evaluating with GPT-4 but deploying with Llama-3-8B). **Fix:** Evaluate the exact end-to-end pipeline that will be deployed — same retrieval model, same LLM, same prompt template, same generation parameters. Model substitution invalidates the benchmark for production decision-making.

## Next Steps
Read the BEIR paper (Thakur et al., 2021) and the MTEB paper (Muennighoff et al., 2022). Study the MTEB leaderboard on Hugging Face. Take rag_at_scale to learn how to benchmark and optimize RAG systems at production scale.
