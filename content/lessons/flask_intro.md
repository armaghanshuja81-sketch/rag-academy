---
id: flask_intro
title: What is Flask?
tier: junior
difficulty: beginner
estimated_minutes: 20
module: flask
prerequisites: [py_functions, html_forms]
tags: [flask, web-framework, backend]
---

## Concept Introduction

Flask turns your Python functions into a web server. Write a function, attach
it to a URL with a decorator, and anyone who visits that URL triggers your
code. By the end of this lesson you'll have a running Flask app with multiple
routes and dynamic URL parameters.

## How It Works

Flask is a WSGI (Web Server Gateway Interface) micro-framework. "Micro" means
it provides routing, request handling, and response building — and nothing
more. Everything else (databases, auth, forms) is optional via extensions.
This is the opposite of "batteries-included" frameworks like Django.

The core loop: a browser sends an HTTP request to a URL → Flask matches the
URL to a `@app.route()` → your function runs → it returns a string (HTML or
JSON) → Flask sends it back as an HTTP response.

The `@app.route("/path")` decorator registers your function as the handler
for that path. Flask automatically passes URL variables to your function
parameters when you use `<variable>` in the route pattern.

## Code Examples

A minimal Flask app — save as `app.py` and run:

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, RAG Academy!"

@app.route("/about")
def about():
    return "<h1>About</h1><p>Built with Flask.</p>"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

Dynamic routes — capture parts of the URL as variables:

```python
@app.route("/user/<username>")
def profile(username):
    return f"<h1>Profile: {username}</h1>"

@app.route("/doc/<int:doc_id>")
def view_document(doc_id):
    # doc_id is an integer, not a string
    return f"<p>Loading document #{doc_id}</p>"
```

Returning JSON for API endpoints:

```python
from flask import jsonify

@app.route("/api/status")
def status():
    return jsonify({"status": "ok", "documents": 1523})
```

## Try It Yourself

Build a Flask app with three routes: a home page, a `/greet/<name>` route
that returns a personalized greeting, and a `/api/search` route that returns
a JSON response with a query and mock results:

```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/")
def home():
    return "<h1>RAG Search API</h1><p>Try /api/search?q=your+query</p>"

@app.route("/greet/<name>")
def greet(name):
    return f"<h1>Hello, {name}!</h1><p>Ready to learn RAG?</p>"

@app.route("/api/search")
def search():
    query = request.args.get("q", "")
    return jsonify({
        "query": query,
        "results": [
            {"title": "Intro to RAG", "score": 0.94},
            {"title": "Vector Databases", "score": 0.87}
        ]
    })

if __name__ == "__main__":
    app.run(debug=True)
```

## Real-World RAG Connection

Flask is the most popular framework for deploying RAG applications. Every RAG
backend you build — whether it's a chatbot, a document QA system, or a search
API — needs a web framework to receive queries and return answers. Flask's
simplicity means you spend your time on retrieval quality, not boilerplate.

## Common Pitfalls

- **Pitfall:** Running with `debug=True` in production — it allows arbitrary
  code execution via the debugger. **Fix:** Use `debug=False` (the default)
  and set environment variables for configuration in production.
- **Pitfall:** Returning non-string values from a route without `jsonify`.
  Flask requires string, tuple, or Response objects. **Fix:** Use
  `jsonify(dict)` for JSON responses.
- **Pitfall:** Route conflicts — two routes with the same path, the first one
  wins silently. **Fix:** Use `app.url_map` to list all registered routes
  and check for duplicates.

## Next Steps

- **Practice:** Add a `/api/time` route that returns the current server time
  as JSON using `from datetime import datetime`. Test it in your browser.
- **Read:** [Flask Quickstart — official docs](https://flask.palletsprojects.com/en/stable/quickstart/)
- **Related:** [flask_routes](/lesson/flask_routes) — dynamic URLs, HTTP
  methods, and request data handling
