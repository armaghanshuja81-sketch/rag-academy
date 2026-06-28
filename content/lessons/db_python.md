---
id: db_python
title: SQLite from Python
tier: mid
difficulty: intermediate
estimated_minutes: 25
module: databases
prerequisites: [db_crud, py_functions]
tags: [sqlite, python, databases, sql]
---

## Concept Introduction

SQL is not just for the command line. Python's built-in `sqlite3` module lets
you create, query, and manage databases programmatically — the same databases
you will use to store RAG document metadata, user queries, and evaluation
results. By the end of this lesson you will perform full CRUD operations from
Python using parameterized queries and context managers.

## How It Works

The `sqlite3` module ships with Python. You open a connection to a `.db` file
(or `:memory:` for a temporary database), create a cursor to execute SQL,
commit changes, and close the connection. The cursor is a pointer that
navigates result sets — it holds the current row and advances with each
`fetchone()` call.

Parameterized queries prevent SQL injection by separating SQL structure from
user-supplied values. You write placeholders (`?`) in the query and pass a
tuple of values. sqlite3 handles quoting and escaping. Never use string
formatting (`f"SELECT * FROM users WHERE name = '{name}'"`) — it is the
fastest way to get your database compromised.

The `row_factory` setting controls how rows are returned. The default returns
tuples, but `sqlite3.Row` returns dict-like objects where you can access
columns by name (`row["title"]`). This makes your code more readable and
resilient to column reordering.

Context managers (`with sqlite3.connect(...) as conn:`) automatically commit
on success and rollback on exception. Use them for every database operation.

## Code Examples

Connect, create a table, and insert data:

```python
import sqlite3

# Connect — creates the file if it doesn't exist
with sqlite3.connect("academy.db") as conn:
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            source_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Parameterized insert — ? placeholders prevent injection
    cursor.execute(
        "INSERT INTO documents (title, content, source_url) VALUES (?, ?, ?)",
        ("RAG Overview", "RAG combines retrieval with generation...",
         "https://example.com/rag")
    )

    # Insert multiple rows
    docs = [
        ("Embeddings 101", "Embeddings are dense vector representations...",
         "https://example.com/embeddings"),
        ("Vector Search", "Vector databases enable similarity search...",
         "https://example.com/vectors"),
        ("Chunking Strategy", "Document chunking splits text into pieces...",
         "https://example.com/chunking"),
    ]
    cursor.executemany(
        "INSERT INTO documents (title, content, source_url) VALUES (?, ?, ?)",
        docs
    )

    print(f"Inserted {cursor.rowcount} rows (last insert)")
    print(f"Total rows: {conn.execute('SELECT COUNT(*) FROM documents').fetchone()[0]}")
```

Select with dict-like rows:

```python
with sqlite3.connect("academy.db") as conn:
    conn.row_factory = sqlite3.Row  # Return dict-like rows

    # Fetch all matching rows
    rows = conn.execute(
        "SELECT id, title, source_url FROM documents WHERE title LIKE ?",
        ("%Vector%",)
    ).fetchall()

    for row in rows:
        print(f"[{row['id']}] {row['title']} — {row['source_url']}")

    # Fetch one row by ID
    doc = conn.execute(
        "SELECT * FROM documents WHERE id = ?", (1,)
    ).fetchone()

    if doc:
        print(f"\nDocument #{doc['id']}: {doc['title']}")
        print(f"Content: {doc['content'][:60]}...")
        print(f"Created: {doc['created_at']}")
```

Update and delete:

```python
with sqlite3.connect("academy.db") as conn:
    # Update — always include WHERE clause
    conn.execute(
        "UPDATE documents SET content = ? WHERE id = ?",
        ("RAG = Retrieval-Augmented Generation. It grounds LLMs in real data.", 1)
    )
    print(f"Updated: {conn.total_changes} changes")

    # Delete by ID
    conn.execute("DELETE FROM documents WHERE id = ?", (4,))
    print(f"Deleted: {conn.total_changes} changes")

    # Verify
    count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    print(f"Remaining documents: {count}")
```

A reusable database helper class:

