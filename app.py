"""
RAG ACADEMY - Complete Learning Platform
Covers Python, HTML/CSS, Flask, Databases, AI/LLMs, RAG, Vector DBs, LangChain, Career
"""
from flask import Flask, request, jsonify
import sqlite3
import os
import time
import json
import markdown
from datetime import datetime

# Import our modules
from lessons_data import (
    MODULES, ALL_LESSONS, get_lesson, get_modules_with_progress,
    get_prev_next, get_tiers, get_roadmap_data
)
from rag_engine import SimpleRAGEngine
from python_runner import run_python_code
from quiz_data import get_quiz, check_answers

app = Flask(__name__)
app.secret_key = 'rag-academy-secret-2026'
app.config['DATABASE'] = os.path.join(app.root_path, 'rag_academy.db')

# Initialize RAG engine
rag_engine = SimpleRAGEngine()


# ═══════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════

def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    # Users — prepared for future auth/subscription/ACL
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            name TEXT,
            role TEXT DEFAULT 'student',
            tier TEXT DEFAULT 'free',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Lesson progress — user_id=NULL for anonymous mode, FK later
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            lesson_id TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, lesson_id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS data_flow_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT, topic TEXT, message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS rag_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            query TEXT, answer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS code_snippets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            lesson_id TEXT, code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_completed_ids(user_id=None):
    conn = get_db()
    completed = set()
    if user_id:
        for row in conn.execute(
            "SELECT lesson_id FROM lesson_progress WHERE completed = 1 AND user_id = ?", (user_id,)
        ):
            completed.add(row['lesson_id'])
    else:
        for row in conn.execute(
            "SELECT lesson_id FROM lesson_progress WHERE completed = 1 AND user_id IS NULL"
        ):
            completed.add(row['lesson_id'])
    conn.close()
    return completed


# ═══════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════

# Legacy HTML routes removed — React SPA handles all frontend routing


@app.route('/api/progress', methods=['POST'])
def api_progress():
    data = request.get_json()
    lid = data.get('lesson_id')
    if not lid:
        return jsonify({'success': False}), 400
    conn = get_db()
    existing = conn.execute("SELECT * FROM lesson_progress WHERE lesson_id = ?", (lid,)).fetchone()
    if existing:
        conn.execute("UPDATE lesson_progress SET completed = 1 WHERE lesson_id = ?", (lid,))
    else:
        conn.execute("INSERT INTO lesson_progress (lesson_id, completed) VALUES (?, 1)", (lid,))
    conn.commit()
    total = conn.execute("SELECT COUNT(DISTINCT lesson_id) as c FROM lesson_progress").fetchone()['c']
    done = conn.execute("SELECT COUNT(*) as c FROM lesson_progress WHERE completed = 1").fetchone()['c']
    conn.close()
    percent = round((done / max(total, 1)) * 100)
    return jsonify({'success': True, 'percent': percent})


@app.route('/api/modules')
def api_modules():
    completed = get_completed_ids()
    modules_data = get_modules_with_progress(completed)
    return jsonify(modules_data)

