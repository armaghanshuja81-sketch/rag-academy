---
id: html_structure
title: HTML Document Structure
tier: junior
difficulty: beginner
estimated_minutes: 15
module: html
prerequisites: [first_program]
tags: [html, web, structure]
---

## Concept Introduction

HTML is the skeleton of every web page. When your RAG pipeline scrapes a
website for documents, it's parsing HTML. When you build a UI for your RAG
app, it's HTML. By the end of this lesson you'll understand the document
structure, the role of each major element, and how browsers interpret HTML.

## How It Works

Every HTML document is a tree. The root is `<html>`, which contains `<head>`
(metadata, title, styles) and `<body>` (visible content). Browsers parse this
tree to build the DOM (Document Object Model) — the live representation of
the page that JavaScript can manipulate.

Tags come in pairs (`<p>` and `</p>`) or self-closing (`<img>`, `<br>`).
Attributes live inside the opening tag: `<a href="url">`. Nesting determines
parent-child relationships — a `<li>` must be inside a `<ul>` or `<ol>`.

The `<!DOCTYPE html>` declaration tells the browser to use standards mode
(instead of quirks mode, a legacy compatibility hack). Always include it.

## Code Examples

A minimal valid HTML document:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Search Results</title>
</head>
<body>
    <header>
        <h1>Search Results</h1>
    </header>
    <main>
        <article>
            <h2>What is Retrieval-Augmented Generation?</h2>
            <p>RAG combines information retrieval with text generation...</p>
        </article>
    </main>
    <footer>
        <p>Powered by RAG Academy</p>
    </footer>
</body>
</html>
```

Key structural elements and their purpose:

| Element | Purpose |
|---------|---------|
| `<header>` | Top section — logo, nav, title |
| `<main>` | Unique page content (one per page) |
| `<article>` | Self-contained piece of content |
| `<section>` | Thematic grouping with a heading |
| `<nav>` | Navigation links |
| `<footer>` | Bottom section — copyright, links |

## Try It Yourself

This HTML fragment has 3 structural issues. Find and fix them:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Untitled</title>
<body>
    <h2>Welcome</h2>
    <p>This is a paragraph.
    <li>Item without a list</li>
</body>
</html>
```

Issues: missing `</head>` closing tag, missing `</p>` closing tag, `<li>` not
wrapped in `<ul>` or `<ol>`. Fix them in a text editor and open the result in
your browser.

## Real-World RAG Connection

When your RAG pipeline scrapes web content, it doesn't see pretty rendered
pages — it sees raw HTML. The actual text content is buried inside tags,
attributes, and scripts. Understanding HTML structure lets you write precise
selectors to extract only the main content while skipping navigation, ads, and
footers. The `main` tag and `article` tag are your first filters — content
outside them is usually noise.

## Common Pitfalls

- **Pitfall:** Forgetting to close tags — `<p>text` without `</p>` causes
  unpredictable rendering as browsers guess where the element ends. **Fix:**
  Every non-void tag (`p`, `div`, `li`, `a`) needs a matching closing tag.
- **Pitfall:** Multiple `<main>` elements on one page. Only one is valid.
  **Fix:** Use `<section>` or `<div>` for additional content areas.
- **Pitfall:** Missing `lang` attribute on `<html>` — hurts accessibility
  (screen readers need to know the language). **Fix:** Always include
  `<html lang="en">`.

## Next Steps

- **Practice:** View the source of any web page (right-click → View Page
  Source) and identify the `<header>`, `<main>`, and `<footer>`. Count how
  many `<article>` elements you find.
- **Read:** [MDN HTML Basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics)
- **Related:** [html_tags](/lesson/html_tags) — the specific tags you'll use
  to build content
