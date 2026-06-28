---
id: css_box_model
title: CSS Box Model
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: web
prerequisites: [css_selectors]
tags: [css, box-model, layout, styling]
---

## Concept Introduction

Every HTML element is a rectangular box. The CSS box model defines what that
box is made of — content, padding, border, and margin — and how its size is
calculated. By the end of this lesson you will inspect the box model in
DevTools, switch between `content-box` and `border-box`, and predict exactly
how much space any element occupies.

## How It Works

The box model has four layers, from inside to outside:
1. **Content** — the text, image, or child elements. Width and height set this
   area in `content-box` mode.
2. **Padding** — transparent space between content and border. Adds to the
   total element size in `content-box` mode.
3. **Border** — the visible line around the element. Also adds to total size.
4. **Margin** — transparent space between this element and its neighbors. Does
   NOT add to the element's own size, but affects layout spacing.

The critical decision is `box-sizing`:
- `content-box` (default): `width` sets only the content area. Padding and
  border are added on top. A `width: 300px` element with `padding: 20px` and
  `border: 5px` is actually 350px wide (300 + 40 + 10).
- `border-box`: `width` sets the total width including padding and border.
  A `width: 300px` element is always 300px wide regardless of padding. The
  content shrinks to accommodate.

Block elements (div, p, h1) take full available width and stack vertically.
Inline elements (span, a, strong) take only as much width as their content
and sit side-by-side horizontally. Padding and margin on inline elements only
affect horizontal spacing; vertical padding/border overlap adjacent lines.

## Code Examples

The four layers visualized:

```css
.box {
    width: 300px;              /* Content width (content-box) */
    padding: 20px;             /* Inside border */
    border: 5px solid #333;    /* Visible edge */
    margin: 15px;              /* Outside spacing */
}
/* Total rendered width: 300 + 40 + 10 = 350px */
```

`border-box` saves your sanity — `width` means total width:

```css
*, *::before, *::after {
    box-sizing: border-box;    /* Apply globally — every modern project does this */
}

.card {
    width: 300px;              /* Exactly 300px total */
    padding: 20px;             /* Content becomes 250px (300 - 40) */
    border: 5px solid #333;    /* Content becomes 250px (300 - 40 - 10) */
    margin: 15px;              /* Space outside — does NOT affect 300px */
}
```

Block vs inline boxes:

```css
.block-example {
    display: block;
    width: 400px;              /* Works — block respects width */
    margin: 10px 0;            /* Vertical margin works — pushes elements apart */
}

.inline-example {
    display: inline;
    width: 400px;              /* IGNORED — inline elements ignore width */
    margin: 20px;              /* Horizontal works, vertical collapses */
}

.inline-block-example {
    display: inline-block;
    width: 200px;              /* Works — respects width but flows inline */
    margin: 10px;              /* All margins work */
    vertical-align: top;       /* Align with siblings */
}
```

DevTools inspection — the most important debugging skill:

```css
/* In Chrome/Edge DevTools: Elements tab > Computed */
/* Hover any element to see content (blue), padding (green),
   border (yellow/orange), margin (brown) highlighted on screen */

/* Use the Computed tab to see the final resolved values
   after all cascading and inheritance */
```

```html
<!-- A card component showing all box model layers -->
<div class="card" style="
    box-sizing: border-box;
    width: 320px;
    padding: 24px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    margin: 16px auto;
    font-family: system-ui, sans-serif;
">
    <h3 style="margin: 0 0 8px 0;">RAG Search Result</h3>
    <p style="margin: 0; line-height: 1.6; color: #4b5563;">
        Vector databases store embeddings as dense vectors
        and enable fast approximate nearest neighbor search.
    </p>
</div>
```

## Try It Yourself

Build three cards side by side using the box model:
1. Each card: 300px total width, 20px padding, 2px border, 16px gap between
   cards
2. Use `border-box` so your width calculation is predictable
3. Add a hover effect that increases the border width without shifting layout
   (hint: use `outline` or a box-shadow for the hover state)

```css
.card-row {
    display: flex;
    gap: 16px;
}

.card {
    box-sizing: border-box;
    width: 300px;
    padding: 20px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: box-shadow 0.2s;
}

.card:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px #3b82f6;  /* No layout shift — shadow sits outside */
    /* DON'T do: border-width: 4px; — this shifts everything */
}
```

## Real-World RAG Connection

When your RAG application scrapes web pages, the browser's rendering engine
uses the box model to compute element positions and sizes. Understanding the
box model lets you write more precise CSS selectors in your web scrapers —
you know which elements contain visible text vs. which are collapsed or hidden.
Additionally, any dashboard you build to display RAG results (search cards,
result lists, metadata panels) relies on the box model for layout spacing.
Misunderstanding `content-box` vs `border-box` is the single most common cause
of elements that "don't fit" in a row.

## Common Pitfalls

- **Pitfall:** Not setting `box-sizing: border-box` globally. Every width
  calculation in your project is off by the sum of padding and border unless
  you are doing mental math. **Fix:** Add `*, *::before, *::after { box-sizing:
  border-box; }` as the first rule in every stylesheet.
- **Pitfall:** Adding padding to a fixed-width parent and wondering why children
  overflow. In `content-box`, a 600px parent with 20px padding = 640px total.
  **Fix:** Use `border-box` and set explicit widths on children with
  `max-width: 100%`.
- **Pitfall:** Collapsing vertical margins — when two block elements stack,
  their vertical margins collapse to the larger of the two, not the sum. **Fix:**
  Use `padding` for spacing when you need predictable distance, or wrap in a
  flex/grid container where margins don't collapse.

## Next Steps

- **Practice:** Open the DevTools Elements panel on any popular website.
  Hover over 10 different elements and identify their box model values.
  Toggle `box-sizing` in the Styles panel to see how `content-box` would
  change the layout.
- **Read:** [MDN Box Model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model)
- **Related:** [css_layout](/lesson/css_layout) — use the box model as the
  foundation for Flexbox and Grid layouts
