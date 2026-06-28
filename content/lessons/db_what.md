---
id: db_what
title: What are Databases?
tier: junior
difficulty: beginner
estimated_minutes: 15
module: databases
prerequisites: [py_dicts, py_file_io]
tags: [databases, sql, storage]
---

## Concept Introduction

Files work for small projects. When you have thousands of records, need to
search by multiple fields simultaneously, or want to ensure data isn't
corrupted by a crash mid-write, you need a database. By the end of this
lesson you'll understand what databases are, the difference between SQL and
NoSQL, and which type fits which RAG use case.

## How It Works

A database is organized data with a query engine. Instead of reading entire
files and filtering in Python, you send a query to the database and it returns
only the matching records — the database engine handles indexing, searching,
and sorting internally.

Relational databases (SQL) organize data into tables with predefined columns.
Each row is a record. Tables relate to each other via foreign keys. SQLite is
a file-based SQL database (no server needed, perfect for learning and embedded
applications). PostgreSQL and MySQL are server-based (better for concurrent
users).

Vector databases (a type of NoSQL) store embedding vectors and enable
similarity search — "find the 5 chunks most semantically similar to this
query." ChromaDB and FAISS are purpose-built for this, which traditional SQL
databases can't do efficiently.

## Code Examples

SQLite from Python — a database in a single file:

```python
import sqlite3

# Connect (creates the file if it doesn't exist)
conn = sqlite3.connect("rag_academy.db")
cursor = conn.cursor()

# Create a table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

# Insert a row
cursor.execute(
    "INSERT INTO documents (title, content) VALUES (?, ?)",
    ("Intro to RAG", "RAG combines retrieval with generation...")
)
conn.commit()

# Query
cursor.execute("SELECT id, title FROM documents WHERE title LIKE ?", ("%RAG%",))
for row in cursor.fetchall():
    print(f"#{row[0]}: {row[1]}")

conn.close()
```

## Try It Yourself

Create a SQLite database for tracking RAG experiments. Include columns for
`experiment_name`, `model`, `chunk_size`, and `recall_score`. Insert 2 rows
and query them:

```python
import sqlite3

conn = sqlite3.connect("experiments.db")
c = conn.cursor()
c.execute("""
    CREATE TABLE IF NOT EXISTS experiments (
        id INTEGER PRIMARY KEY,
        experiment_name TEXT,
        model TEXT,
        chunk_size INTEGER,
        recall_score REAL
    )
""")

c.execute("INSERT INTO experiments (experiment_name, model, chunk_size, recall_score) VALUES (?, ?, ?, ?)",
          ("baseline", "gpt-4o", 512, 0.82))
c.execute("INSERT INTO experiments (experiment_name, model, chunk_size, recall_score) VALUES (?, ?, ?, ?)",
          ("larger_chunks", "gpt-4o", 1024, 0.78))
conn.commit()

# Find experiments where recall > 0.80
c.execute("SELECT experiment_name, recall_score FROM experiments WHERE recall_score > 0.80")
for row in c.fetchall():
    print(f"{row[0]}: {row[1]}")
conn.close()
```

## Real-World RAG Connection

A RAG system uses two kinds of databases: a vector database (ChromaDB, FAISS,
Pinecone) for storing and searching embeddings, and a relational database
(SQLite, PostgreSQL) for storing document metadata, user accounts, query logs,
and evaluation results. SQL is for "what documents exist and who asked what."
Vector search is for "what content is relevant to this query."

## Common Pitfalls

- **Pitfall:** Forgetting `conn.commit()` after INSERT/UPDATE/DELETE — changes
  are lost when the connection closes. **Fix:** Call `conn.commit()` after
  every write operation, or use the connection as a context manager.
- **Pitfall:** String formatting SQL queries — `f"SELECT * FROM users WHERE
  name = '{name}'"` is a SQL injection vulnerability. **Fix:** Always use
  parameterized queries with `?` placeholders.
- **Pitfall:** SQLite concurrency — only one writer at a time. For multi-user
  web apps, SQLite can become a bottleneck. **Fix:** Use WAL mode
  (`PRAGMA journal_mode=WAL`) for better concurrent read performance.

## Next Steps

- **Practice:** Download SQLite Browser (sqlitebrowser.org) and open your
  `experiments.db` file. Explore the tables visually, then write and run SQL
  queries in the Execute SQL tab.
- **Read:** [SQLite Tutorial](https://www.sqlitetutorial.net/)
- **Related:** [db_crud](/lesson/db_crud) — the four fundamental database
  operations: Create, Read, Update, Delete
