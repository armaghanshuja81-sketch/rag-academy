---
id: css_layout
title: CSS Layout (Flexbox & Grid)
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: web
prerequisites: [css_box_model]
tags: [css, flexbox, grid, layout]
---

## Concept Introduction

Flexbox and Grid are the two CSS layout engines you will use on every page.
Flexbox handles one-dimensional layouts (rows OR columns). Grid handles
two-dimensional layouts (rows AND columns simultaneously). By the end of this
lesson you will build a card grid, a centered hero section, a sidebar layout,
and know when to reach for each tool.

## How It Works

Flexbox works along a single axis. You declare `display: flex` on a container,
and its children (flex items) align along the main axis (default: horizontal,
left-to-right). The cross axis runs perpendicular. Key properties:
- `flex-direction`: row (default) or column — sets the main axis
- `justify-content`: aligns items along the main axis (start, center, end,
  space-between, space-around)
- `align-items`: aligns items along the cross axis (stretch, center, start, end)
- `gap`: spacing between items — replaces margin hacks
- `flex` on children: `flex: 1` means "take remaining space"; `flex: 0 0 300px`
  means "don't grow, don't shrink, stay 300px"

Grid works on two axes. You declare `display: grid` on a container and define
explicit columns and rows. Key properties:
- `grid-template-columns`: defines column widths — `1fr 2fr` means "1 fraction
  unit and 2 fraction units"
- `grid-template-rows`: defines row heights
- `fr` unit: a fraction of available space. `repeat(3, 1fr)` = three equal
  columns
- `gap`: spacing between grid cells
- `grid-column` / `grid-row` on children: span multiple cells

The decision rule: one dimension = Flexbox, two dimensions = Grid, simple
stacking = no layout engine needed (block flow). Flexbox also wins for
centering a single item and for toolbars/navigation where items need to wrap.

## Code Examples

Flexbox — horizontal card row with wrapping:

```css
.card-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
}

.card {
    flex: 0 1 300px;      /* Don't grow, can shrink, base 300px */
    padding: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}
```

```html
<div class="card-row">
    <div class="card">
        <h3>Retrieval</h3>
        <p>Find relevant documents using vector similarity search.</p>
    </div>
    <div class="card">
        <h3>Generation</h3>
        <p>Feed retrieved context to an LLM for grounded answers.</p>
    </div>
    <div class="card">
        <h3>Evaluation</h3>
        <p>Measure faithfulness and relevance with metrics like RAGAS.</p>
    </div>
</div>
```

Flexbox — centered hero section (the most common flex pattern):

```css
.hero {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    text-align: center;
    padding: 40px 20px;
    gap: 16px;
}

.hero h1 { margin: 0; font-size: 2.5rem; }
.hero p { max-width: 600px; margin: 0; color: #6b7280; }
```

```html
<section class="hero">
    <h1>Build RAG Applications That Work</h1>
    <p>Learn retrieval-augmented generation end-to-end — from Python to production.</p>
    <button style="padding: 12px 32px; background: #3b82f6; color: white;
                   border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
        Start Learning
    </button>
</section>
```

Flexbox — sidebar + main layout (two columns, sidebar fixed, main flexible):

```css
.layout {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    flex: 0 0 260px;       /* Don't grow, don't shrink, fixed 260px */
    background: #1e293b;
    color: #e2e8f0;
    padding: 24px;
}

.main {
    flex: 1;               /* Take all remaining space */
    padding: 32px;
    overflow-y: auto;
}
```

```html
<div class="layout">
    <nav class="sidebar">
        <h2>RAG Academy</h2>
        <ul style="list-style: none; padding: 0;">
            <li>Python Basics</li>
            <li>Vector Databases</li>
            <li>RAG Pipeline</li>
        </ul>
    </nav>
    <main class="main">
        <h1>Welcome to RAG Academy</h1>
        <p>Your curriculum content here...</p>
    </main>
</div>
```