@app.route('/api/lesson/<lesson_id>')
def api_lesson(lesson_id):
    lesson = get_lesson(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    completed = get_completed_ids()
    prev_lesson, next_lesson = get_prev_next(lesson_id)

    # Load lesson content — prefer Markdown, fall back to HTML
    content_html = ''
    md_path = os.path.join(app.root_path, 'content', 'lessons', f'{lesson_id}.md')
    html_path = os.path.join(app.root_path, 'templates', 'lessons', f'{lesson_id}.html')

    if os.path.isfile(md_path):
        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                raw = f.read().strip()
            # Strip YAML frontmatter if present
            if raw.startswith('---'):
                parts = raw.split('---', 2)
                raw = parts[2].strip() if len(parts) >= 3 else raw
            content_html = markdown.markdown(raw, extensions=['fenced_code', 'tables'])
        except Exception:
            content_html = ''
    elif os.path.isfile(html_path):
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                content_html = f.read().strip()
        except Exception:
            content_html = ''

    response = {
        'lesson': dict(lesson),
        'completed': lesson_id in completed,
        'prev_lesson': prev_lesson,
        'next_lesson': next_lesson,
        'tier': lesson.get('tier', ''),
        'has_content': bool(content_html),
    }
    if content_html:
        response['lesson']['content_html'] = content_html
    return jsonify(response)

@app.route('/api/roadmap')
def api_roadmap():
    completed = get_completed_ids()
    roadmap_data = get_roadmap_data(completed)
    return jsonify(roadmap_data)

@app.route('/api/database')
def api_database():
    conn = get_db()
    tables = {}
    for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        tn = row['name']
        cols = conn.execute(f"PRAGMA table_info({tn})").fetchall()
        columns = [c['name'] for c in cols]
        rows_data = conn.execute(f"SELECT * FROM {tn}").fetchall()
        rows_dicts = [dict(r) for r in rows_data]
        tables[tn] = {'columns': columns, 'rows': rows_dicts}
    conn.close()
    return jsonify(tables)

@app.route('/api/python-run', methods=['POST'])
def api_python_run():
    code = request.get_json().get('code', '')
    if not code:
        return jsonify({'success': False, 'error': 'No code provided'}), 400
    result = run_python_code(code)
    return jsonify(result)

@app.route('/api/database-query', methods=['POST'])
def api_database_query():
    query = request.get_json().get('query', '')
    if not query.strip().upper().startswith(('SELECT', 'PRAGMA')):
        return jsonify({'error': 'Only SELECT and PRAGMA allowed', 'columns': [], 'rows': [], 'time': 0})
    conn = get_db()
    start = time.time()
    try:
        cursor = conn.execute(query)
        results = cursor.fetchall()
        elapsed = time.time() - start
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = [dict(r) for r in results]
        qr = {'columns': columns, 'rows': rows, 'time': elapsed, 'error': None}
    except Exception as e:
        qr = {'error': str(e), 'columns': [], 'rows': [], 'time': 0}
    conn.close()
    return jsonify(qr)

@app.route('/api/data-flow-submit', methods=['POST'])
def api_data_flow_submit():
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    topic = data.get('topic', 'General')
    message = data.get('message', '')
    conn = get_db()
    conn.execute("INSERT INTO data_flow_log (name, topic, message) VALUES (?, ?, ?)",
                 (name, topic, message))
    conn.commit()
    conn.close()
    trace = [
        {'icon': '🌐', 'title': 'HTTP Request Received',
         'code': f'POST /data-flow\nBody: name="{name}", topic="{topic}", message="{message}"', 'color': '#d97706'},
        {'icon': '🐍', 'title': 'Flask Receives Data',
         'code': f'name = request.form["name"]  # "{name}"', 'color': '#1a56db'},
        {'icon': '🗄️', 'title': 'Database INSERT',
         'code': f'INSERT INTO data_flow_log (name, topic, message)\nVALUES ("{name}", "{topic}", "{message}")', 'color': '#059669'},
        {'icon': '📄', 'title': 'HTML Response Sent',
         'code': 'render_template("data_flow.html", ...) → 200 OK', 'color': '#7c3aed'},
    ]
    return jsonify({'success': True, 'trace': trace})

@app.route('/api/rag-query', methods=['POST'])
def api_rag_query():
    query = request.get_json().get('query', '').strip()
    if not query:
        return jsonify({'error': 'Please enter a question!'}), 400
    result = rag_engine.ask(query)
    conn = get_db()
    conn.execute("INSERT INTO rag_queries (query, answer) VALUES (?, ?)",
                 (query, result['answer']))
    conn.commit()
    recent = conn.execute(
        "SELECT query, answer, created_at FROM rag_queries ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    recent_queries = [dict(r) for r in recent]
    conn.close()
    return jsonify({
        'query': query,
        'answer': result['answer'],
        'sources': result.get('sources', []),
        'recent_queries': recent_queries
    })

@app.route('/api/rag-recent')
def api_rag_recent():
    conn = get_db()
    recent = conn.execute(
        "SELECT query, answer, created_at FROM rag_queries ORDER BY created_at DESC LIMIT 10"
    ).fetchall()
    recent_queries = [dict(r) for r in recent]
    conn.close()
    return jsonify(recent_queries)

# ═══════════════════════════════════════════════════
# QUIZ API
# ═══════════════════════════════════════════════════

@app.route('/api/lesson/<lesson_id>/quiz')
def api_quiz_get(lesson_id):
    """Return quiz questions for a lesson (without correct answers)."""
    questions = get_quiz(lesson_id)
    if not questions:
        return jsonify({"questions": [], "has_quiz": False})
    # Strip correct answers before sending to client
    safe = [
        {k: v for k, v in q.items() if k != "correct"}
        for q in questions
    ]
    return jsonify({"questions": safe, "has_quiz": True, "total": len(safe)})


@app.route('/api/lesson/<lesson_id>/quiz/submit', methods=['POST'])
def api_quiz_submit(lesson_id):
    """Check quiz answers. Auto-mark lesson complete if passed."""
    data = request.get_json()
    answers = data.get('answers', [])
    if not isinstance(answers, list):
        return jsonify({"error": "answers must be an array of integers"}), 400

    result = check_answers(lesson_id, answers)
    if "error" in result:
        return jsonify(result), 400

    # Auto-mark complete if passed
    if result["passed"]:
        conn = get_db()
        existing = conn.execute(
            "SELECT * FROM lesson_progress WHERE lesson_id = ?", (lesson_id,)
        ).fetchone()
        if existing:
            conn.execute(
                "UPDATE lesson_progress SET completed = 1 WHERE lesson_id = ?", (lesson_id,)
            )
        else:
            conn.execute(
                "INSERT INTO lesson_progress (lesson_id, completed) VALUES (?, 1)", (lesson_id,)
            )
        conn.commit()
        conn.close()
        result["auto_completed"] = True

    return jsonify(result)


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ═══════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════

if __name__ == '__main__':
    print("[RAG Academy] Starting server at http://localhost:5000")
    print("[RAG Academy] Open your browser and visit: http://localhost:5000")
    print(f"[RAG Academy] Loaded {len(ALL_LESSONS)} lessons across {len(MODULES)} modules")
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
