---
id: db_flask
title: Flask + SQLite Integration
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: databases
prerequisites: [db_python, flask_routes]
tags: [flask, sqlite, databases, full-stack]
---

## Concept Introduction

A database without a user interface is invisible. Flask + SQLite connects your
database to the browser: users see records rendered in HTML, submit forms that
insert new rows, and navigate between views — all driven by Python routes and
SQL queries. By the end of this lesson you will build a complete mini CRUD
application.

## How It Works

The data flow goes: browser request -> Flask route -> SQLite query -> Jinja2
template -> HTML response. Each request is independent; Flask does not share
database connections across requests by default.

The standard pattern for request-scoped database connections is Flask's `g`
object. `g` is a per-request namespace — it resets with every HTTP request. You
open a connection in a `before_request` hook (or at the top of each route),
store it on `g.db`, use it during the route handler, and close it in a
`teardown_appcontext` hook. This ensures every request gets its own connection
and connections are always cleaned up, even when a route raises an exception.

Jinja2 templates receive data from the route as keyword arguments
(`return render_template("page.html", documents=results)`) and loop over it
using `{% for doc in documents %}`. Form submissions send POST data that Flask
exposes as `request.form["field_name"]`.

The pattern for inserts: GET displays the form, POST processes the submission.
Use `redirect()` after a successful POST to prevent duplicate submissions on
browser refresh (the Post/Redirect/Get pattern).

## Code Examples

The application factory and database hooks:

```python
# app.py
import sqlite3
from flask import Flask, g

app = Flask(__name__)
DATABASE = "rag_docs.db"

def get_db():
    """Return the request-scoped database connection, creating it if needed."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(exception):
    """Close the database connection at the end of every request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Create tables — call once at startup."""
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
```

Routes for listing, viewing, and creating documents:

```python
from flask import render_template, request, redirect, url_for

@app.route("/")
def index():
    """List all documents, newest first."""
    db = get_db()
    documents = db.execute(
        "SELECT id, title, category, created_at FROM documents ORDER BY created_at DESC"
    ).fetchall()
    return render_template("index.html", documents=documents)

@app.route("/document/<int:doc_id>")
def view_document(doc_id):
    """Show a single document with full content."""
    db = get_db()
    doc = db.execute(
        "SELECT * FROM documents WHERE id = ?", (doc_id,)
    ).fetchone()
    if doc is None:
        return "Document not found", 404
    return render_template("document.html", doc=doc)

@app.route("/add", methods=["GET", "POST"])
def add_document():
    """GET: show the form. POST: insert the document."""
    if request.method == "POST":
        title = request.form["title"].strip()
        content = request.form["content"].strip()
        category = request.form.get("category", "general").strip()

        if not title or not content:
            return render_template("add.html", error="Title and content are required.")

        db = get_db()
        db.execute(
            "INSERT INTO documents (title, content, category) VALUES (?, ?, ?)",
            (title, content, category)
        )
        db.commit()
        return redirect(url_for("index"))

    return render_template("add.html")

@app.route("/document/<int:doc_id>/delete", methods=["POST"])
def delete_document(doc_id):
    """Delete a document and redirect to the list."""
    db = get_db()
    db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    db.commit()
    return redirect(url_for("index"))
```