```python
import sqlite3
from contextlib import contextmanager

class DocumentDB:
    def __init__(self, db_path="documents.db"):
        self.db_path = db_path

    @contextmanager
    def _connect(self):
        """Context manager for connections — auto-commits and closes."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init(self):
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def insert(self, title, content, tags=None):
        with self._connect() as conn:
            cursor = conn.execute(
                "INSERT INTO documents (title, content, tags) VALUES (?, ?, ?)",
                (title, content, tags)
            )
            return cursor.lastrowid

    def search(self, keyword):
        with self._connect() as conn:
            return conn.execute(
                "SELECT * FROM documents WHERE title LIKE ? OR content LIKE ?",
                (f"%{keyword}%", f"%{keyword}%")
            ).fetchall()

    def get_by_id(self, doc_id):
        with self._connect() as conn:
            return conn.execute(
                "SELECT * FROM documents WHERE id = ?", (doc_id,)
            ).fetchone()

# Usage
db = DocumentDB("my_rag_docs.db")
db.init()
doc_id = db.insert("RAG Pipeline", "The RAG pipeline has three stages...",
                    tags="rag,architecture")
print(f"Inserted document ID: {doc_id}")

results = db.search("RAG")
for row in results:
    print(f"Found: {row['title']} (ID: {row['id']})")
```

## Try It Yourself

Build a `ChunkDB` class that stores document chunks for a RAG system:
1. Table: `chunks(id, document_id, chunk_index, content, token_count, embedding_model)`
2. Methods: `add_chunk(doc_id, index, content, model)`, `get_document_chunks(doc_id)`,
   `delete_document(doc_id)` (cascading — deletes all chunks)
3. `get_document_chunks` must return chunks ordered by `chunk_index`
4. Add a `stats()` method that returns total documents, total chunks, and
   average chunks per document

```python
class ChunkDB:
    def __init__(self, db_path="chunks.db"):
        self.db_path = db_path

    def init(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_id INTEGER NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    token_count INTEGER DEFAULT 0,
                    embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2'
                )
            """)

    def add_chunk(self, doc_id, index, content, model="all-MiniLM-L6-v2"):
        # Implement — estimate token_count as len(content.split())
        pass

    def get_document_chunks(self, doc_id):
        # Return chunks ordered by chunk_index
        pass

    def delete_document(self, doc_id):
        # Delete all chunks for this document
        pass

    def stats(self):
        # Return dict with total_chunks, unique_documents, avg_chunks_per_doc
        pass
```

## Real-World RAG Connection

Your RAG pipeline metadata lives in SQLite. You store document sources, chunk
text, ingestion timestamps, embedding model versions, and evaluation scores.
When a user asks "has this document been updated since last week?", you query
SQLite, not your vector database. When the evaluation pipeline needs to pair
generated answers with ground truth, it joins across SQLite tables. SQLite from
Python is not a side skill — it is the backbone of every RAG system's
operational data.

## Common Pitfalls

- **Pitfall:** String formatting queries — `f"SELECT * FROM docs WHERE title =
  '{user_input}'"` opens a SQL injection vulnerability. **Fix:** Always use
  parameterized queries with `?` placeholders. sqlite3 handles escaping.
- **Pitfall:** Forgetting to commit — inserts and updates are not visible to
  other connections until committed. **Fix:** Use `with sqlite3.connect(...) as
  conn:` — the context manager auto-commits on exit.
- **Pitfall:** Fetching all rows without limiting — `fetchall()` on a table
  with a million rows loads everything into memory. **Fix:** Use `fetchmany()`
  for batch processing, or add `LIMIT` and `OFFSET` to your queries.

## Next Steps

- **Practice:** Write a script that reads a CSV of document metadata, creates
  a SQLite table, inserts all rows with validation (no empty titles, unique
  source URLs), and produces a summary report of rows inserted vs. skipped.
- **Read:** [Python sqlite3 Documentation](https://docs.python.org/3/library/sqlite3.html)
- **Related:** [db_flask](/lesson/db_flask) — serve your SQLite data through
  Flask routes and display it in HTML
