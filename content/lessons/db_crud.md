---
id: db_crud
title: CRUD Operations
tier: junior
difficulty: beginner
estimated_minutes: 20
module: databases
prerequisites: [db_what]
tags: [sql, crud, databases]
---

## Concept Introduction

Every interaction with a database falls into one of four categories: Create,
Read, Update, Delete — CRUD. These four operations form the data layer of
every web application, including every RAG system you'll build. By the end of
this lesson you'll write all four SQL operations from Python.

## How It Works

CRUD maps directly to SQL statements:
- **Create** → `INSERT INTO table (columns) VALUES (values)`
- **Read** → `SELECT columns FROM table WHERE condition`
- **Update** → `UPDATE table SET column = value WHERE condition`
- **Delete** → `DELETE FROM table WHERE condition`

The `WHERE` clause is the most critical part — it selects which rows to
affect. Without `WHERE`, UPDATE and DELETE apply to EVERY row. Always test
your `WHERE` clause in a SELECT first to confirm which rows will be affected.

Parameterized queries using `?` placeholders prevent SQL injection. Never
concatenate user input into SQL strings. The database driver handles escaping
when you pass parameters as a tuple.

## Code Examples

Full CRUD lifecycle on a RAG documents table:

```python
import sqlite3

conn = sqlite3.connect("rag_app.db")
c = conn.cursor()

c.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        chunk_count INTEGER DEFAULT 0
    )
""")

# CREATE — insert new records
c.execute(
    "INSERT INTO documents (title, content, chunk_count) VALUES (?, ?, ?)",
    ("Intro to Embeddings", "Embeddings are numerical representations...", 3)
)
c.execute(
    "INSERT INTO documents (title, content, chunk_count) VALUES (?, ?, ?)",
    ("Vector Search Guide", "Semantic search finds by meaning...", 5)
)
conn.commit()
```

READ — the most frequent operation, with filtering:

```python
# All documents
c.execute("SELECT id, title, chunk_count FROM documents")
for row in c.fetchall():
    print(f"#{row[0]}: {row[1]} ({row[2]} chunks)")

# Filtered: documents with more than 3 chunks
c.execute("SELECT title FROM documents WHERE chunk_count > ?", (3,))
print("Large docs:", [row[0] for row in c.fetchall()])

# Aggregation
c.execute("SELECT COUNT(*), AVG(chunk_count) FROM documents")
count, avg_chunks = c.fetchone()
print(f"Total: {count} docs, avg chunks: {avg_chunks:.1f}")
```

UPDATE and DELETE — always with WHERE:

```python
# UPDATE — modify existing record
c.execute(
    "UPDATE documents SET chunk_count = ? WHERE title = ?",
    (8, "Intro to Embeddings")
)

# DELETE — remove a record
c.execute("DELETE FROM documents WHERE title = ?", ("Vector Search Guide",))
conn.commit()

# Verify
c.execute("SELECT title FROM documents")
print("Remaining:", [row[0] for row in c.fetchall()])
conn.close()
```

## Try It Yourself

Build a query log table that tracks RAG searches. Implement all four CRUD
operations:

```python
conn = sqlite3.connect(":memory:")  # In-memory, resets each run
c = conn.cursor()

c.execute("""
    CREATE TABLE query_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        num_results INTEGER,
        latency_ms REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

# CREATE: log a search
c.execute("INSERT INTO query_log (query, num_results, latency_ms) VALUES (?, ?, ?)",
          ("What is RAG?", 5, 42.3))
c.execute("INSERT INTO query_log (query, num_results, latency_ms) VALUES (?, ?, ?)",
          ("Define embeddings", 3, 28.1))
conn.commit()

# READ: find slow queries (> 30ms)
c.execute("SELECT query, latency_ms FROM query_log WHERE latency_ms > 30")
print("Slow queries:", c.fetchall())

# UPDATE: fix a typo
c.execute("UPDATE query_log SET query = ? WHERE query = ?",
          ("What is Retrieval-Augmented Generation?", "What is RAG?"))

# DELETE: remove old logs (not shown — use a date filter)
conn.close()
```

## Real-World RAG Connection

Your RAG application's data layer is entirely CRUD. Users CREATE documents
(upload), READ search results (retrieve), UPDATE configurations (change chunk
size), and DELETE documents (cleanup). The query log table you built in the
exercise is something every production RAG system needs — it tracks what users
ask, how many results they get, and how fast the system responds.

## Common Pitfalls

- **Pitfall:** Missing `WHERE` on UPDATE/DELETE — `DELETE FROM documents` wipes
  the entire table. **Fix:** Test with SELECT first: `SELECT * FROM documents
  WHERE ...` — if the results look right, change SELECT to DELETE.
- **Pitfall:** String formatting in SQL — `f"SELECT * FROM users WHERE name =
  '{name}'"` allows SQL injection. **Fix:** Always parameterize:
  `c.execute("SELECT * FROM users WHERE name = ?", (name,))`.
- **Pitfall:** Using the same cursor after `fetchall()` without re-executing.
  Cursors are forward-only iterators. **Fix:** Call `c.execute()` again,
  or store results in a list: `results = c.fetchall()`.

## Next Steps

- **Practice:** Create a full CRUD API in Flask — four routes: `POST /docs`
  (create), `GET /docs` (read list), `PUT /docs/<id>` (update), `DELETE
  /docs/<id>` (delete). Each route performs the corresponding SQL operation.
- **Read:** [SQLite Python Tutorial](https://docs.python.org/3/library/sqlite3.html)
- **Related:** [flask_routes](/lesson/flask_routes) — use Flask routes to
  expose your CRUD operations as an API
