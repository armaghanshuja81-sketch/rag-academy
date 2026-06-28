---
id: flask_templates
title: Jinja2 Templates
tier: mid
difficulty: intermediate
estimated_minutes: 20
module: flask
prerequisites: [flask_routes, html_tags]
tags: [flask, jinja2, templates, html]
---

## Concept Introduction

Jinja2 is Flask's built-in template engine. Instead of returning raw HTML strings from your routes, you write `.html` files in a `templates/` directory and Flask renders them with your data injected. Template inheritance lets you define a page layout once and reuse it everywhere. By the end of this lesson you'll pass data from Flask routes to templates, use template inheritance for consistent layouts, and write templates that are safe from XSS attacks.

## How It Works

Jinja2 templates are HTML files with three special syntax elements: `{{ expression }}` prints a variable (auto-escaped for HTML safety), `{% statement %}` runs control flow like loops and conditionals, and `{# comment #}` adds notes that never appear in output.

Template inheritance works through blocks. You create a `base.html` with named blocks like `{% block content %}{% endblock %}`, then child templates extend it and fill in those blocks. Everything outside a block in the base template appears on every page — navigation, footer, stylesheets. Everything inside a block is overridable.

Flask's `render_template()` function loads the template, passes your variables into the Jinja2 context, and returns the rendered HTML string. Variables are passed as keyword arguments: `render_template("page.html", title="Home", items=results)`.

URL generation uses `url_for("route_name")`, not hardcoded paths. If you later change `/about` to `/about-us`, every `url_for("about")` updates automatically. This is essential for maintainable multi-page sites.

## Code Examples

Base template with blocks and automatic navigation highlighting:

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}RAG Academy{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
    <nav>
        <a href="{{ url_for('home') }}">Home</a>
        <a href="{{ url_for('lessons') }}">Lessons</a>
        <a href="{{ url_for('about') }}">About</a>
    </nav>
    <main>
        {% block content %}{% endblock %}
    </main>
    <footer>&copy; {% now 'year' %} RAG Academy</footer>
</body>
</html>
```

Child template overriding two blocks:

```html
<!-- templates/lesson.html -->
{% extends "base.html" %}
{% block title %}{{ lesson.title }} — RAG Academy{% endblock %}
{% block content %}
<h1>{{ lesson.title }}</h1>
<p>Module: {{ lesson.module }} | Difficulty: {{ lesson.difficulty }}</p>
<article>{{ lesson.body | safe }}</article>
{% endblock %}
```

Route passing structured data to the template:

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/lesson/<lesson_id>")
def show_lesson(lesson_id):
    # In production, fetch from DB. Here a dict for illustration.
    lesson = {
        "title": "Jinja2 Templates",
        "module": "Flask",
        "difficulty": "Intermediate",
        "body": "<p>Templates are <strong>powerful</strong>.</p>"
    }
    return render_template("lesson.html", lesson=lesson)
```

Looping and conditional rendering — the most common patterns in RAG interfaces:

```html
{% if results %}
<ul class="search-results">
    {% for item in results %}
    <li>
        <h3><a href="{{ url_for('doc', id=item.id) }}">{{ item.title }}</a></h3>
        <p>{{ item.snippet }}</p>
        <span class="score">{{ "%.2f" | format(item.score) }}</span>
    </li>
    {% endfor %}
</ul>
{% else %}
<p>No results found for "{{ query }}".</p>
{% endif %}
```

## Try It Yourself

Build a results display template for a RAG search. Pass a list of dicts from your route — each dict has `title`, `snippet`, `score`, and `doc_id`. The template should: (1) show the total result count, (2) loop over results rendering each as a card, (3) display scores as percentages using a Jinja2 filter, (4) show an empty state when no results are returned:

```python
@app.route("/search")
def search():
    results = [
        {"title": "Vector Search Guide", "snippet": "FAISS provides...",
         "score": 0.87, "doc_id": "vec-101"},
        {"title": "Embeddings Explained", "snippet": "Embedding models map...",
         "score": 0.72, "doc_id": "emb-202"},
    ]
    return render_template("results.html", results=results, query="vector search")
```

## Real-World RAG Connection

Every RAG application renders retrieved documents in a template. The results page loops over `{{ results }}` from ChromaDB or FAISS, shows snippets with highlighted keywords, and links to full document views. Template inheritance keeps the navigation, branding, and footer consistent across search, document view, and settings pages. If you skip the `|e` filter or use `|safe` without sanitizing, user-uploaded documents with HTML in them execute scripts in other users' browsers — this is how document-based XSS attacks happen in RAG apps.

## Common Pitfalls

- **Pitfall:** Using `|safe` on user-generated content. If a document chunk contains `<script>alert(1)</script>`, the browser executes it. **Fix:** Never use `|safe` on data that originates from users or uploaded documents. The default auto-escaping is your protection.
- **Pitfall:** Forgetting to pass a variable used in `base.html`. If `base.html` has `<title>{% block title %}{{ site_name }}{% endblock %}</title>`, every `render_template()` call must include `site_name=site_name`. **Fix:** Use `app.context_processor` to inject global variables available in all templates: `@app.context_processor; def inject_globals(): return dict(site_name="RAG Academy")`.
- **Pitfall:** Hardcoding URLs when linking between pages. Writing `<a href="/lesson/{{ id }}">` breaks when the route prefix changes. **Fix:** Always use `url_for("show_lesson", lesson_id=id)` so links survive route reorganizations.

## Next Steps

- **Practice:** Convert three existing pages in your Flask app to use template inheritance from a common `base.html`. Add a navigation bar that highlights the current page using `request.endpoint` in the template.
- **Read:** [Jinja2 Template Designer Documentation](https://jinja.palletsprojects.com/en/stable/templates/)
- **Related:** [flask_forms](/lesson/flask_forms) — combine templates with form handling for complete data input/output flows
