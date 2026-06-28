---
id: flask_middleware
title: Flask Middleware & Auth
tier: senior
difficulty: advanced
estimated_minutes: 25
module: python-foundations
prerequisites: [py_async]
tags: [flask, middleware, jwt, auth, rate-limiting, tracing]
---

## Concept Introduction

Every production RAG API needs authentication, rate limiting, and request tracing before a single chunk of retrieval logic runs. Flask middleware implements these cross-cutting concerns once and applies them to every endpoint uniformly. This lesson covers the middleware patterns that form the outer shell of a production RAG service.

## How It Works

Flask's `before_request` hooks run in registration order before every request. If a hook returns a non-None value, Flask treats it as the response and skips the view function entirely -- this is how auth middleware short-circuits unauthenticated requests. `after_request` hooks run after the view returns, ideal for adding headers (request ID, CORS) or logging. The key architectural decision is what lives in middleware vs what lives in a decorator: middleware affects every route in the Blueprint; decorators gate specific endpoints.

JWT authentication with `flask-jwt-extended` uses `@jwt_required()` to protect endpoints. The JWT carries claims like `user_id` and `permissions`, signed by a server-side secret. On every request, the middleware verifies the signature, checks expiry, and injects the current user into Flask's `g` object. The tradeoff: JWT is stateless (no DB lookup), but cannot be revoked individually without a blocklist. For RAG systems where users share access to document collections, add a `collections` claim to the JWT and validate in middleware.

Rate limiting middleware uses the token bucket algorithm. `flask-limiter` stores counters in Redis and returns `429 Too Many Requests` with `Retry-After` headers. The architectural decision is what to limit: per-user (protects fairness), per-IP (protects against DDoS), or per-endpoint (protects expensive RAG routes). Combine all three with a layered approach.

Request ID tracing: generate a UUID on `before_request`, attach it to `g.request_id`, and emit it in every log call and response header. When a user reports a failed RAG query, you can grep logs for the request ID and reconstruct the full pipeline: embed latency, retrieved chunks, generated answer.

## Code Examples

```python
from flask import Flask, g, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import uuid

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your-secret"
jwt = JWTManager(app)
limiter = Limiter(key_func=get_remote_address, app=app)

@app.before_request
def attach_request_id():
    g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

@app.after_request
def add_request_id_header(response):
    response.headers["X-Request-ID"] = g.get("request_id", "")
    return response

@app.route("/rag/query", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")
def rag_query():
    user_id = get_jwt_identity()
    query = request.json["query"]
    return jsonify({"answer": "result", "request_id": g.request_id})
```

## Try It Yourself

Build a Flask app with the three middleware layers above. Issue a request without a JWT and verify a 401. Then send 11 authenticated requests in under a minute and verify the 11th gets a 429. Finally, verify that every response (including 401 and 429) carries the `X-Request-ID` header.

## Real-World RAG Connection

A multi-tenant RAG SaaS must identify which customer each request belongs to before any data access. The JWT middleware sets `tenant_id` on `g`, and every downstream database query filters by it. Forgetting this layer means one customer's queries could retrieve another customer's documents.

## Common Pitfalls

- **Exception handlers that drop `g`.** If a custom error handler does not access `g.request_id`, logs from that error path will lack the trace. Include request ID logging in your root exception handler, not just in `after_request`.
- **Rate limiting before authentication.** A malicious user can exhaust another user's quota with unauthenticated requests if the limiter key is based on the requested user ID rather than the authenticated identity. Always extract the rate limit key from the JWT, not from request parameters.
- **Storing PII in JWT claims.** JWTs are base64-encoded, not encrypted. Anyone with the token can decode the payload. Never put emails, names, or document titles in JWT claims.

## Next Steps

- Flask-JWT-Extended docs on custom claims and token freshness
- Lesson: **Access Control for RAG** for document-level authorization
