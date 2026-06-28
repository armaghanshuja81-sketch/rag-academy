---
id: css_selectors
title: CSS Selectors & Properties
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: css
prerequisites: [html_tags]
tags: [css, selectors, styling]
---

## Concept Introduction

CSS selectors target HTML elements for styling. Understanding selectors means
you can style any element without adding classes everywhere, and it's the same
skill used by web scrapers to extract content from HTML pages. By the end of
this lesson you'll use type, class, ID, attribute, and pseudo-class selectors
with specificity rules.

## How It Works

Selectors match elements in the DOM. The browser evaluates them from right to
left: `.result-card p` first finds all `<p>` elements, then filters to those
inside `.result-card`. Complex selectors are slower to evaluate but rarely
the bottleneck — network and rendering dominate.

Specificity determines which rule wins when multiple selectors match:
inline style (1000) > ID (100) > class/attribute/pseudo-class (10) >
type/pseudo-element (1). When specificity ties, source order breaks the tie.

Pseudo-classes match element states: `:hover`, `:focus-visible`, `:first-child`.
Pseudo-elements create virtual elements: `::before`, `::after`, `::marker`.

## Code Examples

```css
/* Type selector — all paragraphs */
p { line-height: 1.6; }

/* Class selector — elements with this class */
.result-card { border: 1px solid var(--border-color); }

/* Descendant — all <a> inside .result-card */
.result-card a { color: var(--color-accent); }

/* Child — only direct children */
.result-card > h3 { margin-top: 0; }

/* Attribute — inputs of type text */
input[type="text"] { padding: 0.5rem; }

/* Pseudo-classes */
.result-card:hover { border-color: var(--color-accent); }
li:first-child { font-weight: 600; }
li:nth-child(odd) { background: var(--surface-alt); }

/* Pseudo-elements */
.result-card::before { content: "🔍"; margin-right: 0.5rem; }
```

Specificity example:

```css
.result-card p { color: gray; }        /* Specificity: 0,0,1,1 */
.result-card .snippet { color: blue; } /* Specificity: 0,0,2,0 — wins */
```

## Try It Yourself

Write CSS to style a search results page:
1. Every `<article>` inside `<main>` gets a bottom border
2. The first `<article>` has a different background
3. Any `<mark>` inside a result gets highlighted yellow
4. Links that start with "https://" get an external link icon via `::after`

```css
main > article { border-bottom: 1px solid var(--border-color); padding: 1rem 0; }
main > article:first-child { background: var(--color-accent-light); }
.mark { background: #fef08a; padding: 0.125rem 0.25rem; }
a[href^="https://"]::after { content: " ↗"; font-size: 0.8em; }
```

## Real-World RAG Connection

When your RAG pipeline scrapes web content, you use CSS selectors to extract
specific elements: `article p` for body text, `nav a` for site structure,
`header` for titles. Tools like BeautifulSoup and Scrapy use CSS selector
syntax. The same selectors you learn for styling are your content extraction
tools.

## Common Pitfalls

- **Pitfall:** Over-qualifying selectors — `div.result-card p.snippet` is
  unnecessarily specific and hard to override. **Fix:** Use the minimum
  specificity needed: `.snippet`.
- **Pitfall:** Using IDs for styling — `#header` has specificity 100 and
  can't be reused on the same page. **Fix:** Use classes for styling, IDs
  for JavaScript hooks and fragment links.
- **Pitfall:** `!important` — it breaks the cascade and leads to `!important`
  wars. **Fix:** Restructure your selectors instead. Reserve `!important` for
  user style sheets and utility overrides.

## Next Steps

- **Practice:** Open any Wikipedia article, open DevTools, and write 5
  different selectors in the console that target different elements. Check
  with `document.querySelectorAll("your selector")`.
- **Read:** [MDN CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- **Related:** [css_box_model](/lesson/css_box_model) — how selectors interact
  with the box model for layout
