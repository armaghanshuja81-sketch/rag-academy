---
id: html_tags
title: Common HTML Tags
tier: junior
difficulty: beginner
estimated_minutes: 15
module: html
prerequisites: [html_structure]
tags: [html, tags, web]
---

## Concept Introduction

HTML has ~100 tags, but you'll use about 15 of them 95% of the time. Knowing
which tag to reach for — heading, paragraph, link, list, container — is the
difference between clean, accessible markup and a mess. By the end of this
lesson you'll know the core tags, their attributes, and when to use each.

## How It Works

Tags fall into two categories: **block-level** elements that start on a new
line and take full width (`<div>`, `<p>`, `<h1>`-`<h6>`, `<ul>`, `<section>`),
and **inline** elements that flow within text (`<span>`, `<a>`, `<strong>`,
`<em>`, `<code>`).

Headings (`<h1>` through `<h6>`) define the document outline. Use them in
order — one `<h1>` per page, `<h2>` for major sections, `<h3>` for sub-sections.
Screen readers use headings for navigation, and search engines weight heading
text higher than body text.

Links (`<a>`) use the `href` attribute for the destination. Images (`<img>`)
use `src` for the file location and `alt` for text description (required for
accessibility).

## Code Examples

Text and structure:

```html
<h1>RAG Pipeline Documentation</h1>
<h2>Ingestion</h2>
<p>Documents are loaded, <strong>chunked</strong>, and <em>embedded</em>
before being stored in the vector database.</p>
<p>Key config: <code>chunk_size=512</code> and <code>overlap=50</code>.</p>
```

Lists — ordered and unordered:

```html
<h3>Pipeline Steps</h3>
<ol>
    <li>Load documents from disk or URL</li>
    <li>Split into chunks with overlap</li>
    <li>Generate embeddings for each chunk</li>
    <li>Store in vector database</li>
</ol>

<h3>Supported Formats</h3>
<ul>
    <li>Plain text (.txt)</li>
    <li>HTML pages (.html)</li>
    <li>PDF documents (.pdf)</li>
</ul>
```

Links, images, and containers:

```html
<a href="https://python.org" target="_blank" rel="noopener">
    Python Official Site
</a>

<img src="rag-diagram.png" alt="Diagram showing RAG pipeline: query → retrieve → augment → generate" width="600">

<div class="result-card">
    <h3>Result 1</h3>
    <p>Relevance score: <span class="score">0.91</span></p>
</div>
```

## Try It Yourself

Build the HTML for a search result page with 2 results. Each result needs a
title (link), a snippet paragraph, a relevance score badge, and a list of
matched keywords. Use the correct semantic tags:

```html
<h2>Search Results for "vector database"</h2>
<article class="result">
    <h3><a href="/docs/vectordb">Vector Database Fundamentals</a></h3>
    <p>Learn how vector databases store embeddings for semantic search...</p>
    <span class="badge">Score: 0.94</span>
    <ul>
        <li>embeddings</li>
        <li>semantic search</li>
    </ul>
</article>
<!-- Add a second result with different content -->
```

## Real-World RAG Connection

When you build a RAG frontend, every retrieved result is rendered as HTML
using exactly these tags. The result title goes in an `<h3>` inside an `<a>`.
The snippet goes in a `<p>`. The relevance score goes in a `<span>`. Source
citations go in a `<ul>`. HTML tags are the rendering layer between your
retriever's JSON output and the user's browser.

## Common Pitfalls

- **Pitfall:** Skipping heading levels — jumping from `<h1>` to `<h3>` breaks
  the document outline. **Fix:** Don't choose heading levels for their font
  size; use CSS for sizing and HTML for structure.
- **Pitfall:** Missing `alt` text on images — screen readers get nothing.
  **Fix:** Every `<img>` needs `alt=""` (empty for decorative, descriptive
  for content).
- **Pitfall:** Using `<div>` for everything — `<div>` has no semantic meaning.
  **Fix:** Ask "what IS this?" — if it's a paragraph, use `<p>`. If it's a
  navigation area, use `<nav>`. If it's truly just a grouping wrapper, then
  `<div>` is correct.

## Next Steps

- **Practice:** Take any Wikipedia article, view its source, and identify at
  least 10 different tag types. Notice how few unique tags are actually used.
- **Read:** [MDN HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- **Related:** [html_forms](/lesson/html_forms) — the tags that send user data
  to your backend