Grid — card gallery (2D layout, rows AND columns):

```css
.gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 20px;
}

.gallery-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    background: white;
}
```

Grid — dashboard layout with spanning items:

```css
.dashboard {
    display: grid;
    grid-template-columns: 250px 1fr 1fr;
    grid-template-rows: auto 1fr 1fr;
    gap: 16px;
    min-height: 100vh;
    padding: 16px;
}

.header  { grid-column: 1 / -1; }          /* Span all columns */
.sidebar { grid-row: 2 / -1; }             /* Span all remaining rows */
.stats   { grid-column: 2 / -1; }          /* Span columns 2-3 */
```

```html
<div class="dashboard">
    <header class="header" style="background: #1e293b; color: white; padding: 16px; border-radius: 8px;">
        RAG Pipeline Monitor
    </header>
    <nav class="sidebar" style="background: #f8fafc; padding: 16px; border-radius: 8px;">
        Navigation
    </nav>
    <div class="stats" style="background: #dbeafe; padding: 16px; border-radius: 8px;">
        Throughput: 42 req/s | Latency p95: 340ms | Cache hit: 78%
    </div>
    <div style="background: white; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        Query Log
    </div>
    <div style="background: white; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        Error Rates
    </div>
</div>
```

## Try It Yourself

Build a RAG search results page layout:
1. A sticky header with logo and search bar (Flexbox, horizontal)
2. Below the header, a sidebar with filter checkboxes (fixed 250px) and a main
   area with result cards (Grid, auto-fill columns)
3. Each result card shows: title, snippet, relevance score badge, and source URL
4. The layout must work from 320px (mobile) to 1440px (desktop)

```css
.results-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.header-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 24px;
    background: #1e293b;
    color: white;
    position: sticky;
    top: 0;
    z-index: 10;
}

.search-input {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
}

.content-area {
    display: flex;
    flex: 1;
}

.filter-sidebar {
    flex: 0 0 250px;
    padding: 20px;
    background: #f8fafc;
    border-right: 1px solid #e5e7eb;
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    padding: 24px;
    flex: 1;
}

/* On narrow screens, stack sidebar above results */
@media (max-width: 768px) {
    .content-area {
        flex-direction: column;
    }
    .filter-sidebar {
        flex: 0 0 auto;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
    }
}
```

## Real-World RAG Connection

Every RAG application has a user interface. The search results page, the
dashboard that monitors embedding throughput, the admin panel that manages
collections — all of them use Flexbox and Grid for layout. If your sidebar
causes the main content to overflow off-screen, users cannot read retrieved
results. If your result cards don't wrap on mobile, the application is
unusable. Layout is not decoration — it directly affects whether users can
consume and act on the answers your RAG pipeline produces.

## Common Pitfalls

- **Pitfall:** Using Flexbox for a full-page grid when Grid is the better tool.
  Nested flex containers with percentage widths are harder to reason about.
  **Fix:** If you are writing `display: flex` three levels deep to create a
  tabular layout, switch to Grid.
- **Pitfall:** Forgetting `flex-wrap: wrap` on a card row, causing cards to
  squeeze smaller than `min-width` or overflow the container. **Fix:** Always
  pair `display: flex` with `flex-wrap: wrap` when the number of items is
  unknown (search results, user-generated lists).
- **Pitfall:** Using fixed pixel widths in grid columns (`grid-template-columns:
  300px 1fr`) without a mobile fallback. On a 320px phone, 300px leaves 20px
  for the main content area. **Fix:** Use `minmax()` or a media query to
  restack the layout on narrow viewports.

## Next Steps

- **Practice:** Rebuild the layout of Google's search results page (or any
  search engine) using Flexbox and Grid. Match the header, sidebar filters,
  and result card grid.
- **Read:** [CSS Tricks Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and
  [CSS Tricks Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- **Related:** [ui_mockup](/lesson/ui_mockup) — combine your layout skills
  with polished visual design for a complete RAG dashboard
