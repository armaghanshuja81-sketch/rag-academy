---
id: career_guide
title: Career & Portfolio Guide
tier: bonus
difficulty: intermediate
estimated_minutes: 25
module: career
prerequisites: [career_portfolio]
tags: [career, guide, freelancing, portfolio]
---

## Concept Introduction

You've built the skills — now you need to turn them into income. This lesson
maps out the concrete path: what to build, where to find clients, what to
charge, and how to grow from side income to full-time AI engineering. By the
end, you'll have a 90-day plan and know exactly which portfolio projects move
the needle.

## How It Works

The AI engineering market values demonstrated capability over credentials.
Clients don't ask "what courses did you take?" — they ask "have you built
something like this before?" Your portfolio is your proof.

**The 5 portfolio projects that matter:**

1. **PDF Q&A Chatbot** (LangChain + Streamlit) — Upload a PDF, ask questions,
   get answers with source citations. This is the #1 requested RAG pattern.
   Deploy on HuggingFace Spaces (free). Timeline: 1 weekend.

2. **Multi-Document Research Assistant** — Ingest 50+ documents on a topic,
   compare information across sources, generate summaries with citations.
   Shows you understand scale and source attribution. Timeline: 3-4 days.

3. **YouTube Video RAG** — Paste a YouTube URL, the app downloads the
   transcript, chunks it, and lets you query specific moments. Shows you
   handle multi-modal input. Timeline: 1 weekend.

4. **Website Chat Widget** — A floating chat bubble that answers questions
   about any website's content. Demonstrates you can build embeddable,
   production-ready components. Timeline: 3-4 days.

5. **Full-Stack RAG SaaS** — User auth, document upload, per-user collections,
   query history. Flask/FastAPI backend, React frontend, Stripe billing
   (optional). This is the project that lands senior roles. Timeline: 2 weeks.

Don't build all five before you start earning. Build #1, ship it, then find
your first client while building #2.

**Earning timeline (realistic, not hype):**

- **Month 1 ($500-1,500):** Small projects on Upwork/Fiverr. You're building
  reputation. Take projects you can finish in 3-5 days. Price per project,
  not hourly — clients resist high hourly rates from new profiles.
- **Month 2 ($1,500-3,000):** You have 2-3 reviews. Raise rates 50%. Medium
  projects (RAG chatbots, internal search tools). Start posting build-in-public
  content on LinkedIn/Twitter — inbound leads begin.
- **Month 3 ($3,000-6,000):** Inbound leads + repeat clients. You can be
  selective. Raise rates again. At this point, consider whether to go full-time.
- **Month 6+ ($8,000-15,000+):** Specialized in a niche (legal RAG, e-commerce
  search, healthcare document processing). Direct clients, no platforms. Retainer
  contracts for maintenance.

**Where clients come from:**

| Channel | Effort | Lead Quality | Timeline |
|---------|--------|-------------|----------|
| Upwork/Fiverr | Low (bid on existing jobs) | Mixed | Immediate |
| LinkedIn posts | Medium (consistent posting) | Good | 4-8 weeks |
| Cold email to startups | High (research + personalization) | Best | 1-2 weeks |
| GitHub portfolio | Medium (SEO + sharing) | Good | Ongoing |
| Referrals | Zero (happens automatically) | Best | After 2-3 happy clients |

## Code Examples

Price calculator based on project complexity:

