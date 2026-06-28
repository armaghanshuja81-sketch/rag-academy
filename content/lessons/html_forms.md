---
id: html_forms
title: HTML Forms & Data Flow
tier: junior
difficulty: beginner
estimated_minutes: 20
module: html
prerequisites: [html_tags]
tags: [html, forms, data-flow, flask]
---

## Concept Introduction

Forms are the bridge between the browser and the server — the moment your
frontend stops being a static page and starts sending data. Every search bar,
every file upload, every user query in a RAG app flows through a form. By the
end of this lesson you'll build a form, understand how data travels from
HTML to Python, and handle it in Flask.

## How It Works

When a user submits a form, the browser collects all input values keyed by
their `name` attributes and sends them to the URL in the form's `action`
attribute using the HTTP method in `method` (`GET` or `POST`).

GET appends data to the URL as query parameters (`/search?q=rag`). Use GET
for searches and filters — it's bookmarkable and shareable. POST sends data
in the request body, invisible in the URL. Use POST for anything that changes
state: creating, updating, deleting, uploading.

On the backend, Flask reads GET parameters from `request.args` and POST body
data from `request.form`. The `name` attribute in HTML and the key in
`request.form` must match exactly.

## Code Examples

The form — every `name` is a contract with the backend:

```html
<form action="/api/search" method="GET">
    <label for="query">Search documents:</label>
    <input type="text" id="query" name="query"
           placeholder="Enter your question..." required>

    <label for="top_k">Results:</label>
    <select id="top_k" name="top_k">
        <option value="3">3 results</option>
        <option value="5" selected>5 results</option>
        <option value="10">10 results</option>
    </select>

    <button type="submit">Search</button>
</form>
```

Flask receives the data — `name` attributes become dict keys:

```python
from flask import Flask, request

app = Flask(__name__)

@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("query", "")
    top_k = int(request.args.get("top_k", 5))
    # In a real app: results = retriever.search(query, top_k)
    return {"query": query, "top_k": top_k, "results": []}
```

File upload — use `enctype="multipart/form-data"` and `request.files`:

```html
<form action="/api/upload" method="POST" enctype="multipart/form-data">
    <input type="file" name="document" accept=".txt,.pdf">
    <button type="submit">Upload</button>
</form>
```

```python
@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("document")
    if file:
        content = file.read().decode("utf-8")
        return {"filename": file.filename, "size": len(content)}
    return {"error": "No file provided"}, 400
```

## Try It Yourself

Build a RAG query form (HTML) and its handler (Python pseudocode). The form
needs: a query text input, a temperature slider (0.0 to 1.0, step 0.1), and
a checkbox for "Include sources." Write both the HTML and the Flask handler:

```python
# Flask handler pseudocode
@app.route("/rag", methods=["POST"])
def rag_query():
    query = request.form["query"]           # Required
    temperature = float(request.form.get("temperature", 0.3))
    include_sources = "include_sources" in request.form  # Checkbox
    # result = rag_pipeline(query, temperature, include_sources)
    return {
        "query": query,
        "temperature": temperature,
        "include_sources": include_sources
    }
```

## Real-World RAG Connection

Every RAG application has at least one form: the search box. The user's query
travels from `<input name="query">` → `request.form["query"]` → your retrieval
function → the LLM → back through a template to the user's browser. That
round-trip is the core interaction loop of every RAG-powered app.

## Common Pitfalls

- **Pitfall:** Name mismatch — `<input name="query">` in HTML but
  `request.form["search"]` in Flask returns 400 Bad Request. **Fix:** Copy
  and paste the name string to ensure they match.
- **Pitfall:** Forgetting `name` attribute on inputs — the browser doesn't
  include nameless inputs in the submitted data. **Fix:** Every form control
  that sends data needs a `name`.
- **Pitfall:** Using GET for sensitive data — passwords and personal info
  appear in the URL and server logs. **Fix:** Use POST for anything
  sensitive, and HTTPS for everything.

## Next Steps

- **Practice:** Build a form that accepts a document URL and a chunk size,
  submits via POST, and prints the received data on the server side.
- **Read:** [MDN Web Forms — Working with user data](https://developer.mozilla.org/en-US/docs/Learn/Forms)
- **Related:** [flask_intro](/lesson/flask_intro) — the Flask framework that
  receives your form data
