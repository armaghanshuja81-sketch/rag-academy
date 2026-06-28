---
id: flask_forms
title: Handling Form Submissions
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: flask
prerequisites: [flask_templates, html_forms]
tags: [flask, forms, post, validation]
---

## Concept Introduction

Forms are the bridge between users and your backend. A user types into a search box or uploads a file — your Flask route receives that data, validates it, acts on it, and returns a response. By the end of this lesson you'll process form data in Flask, validate input, handle file uploads, and implement the redirect-after-POST pattern that prevents duplicate submissions.

## How It Works

Flask exposes incoming request data through the `request` object. `request.form` holds URL-encoded form fields (like `<input name="q">`). `request.args` holds query string parameters (the `?q=foo` part of a URL). `request.files` holds uploaded files. `request.method` tells you GET or POST.

The data flow for a form submission: (1) Browser sends POST with form data, (2) Flask route reads `request.form`, (3) You validate each field, (4) On success: save to database, set a flash message, redirect to a GET page, (5) The GET page renders the flash message. This redirect-after-POST pattern prevents browser re-submission warnings and is mandatory for any form that changes state.

Validation means checking that required fields exist, emails look like emails, numbers are actually numbers. Flask-WTF adds class-based validation, but for learning you should write validation explicitly so you understand what happens underneath.

## Code Examples

A basic contact form with validation and flash messages:

```python
from flask import Flask, render_template, request, redirect, url_for, flash
import re

app = Flask(__name__)
app.secret_key = "change-me-in-production"

@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        message = request.form.get("message", "").strip()

        errors = []
        if not name:
            errors.append("Name is required.")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            errors.append("Enter a valid email.")
        if len(message) < 10:
            errors.append("Message must be at least 10 characters.")

        if errors:
            for err in errors:
                flash(err, "error")
        else:
            flash(f"Thanks {name}, we'll reply to {email}.", "success")
            return redirect(url_for("contact"))

    return render_template("contact.html")
```

The template — `request.form` values are preserved on validation failure so the user doesn't lose their input:

```html
<!-- templates/contact.html -->
{% with messages = get_flashed_messages(with_categories=true) %}
  {% for category, msg in messages %}
    <div class="flash-{{ category }}">{{ msg }}</div>
  {% endfor %}
{% endwith %}

<form method="POST">
  <input name="name" placeholder="Name" value="{{ request.form.name or '' }}">
  <input name="email" placeholder="Email" value="{{ request.form.email or '' }}">
  <textarea name="message" placeholder="Your message">{{ request.form.message or '' }}</textarea>
  <button type="submit">Send</button>
</form>
```

File upload — the form must use `enctype="multipart/form-data"`, and Flask puts the file in `request.files`:

```python
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "txt", "md"}

@app.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        file = request.files.get("document")
        if not file or file.filename == "":
            flash("No file selected.", "error")
            return redirect(url_for("upload"))

        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            flash(f".{ext} files not allowed. Use PDF, TXT, or MD.", "error")
            return redirect(url_for("upload"))

        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        flash(f"Uploaded {filename}", "success")
        return redirect(url_for("upload"))

    return render_template("upload.html")
```

## Try It Yourself

Build a search form for a RAG knowledge base. The form has a text input (`q`) and a dropdown for result count (`k`, values 3, 5, 10). Server-side: validate that `q` is at least 3 characters and `k` is one of the allowed values. On valid submission, redirect to a results page. On error, re-render the form with the previous input and error messages:

```python
@app.route("/search", methods=["GET", "POST"])
def search():
    if request.method == "POST":
        q = request.form.get("q", "").strip()
        k = request.form.get("k", "5")
        # Your validation and redirection logic here
    return render_template("search.html")
```

## Real-World RAG Connection

Every RAG application has a text input — the user's question is form data. In a production RAG API, the Flask route receives the question via POST, validates it isn't empty or maliciously long, passes it to the retrieval pipeline, and returns the generated answer along with source citations. File upload forms are how users ingest new documents into the knowledge base. Skipping validation on either form leads to empty queries that crash your embedding step or corrupted files that fail silently in the ingestion pipeline.

## Common Pitfalls

- **Pitfall:** Forgetting `enctype="multipart/form-data"` on file upload forms. Without it, `request.files` is always empty because the browser sends the file as URL-encoded text. **Fix:** Always set `<form method="POST" enctype="multipart/form-data">` when the form contains `<input type="file">`.
- **Pitfall:** Redirecting without `url_for()` — hardcoding `/contact` breaks when routes change. **Fix:** Use `redirect(url_for("contact"))` so the redirect always points to the correct route, even after refactoring.
- **Pitfall:** Accepting any file extension. An attacker uploads a `.py` file, visits its URL, and your server executes it. **Fix:** Validate extensions against an allowlist and use `secure_filename()` to strip path traversal characters.

## Next Steps

- **Practice:** Add server-side validation to the search form exercise above. Then add a second form on the same page controlled by a hidden `<input name="action">` — validate both forms in the same route by checking `request.form.get("action")`.
- **Read:** [Flask Request Object](https://flask.palletsprojects.com/en/stable/quickstart/#the-request-object)
- **Related:** [flask_middleware](/lesson/flask_middleware) — add CSRF protection to these forms at the middleware layer
