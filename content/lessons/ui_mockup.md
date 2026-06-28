---
id: ui_mockup
title: Building a Professional UI
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: web
prerequisites: [css_layout, html_forms]
tags: [html, css, ui, frontend, design]
---

## Concept Introduction

A professional interface is not decoration — it communicates trust, guides attention, and makes complexity manageable. Every RAG application needs a search interface, and that interface determines whether users trust the answers. By the end of this lesson you'll combine HTML and CSS into a polished search results page with a header, result cards, sidebar filters, and responsive layout.

## How It Works

Professional UIs are built on three principles: (1) **Design tokens** — CSS custom properties that define your entire visual language in one place; change `--color-primary` and every button, link, and accent updates. (2) **Component thinking** — a result card is one component; use it everywhere results appear, style it once. (3) **Responsive breakpoints** — the same HTML works on desktop and mobile because layout rules change at screen-width thresholds, not because you write different markup.

The mental model: your page is a composition of rectangular regions (header, sidebar, main content, footer). CSS Grid defines the overall layout; Flexbox handles alignment within each region. Together they replace the float and clearfix hacks that made CSS painful a decade ago.

Design tokens start in `:root` and flow down to every element. A result card gets `background: var(--color-surface)`, `border-radius: var(--radius-md)`, `padding: var(--space-md)`. When you redesign, you change values in one place.

## Code Examples

Design tokens as CSS custom properties:

```css
/* styles.css */
:root {
    --color-bg: #f8f9fa;
    --color-surface: #ffffff;
    --color-primary: #2563eb;
    --color-text: #1e293b;
    --color-text-muted: #64748b;
    --color-border: #e2e8f0;
    --color-score-high: #16a34a;
    --radius-md: 8px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --font-sans: system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
    line-height: 1.6;
}
```

Search results page with grid layout (header, sidebar, main):

```css
.page {
    display: grid;
    grid-template-columns: 280px 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
        "header header"
        "sidebar main";
    min-height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    gap: var(--space-lg);
}

.header {
    grid-area: header;
    padding: var(--space-md) 0;
}

.search-bar {
    display: flex;
    gap: var(--space-sm);
}

.search-bar input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
}

.search-bar button {
    padding: var(--space-sm) var(--space-lg);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
}

.sidebar {
    grid-area: sidebar;
    background: var(--color-surface);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
}

.main {
    grid-area: main;
}
```

Result card component:

```css
.result-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-bottom: var(--space-md);
}

.result-card h3 {
    font-size: 1.1rem;
    margin-bottom: var(--space-sm);
}

.result-card .snippet {
    color: var(--color-text-muted);
    font-size: 0.95rem;
    margin-bottom: var(--space-sm);
}

.result-card .footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.result-card .score {
    color: var(--color-score-high);
    font-weight: 600;
}
```

HTML structure:

```html
<div class="page">
    <header class="header">
        <form class="search-bar" action="/search" method="GET">
            <input type="text" name="q" placeholder="Search documents..."
                   value="vector databases">
            <button type="submit">Search</button>
        </form>
    </header>

    <aside class="sidebar">
        <h3>Filters</h3>
        <label><input type="checkbox" checked> PDF Documents</label><br>
        <label><input type="checkbox" checked> Markdown Notes</label><br>
        <label><input type="checkbox" checked> Web Pages</label>
    </aside>

    <main class="main">
        <p>12 results for <strong>"vector databases"</strong></p>

        <div class="result-card">
            <h3>FAISS Vector Search Guide</h3>
            <p class="snippet">FAISS is Meta's library for efficient similarity
            search and clustering of dense vectors. It supports multiple index
            types including Flat, IVF, and HNSW...</p>
            <div class="footer">
                <span>docs/faiss-guide.md</span>
                <span class="score">94% match</span>
            </div>
        </div>
    </main>
</div>
```

Responsive breakpoint — collapse sidebar below header on small screens:

```css
@media (max-width: 768px) {
    .page {
        grid-template-columns: 1fr;
        grid-template-areas:
            "header"
            "sidebar"
            "main";
    }

    .sidebar {
        display: flex;
        gap: var(--space-md);
        flex-wrap: wrap;
    }
}
```

## Try It Yourself

Build a search results page for a RAG application with the following requirements: (1) a header with the app name and a search bar, (2) three result cards showing title, snippet, source filename, and match percentage, (3) a sidebar with document-type checkboxes, (4) the layout uses CSS Grid and collapses to single-column at 600px. Start from the code above and customize the design tokens to create a distinct visual identity:

```css
:root {
    /* Change these five values to create your own design */
    --color-bg: #0f172a;          /* Dark background */
    --color-surface: #1e293b;     /* Card background */
    --color-primary: #38bdf8;     /* Accent color */
    --color-text: #f1f5f9;        /* Main text */
    --color-text-muted: #94a3b8;  /* Secondary text */
}
```

## Real-World RAG Connection

Every RAG application ships a search interface. The result card is where trust is built or broken: showing the source filename and a relevance score tells the user "here's where this answer came from, judge for yourself." A RAG app without source attribution is a black box that users abandon. The sidebar filters map to metadata filtering in your vector database — when a user unchecks "PDF Documents," your backend adds a `where` clause to the ChromaDB query. The UI and the retrieval pipeline are two halves of the same feature.

## Common Pitfalls

- **Pitfall:** Using pixel values for font sizes and spacing. `font-size: 16px` breaks when the user has browser zoom or accessibility settings. **Fix:** Use `rem` for font sizes (`font-size: 1rem`) and `em` or percentage for spacing so the UI scales with user preferences.
- **Pitfall:** Hardcoding colors in every component. When you have 47 instances of `#2563eb` across 12 CSS files, a rebrand takes a week. **Fix:** Define every color, spacing, and radius as a CSS custom property in `:root`. Reference the property everywhere. One file change redeploys your entire visual identity.
- **Pitfall:** Designing for desktop only. A two-column layout that looks great at 1440px is unusable at 375px with tiny text and hidden sidebar filters. **Fix:** Start mobile-first — write the single-column layout as the default, then add `@media (min-width: 768px)` to progressively enhance to two columns.

## Next Steps

- **Practice:** Add a dark/light mode toggle to your search page. Use a second set of design tokens under `[data-theme="dark"]` and a JavaScript button that toggles the `data-theme` attribute on `<html>`.
- **Read:** [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **Related:** [css_selectors](/lesson/css_selectors) — master the selector syntax that makes component styling precise and maintainable