```python
def estimate_project(starting_price: int, factors: dict) -> dict:
    """
    factors: {
        "auth": bool,       # +20% if user login needed
        "deploy": bool,     # +15% if production deployment
        "scale": str,       # "small" (<1K docs), "medium" (<100K), "large" (100K+)
        "deadline_days": int, # <7 days → +30% rush fee
        "api_integration": bool,  # +15% if external API calls
    }
    """
    multiplier = 1.0
    breakdown = {"base": starting_price}

    if factors.get("auth"):
        multiplier += 0.20
        breakdown["auth"] = int(starting_price * 0.20)

    if factors.get("deploy"):
        multiplier += 0.15
        breakdown["deploy"] = int(starting_price * 0.15)

    scale_mult = {"small": 0.0, "medium": 0.30, "large": 0.60}
    scale_extra = scale_mult.get(factors.get("scale", "small"), 0.0)
    multiplier += scale_extra
    if scale_extra:
        breakdown["scale"] = int(starting_price * scale_extra)

    if factors.get("deadline_days", 30) < 7:
        multiplier += 0.30
        breakdown["rush"] = int(starting_price * 0.30)

    if factors.get("api_integration"):
        multiplier += 0.15
        breakdown["api_integration"] = int(starting_price * 0.15)

    total = int(starting_price * multiplier)
    breakdown["total"] = total
    breakdown["multiplier"] = round(multiplier, 2)
    return breakdown

# Example: RAG chatbot with auth, deployment, medium scale
price = estimate_project(3000, {
    "auth": True, "deploy": True, "scale": "medium",
    "deadline_days": 14, "api_integration": True
})
for k, v in price.items():
    print(f"  {k}: ${v}")
```

Portfolio project README template (the README sells you):

```markdown
# Project Name — One-line description of what it does

## What problem does this solve?
Two sentences. Be specific. "HR teams spend 4 hours/week answering
repeated policy questions. This chatbot reduces that to zero."

## Architecture
[Text diagram: User → Streamlit UI → FastAPI → ChromaDB → OpenAI]

## Quick Start
```bash
git clone ... && cd ... && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && streamlit run app.py
```

## Key Technical Decisions
- Chose ChromaDB over FAISS because: single-node deployment, no C++ deps
- Chose sentence-transformers over OpenAI embeddings because: free, offline, 384-dim is fast enough
- Chose Streamlit over React because: speed to MVP, audience is non-technical stakeholders

## Demo
[Link to deployed app OR screen recording GIF]
```

## Try It Yourself

1. Build project #1 (PDF Q&A Chatbot) this weekend. Ship it to HuggingFace
   Spaces. The goal is deployed, not perfect.

2. Write the README using the template above. Include a screen recording
   (Loom or OBS — under 2 minutes).

3. Create an Upwork profile. Find 3 RAG-related job posts. Write a proposal
   that references your deployed PDF chatbot: "I built exactly this — here's
   the live demo." You'll win 1 of 3 at minimum because 90% of proposals are
   generic copy-paste.

4. After your first paid project, write a LinkedIn post about what you built.
   Tag the client (with permission). This post becomes your inbound lead magnet.

## Real-World RAG Connection

The RAG engineers earning $150K+ aren't necessarily better coders — they're
better at demonstrating value. A portfolio project with a clean README, a
live demo, and a short walkthrough video communicates competence instantly.
When a startup CTO sees your PDF Q&A bot and thinks "that's exactly what we
need, but for our documentation," you've already won the project.

## Common Pitfalls

- **Pitfall:** Building too many projects, shipping none. Five half-finished
  repos signal the opposite of competence. **Fix:** Ship one project completely
  — README, demo, tests, deployed — before starting the next. One finished
  project is worth ten started ones.
- **Pitfall:** Underpricing to win clients. Charging $200 for a RAG chatbot
  attracts clients who don't value the work and will scope-creep endlessly.
  **Fix:** Start at $1,500 minimum for any RAG project. Clients who pay more
  are easier to work with and refer better clients.
- **Pitfall:** Waiting until you "know enough" to start freelancing. You'll
  never feel ready. **Fix:** Start when you can build project #1 end-to-end.
  You learn the rest on paid projects — which is faster and more motivating
  than courses.

## Next Steps

- **Action:** Build and deploy the PDF Q&A Chatbot this weekend
- **Read:** [career_interview](/lesson/career_interview) — common RAG interview questions
- **Read:** [career_freelance](/lesson/career_freelance) — detailed freelancing strategy