Jinja2 templates:

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}RAG Documents{% endblock %}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .doc-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .doc-card h3 { margin: 0 0 6px 0; }
        .meta { color: #6b7280; font-size: 0.875rem; }
        .category { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
        form { display: flex; flex-direction: column; gap: 12px; }
        input, textarea, select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
        button { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 6px; }
        nav { margin-bottom: 24px; }
        nav a { margin-right: 16px; }
    </style>
</head>
<body>
    <nav>
        <a href="{{ url_for('index') }}">Home</a>
        <a href="{{ url_for('add_document') }}">+ Add Document</a>
    </nav>
    {% block content %}{% endblock %}
</body>
</html>
```

```html
<!-- templates/index.html -->
{% extends "base.html" %}
{% block title %}Documents — RAG Docs{% endblock %}
{% block content %}
<h1>Documents</h1>
{% if documents %}
    {% for doc in documents %}
    <div class="doc-card">
        <h3><a href="{{ url_for('view_document', doc_id=doc['id']) }}">{{ doc['title'] }}</a></h3>
        <p class="meta">
            <span class="category">{{ doc['category'] }}</span>
            {{ doc['created_at'] }}
        </p>
    </div>
    {% endfor %}
{% else %}
    <p>No documents yet. <a href="{{ url_for('add_document') }}">Add one</a>.</p>
{% endif %}
{% endblock %}
```

```html
<!-- templates/document.html -->
{% extends "base.html" %}
{% block title %}{{ doc['title'] }} — RAG Docs{% endblock %}
{% block content %}
<h1>{{ doc['title'] }}</h1>
<p class="meta">
    <span class="category">{{ doc['category'] }}</span>
    Created: {{ doc['created_at'] }}
</p>
<div style="line-height: 1.7; white-space: pre-wrap;">{{ doc['content'] }}</div>
<form action="{{ url_for('delete_document', doc_id=doc['id']) }}" method="post"
      style="margin-top: 24px;" onsubmit="return confirm('Delete this document?')">
    <button type="submit" style="background: #dc2626;">Delete Document</button>
</form>
<p style="margin-top: 16px;"><a href="{{ url_for('index') }}">Back to all documents</a></p>
{% endblock %}
```

```html
<!-- templates/add.html -->
{% extends "base.html" %}
{% block title %}Add Document — RAG Docs{% endblock %}
{% block content %}
<h1>Add Document</h1>
{% if error %}<div class="error">{{ error }}</div>{% endif %}
<form method="post">
    <label for="title">Title</label>
    <input type="text" id="title" name="title" required>

    <label for="category">Category</label>
    <select id="category" name="category">
        <option value="general">General</option>
        <option value="technical">Technical</option>
        <option value="tutorial">Tutorial</option>
        <option value="reference">Reference</option>
    </select>

    <label for="content">Content</label>
    <textarea id="content" name="content" rows="10" required></textarea>

    <button type="submit">Save Document</button>
</form>
{% endblock %}
```

Running the app:

```bash
# Initialize the database once
python -c "from app import init_db; init_db()"

# Run the server
flask --app app run --debug
```

## Try It Yourself

Extend the app with search and edit capabilities:

```python
@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return redirect(url_for("index"))

    db = get_db()
    results = db.execute(
        "SELECT * FROM documents WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC",
        (f"%{query}%", f"%{query}%")
    ).fetchall()
    return render_template("search.html", query=query, results=results)

@app.route("/document/<int:doc_id>/edit", methods=["GET", "POST"])
def edit_document(doc_id):
    db = get_db()
    if request.method == "POST":
        title = request.form["title"].strip()
        content = request.form["content"].strip()
        category = request.form.get("category", "general").strip()
        db.execute(
            "UPDATE documents SET title=?, content=?, category=? WHERE id=?",
            (title, content, category, doc_id)
        )
        db.commit()
        return redirect(url_for("view_document", doc_id=doc_id))

    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if doc is None:
        return "Document not found", 404
    return render_template("edit.html", doc=doc)
```

Add the search form to `base.html` navigation and create the `search.html` and
`edit.html` templates following the same pattern as `add.html`.

## Real-World RAG Connection

This exact pattern powers the admin panel of a RAG application. You use Flask
routes to upload new documents, view chunking results, inspect retrieved
context for debugging, and manage the document catalog. The database schema
grows: documents -> chunks -> embeddings -> evaluation_runs -> scores. Each
table gets a set of Flask routes, and each route renders a Jinja2 template.
The `g.db` pattern ensures your RAG dashboard can serve multiple concurrent
users without connection leaks.

## Common Pitfalls

- **Pitfall:** Calling `g.db.commit()` inside a route that may raise an
  exception after the commit, leaving the database in a partially updated
  state. **Fix:** Commit only at the very end of the route, or use a context
  manager that rolls back on exceptions.
- **Pitfall:** Returning HTML after a successful POST instead of redirecting.
  The user refreshes the page and the form resubmits, creating duplicate
  records. **Fix:** Always `return redirect(url_for(...))` after a successful
  POST (the PRG pattern).
- **Pitfall:** Not escaping user input in templates. Jinja2 auto-escapes by
  default, but if you use the `|safe` filter on user-provided content, you open
  an XSS vector. **Fix:** Never mark user content as `|safe` unless you have
  sanitized it.

## Next Steps

- **Practice:** Add a "categories" table with a foreign key relationship to
  documents, update the add/edit forms to use a dropdown populated from the
  database, and create a category filter on the index page.
- **Read:** [Flask SQLite3 Documentation](https://flask.palletsprojects.com/en/stable/tutorial/database/)
- **Related:** [flask_forms](/lesson/flask_forms) — handle complex form
  validation, file uploads, and multi-step forms
