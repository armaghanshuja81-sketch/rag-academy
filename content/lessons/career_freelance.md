---
id: career_freelance
title: Freelancing as an AI Engineer
tier: bonus
difficulty: intermediate
estimated_minutes: 25
module: career
prerequisites: [career_portfolio]
tags: [career, freelance, pricing]
---

## Concept Introduction

Companies need RAG systems now and cannot hire fast enough. Freelance AI
engineers fill that gap at rates of $100-$250/hour. By the end of this lesson
you will know which platforms to use, how to price a RAG project, how to scope
it to avoid scope creep, and what contract terms protect your work.

## How It Works

**Platform selection** depends on your target client. Upwork and Freelancer work
for small-to-mid clients ($2K-$10K projects) but you compete on price. Toptal
and Turing screen rigorously and match you with well-funded startups ($15K-$50K
projects). For the highest rates, skip platforms entirely: post your portfolio
project on LinkedIn and Hacker News, write technical breakdowns of RAG
architecture decisions, and let clients come inbound. Inbound leads close at
2-3x the rate of platform bids.

**Pricing RAG projects** ranges from $5K to $50K based on scope, not effort.
A basic semantic search over a client's docs with a chat interface costs
$5K-$8K. Add authentication, multi-tenant data isolation, and an admin dashboard
and you are at $15K-$25K. An agentic RAG system with tool use, SQL+vector hybrid
retrieval, and evaluation pipelines justifies $35K-$50K. Never charge hourly for
project work -- clients fixate on the clock. Charge per deliverable with clear
acceptance criteria.

**Scoping** makes or breaks freelance projects. Define exactly: data sources
(format, volume, update frequency), retrieval behavior (k, threshold, hybrid
search yes/no), UI surface (chat only, dashboard, admin panel), deployment
target (VPC, cloud, on-prem), and evaluation criteria (hit rate >= 85%,
latency < 500ms). Anything not in the scope document is a change order --
bill it separately.

**Contracts and IP:** Always use a written agreement. Specify that you retain
ownership of all generic code (retriever, chunker, evaluation harness) and
the client owns the trained model and deployment-specific configuration. This
lets you reuse your toolkit across clients. Require 50% upfront for first-time
clients. Define a kill fee (25% of remaining contract) for early termination.

Repeat business comes from two things: delivering on time without drama, and
leaving behind a monitoring dashboard the client checks daily. A Slack alert
when retrieval latency spikes is worth more than any feature you could add.

## Code Examples

Freelance project starter template -- a scoped RAG engagement agreement:

```python
"""
RAG Project Scope Calculator — Estimate price from requirements.
Use this to generate proposals quickly.
"""

PROJECT_TIERS = {
    "basic_search": {
        "features": ["semantic search", "chat UI", "single data source"],
        "price_range": (5000, 8000),
        "weeks": 2
    },
    "multi_tenant": {
        "features": ["basic_search + auth", "multi-tenant", "admin panel"],
        "price_range": (15000, 25000),
        "weeks": 6
    },
    "agentic_rag": {
        "features": ["multi_tenant + tool use", "hybrid retrieval", "eval pipeline"],
        "price_range": (35000, 50000),
        "weeks": 12
    }
}

def estimate_project(features: list[str], data_sources: int, users: int):
    # Score complexity on 3 axes
    complexity_score = (
        len(features) * 2 +
        data_sources * 3 +
        (users // 100) * 2
    )
    if complexity_score < 10:
        tier = PROJECT_TIERS["basic_search"]
    elif complexity_score < 25:
        tier = PROJECT_TIERS["multi_tenant"]
    else:
        tier = PROJECT_TIERS["agentic_rag"]

    low, high = tier["price_range"]
    print(f"Recommended tier: {tier['features'][0]}")
    print(f"Price: ${low:,} - ${high:,}")
    print(f"Timeline: {tier['weeks']} weeks")
    return tier

# Example: client with 3 data sources, 500 users, wants auth + search
estimate_project(
    features=["semantic_search", "auth", "admin_dashboard"],
    data_sources=3,
    users=500
)
```

## Try It Yourself

Draft a one-page proposal for a fictional client. Include: problem statement
(2 sentences), solution summary (3 sentences), tech stack, deliverables (bulleted
list with concrete acceptance criteria), timeline (weeks), price, and payment
terms. Send it to a friend for a red-team review -- ask them to find every
ambiguity a client could exploit.

## Real-World RAG Connection

A real freelance engagement from Q1 2025: a legal tech startup needed RAG over
10,000 case law PDFs with citation-aware retrieval. Scope: chunk by section,
embed with legal-domain model, hybrid BM25+dense retrieval, deployed on AWS with
VPC isolation. Price: $42K over 10 weeks. The freelancer reused their retriever
and eval harness from a previous project, cutting build time by 40%. That reuse
margin is the business model.

## Common Pitfalls

- **Pitfall:** Quoting a flat fee before you have seen the data. Messy,
  inconsistent, or sensitive client data can triple the build time. **Fix:**
  Require a data sample before quoting. Include a data quality clause: if data is
  not as described, the timeline and price adjust.
- **Pitfall:** Working without a kill fee. Clients cancel or pivot and you hold
  an unfinished project you cannot show and did not get fully paid for.
  **Fix:** Contract states 50% upfront, 25% at midpoint deliverable, 25% on
  completion. If client cancels, you keep all paid amounts plus a 25% kill fee.
- **Pitfall:** Over-customizing per client to the point where nothing is
  reusable. **Fix:** Build a core RAG toolkit (chunker, retriever, eval) that
  you own and reuse. Client-specific work is configuration, not from-scratch.

## Next Steps

- **Practice:** Set up a profile on one platform (Toptal for quality, Upwork for
  volume). Write your headline as "AI Engineer — RAG Systems & LLM Applications."
  Bid on one project this week.
- **Read:** [The Freelancer's Bible](https://www.freelancersunion.org/resources/)
  for contract templates and rate negotiation.
- **Related:** [career_portfolio](/lesson/career_portfolio) -- your portfolio
  project is the only thing clients evaluate before hiring you
