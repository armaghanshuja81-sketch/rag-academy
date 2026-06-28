---
id: flask_routes
title: Routes & Views
tier: junior
difficulty: beginner
estimated_minutes: 15
module: flask
prerequisites: [flask_intro]
tags: [flask, routes, views, http]
---

## Concept Introduction

Routes map URLs to Python functions. Dynamic routes capture parts of the URL
as parameters. HTTP methods (`GET`, `POST`) let the same URL behave
differently depending on how it's accessed. By the end of this lesson you'll
design clean route structures, use type converters, and handle multiple HTTP
methods.

## How It Works

The `@app.route()` decorator accepts a path pattern and an optional `methods`
list. The path can contain variable segments in angle brackets: `<name>`.
Flask passes the captured value to your function parameter of the same name.

Type converters enforce and parse the variable: `<int:id>`, `<float:value>`,
`<path:filepath>`, `<uuid:id>`. Without a converter, the value is a string.

When a route handles both GET and POST, check `request.method` to branch
logic. A common pattern: GET renders a form, POST processes the submission.

Flask stores the request line data in different places:
- `request.args` — URL query parameters (GET)
- `request.form` — form body data (POST)
- `request.json` — parsed JSON body (POST with Content-Type: application/json)

## Code Examples

Multiple HTTP methods on one route:

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/query", methods=["GET", "POST"])
def handle_query():
    if request.method == "GET":
        query = request.args.get("q", "")
        return jsonify({"method": "GET", "query": query})
    else:
        data = request.get_json()
        query = data.get("query", "") if data else ""
        return jsonify({"method": "POST", "query": query})
```

Type converters in action:

```python
@app.route("/documents/<int:doc_id>")
def get_document(doc_id):
    return jsonify({"id": doc_id, "type": "int (guaranteed)"})

@app.route("/files/<path:filepath>")
def serve_file(filepath):
    # filepath can contain slashes: "reports/2024/summary.pdf"
    return f"Requested: {filepath}"

@app.route("/chunk/<uuid:chunk_id>")
def get_chunk(chunk_id):
    return jsonify({"chunk_id": str(chunk_id)})
```

Route grouping with a URL prefix:

```python
@app.route("/api/v1/search")
def search_v1():
    return jsonify({"version": 1, "results": []})

@app.route("/api/v2/search")
def search_v2():
    return jsonify({"version": 2, "results": [], "latency_ms": 12})
```

## Try It Yourself

Build a `/rag/<query>` route that accepts GET (search) and POST (search with
additional parameters). The GET version takes just the query from the URL.
The POST version accepts a JSON body with `query`, `top_k`, and `temperature`:

```python
@app.route("/rag/<query>", methods=["GET", "POST"])
def rag_search(query):
    if request.method == "GET":
        return jsonify({"query": query, "method": "GET", "top_k": 5})
    data = request.get_json(silent=True) or {}
    return jsonify({
        "query": query,
        "method": "POST",
        "top_k": data.get("top_k", 5),
        "temperature": data.get("temperature", 0.3)
    })
```

## Real-World RAG Connection

Production RAG APIs use route design to version endpoints (`/v1/retrieve`,
`/v2/retrieve`), handle GET for simple searches and POST for complex queries
with filters and hyperparameters, and use type converters to validate document
IDs and chunk indices. Clean route design makes your API predictable — other
developers (including future you) can guess the URL before reading the docs.

## Common Pitfalls

- **Pitfall:** Trailing slash mismatch — `/search` and `/search/` are
  different routes by default. **Fix:** Pick one convention (Flask defaults to
  redirecting the slash-less version to the slashed version).
- **Pitfall:** Not specifying `methods` — the route only handles GET, and a
  POST request returns 405 Method Not Allowed. **Fix:** Always set `methods`
  explicitly if you handle more than GET.
- **Pitfall:** Route variable name doesn't match function parameter name —
  `<user_id>` in the route but `uid` in the function silently fails.
  **Fix:** Keep names identical or use `defaults={"param": value}`.

## Next Steps

- **Practice:** Create a Flask app with `/api/documents/<int:id>/chunks`
  that returns JSON listing chunks for document `id`. Handle both GET
  (list all chunks) and POST (add a chunk via JSON body).
- **Read:** [Flask Routing — official docs](https://flask.palletsprojects.com/en/stable/quickstart/#routing)
- **Related:** [html_forms](/lesson/html_forms) — the frontend side of the
  data your routes receive
