"""
RAG ACADEMY - Complete Learning Platform
Covers Python, HTML/CSS, Flask, Databases, AI/LLMs, RAG, Vector DBs, LangChain, Career
"""
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import sqlite3
import os
import time
import json
from datetime import datetime

# Import our modules
from lessons_data import (
    MODULES, ALL_LESSONS, get_lesson, get_modules_with_progress,
    get_prev_next, get_tiers, get_roadmap_data
)
from rag_engine import SimpleRAGEngine
from python_runner import run_python_code

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

@app.route('/')
def home():
    completed = get_completed_ids()
    modules_data = get_modules_with_progress(completed)
    tiers_data = get_tiers()

    total = sum(len(m['lessons']) for m in modules_data)
    done = sum(1 for m in modules_data for l in m['lessons'] if l['completed'])
    percent = round((done / total) * 100) if total > 0 else 0

    return render_template('index.html', modules=modules_data,
                           tiers=tiers_data, total=total, done=done, percent=percent)


@app.route('/roadmap')
def roadmap():
    completed = get_completed_ids()
    roadmap_data = get_roadmap_data(completed)
    return render_template('roadmap.html', roadmap=roadmap_data)


@app.route('/lessons')
def lessons():
    completed = get_completed_ids()
    modules_data = get_modules_with_progress(completed)
    total = sum(len(m['lessons']) for m in modules_data)
    tier_filter = request.args.get('tier', '')
    return render_template('lessons.html', modules=modules_data,
                           total_lessons=total, tier_filter=tier_filter)


@app.route('/lesson/<lesson_id>')
def view_lesson(lesson_id):
    lesson = get_lesson(lesson_id)
    if not lesson:
        flash('Lesson not found!', 'error')
        return redirect(url_for('lessons'))

    completed = get_completed_ids()
    is_completed = lesson_id in completed
    prev_lesson, next_lesson = get_prev_next(lesson_id)

    return render_template('lesson_view.html', lesson=lesson,
                           completed=is_completed,
                           prev_lesson=prev_lesson, next_lesson=next_lesson,
                           tier=lesson.get('tier', ''))


@app.route('/mark-complete/<lesson_id>', methods=['POST'])
def mark_complete(lesson_id):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM lesson_progress WHERE lesson_id = ? AND user_id IS NULL", (lesson_id,)
    ).fetchone()
    if existing:
        new_status = 0 if existing['completed'] == 1 else 1
        conn.execute(
            "UPDATE lesson_progress SET completed = ? WHERE lesson_id = ? AND user_id IS NULL",
            (new_status, lesson_id)
        )
        flash('Progress updated!', 'success')
    else:
        conn.execute(
            "INSERT INTO lesson_progress (lesson_id, completed) VALUES (?, 1)",
            (lesson_id,)
        )
        flash('Lesson completed!', 'success')
    conn.commit()
    conn.close()
    return redirect(url_for('view_lesson', lesson_id=lesson_id))


@app.route('/resources')
def resources():
    return render_template('resources.html')


@app.route('/python-playground', methods=['GET', 'POST'])
def python_playground():
    output = None
    code = "print('Hello, RAG Academy!')\nprint(2 + 2)\n\n# Try your own code here:"
    error = None

    if request.method == 'POST':
        code = request.form.get('code', '')
        if code:
            result = run_python_code(code)
            output = result['output']
            if not result['success']:
                error = result['error']

    # Example codes for quick-load
    examples = {
        'hello': "print('Hello, World!')",
        'variables': "name = 'Armaghan'\nage = 20\nprint(f'My name is {name} and I am {age}')",
        'list': "fruits = ['apple', 'banana', 'cherry']\nfor i, f in enumerate(fruits):\n    print(f'{i}: {f}')",
        'function': "def greet(name):\n    return f'Hello, {name}!'\nprint(greet('Armaghan'))",
    }

    return render_template('python_playground.html', code=code,
                           output=output, error=error, examples=examples)


@app.route('/database')
def database_viewer():
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
    return render_template('database_viewer.html', tables=tables, query_result=None)


@app.route('/database/query', methods=['POST'])
def run_query():
    query = request.form.get('query', '')
    if not query.strip().upper().startswith(('SELECT', 'PRAGMA')):
        return render_template('database_viewer.html', tables={},
            query_result={'error': 'Only SELECT and PRAGMA allowed', 'columns': [], 'rows': [], 'time': 0})
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
    tables = {}
    for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        tn = row['name']
        cols = conn.execute(f"PRAGMA table_info({tn})").fetchall()
        columns = [c['name'] for c in cols]
        rdata = conn.execute(f"SELECT * FROM {tn}").fetchall()
        tables[tn] = {'columns': columns, 'rows': [dict(r) for r in rdata]}
    conn.close()
    return render_template('database_viewer.html', tables=tables, query_result=qr)


@app.route('/data-flow', methods=['GET', 'POST'])
def data_flow():
    flow_steps = [
        {'n': 1, 'icon': '🌐', 'title': 'Browser Request', 'desc': 'You type a URL or click submit. Browser creates an HTTP request.', 'color': '#d97706'},
        {'n': 2, 'icon': '📡', 'title': 'HTTP Transport', 'desc': 'Request travels via the internet. Uses GET to load, POST to send data.', 'color': '#7c3aed'},
        {'n': 3, 'icon': '🐍', 'title': 'Flask Route', 'desc': 'Flask matches the URL to @app.route(). Runs your Python function.', 'color': '#1a56db'},
        {'n': 4, 'icon': '⚙️', 'title': 'Business Logic', 'desc': 'Python processes data: validates, calls RAG, runs calculations.', 'color': '#059669'},
        {'n': 5, 'icon': '🗄️', 'title': 'Database', 'desc': 'Read or write to SQLite. Data persists beyond the request.', 'color': '#0d9488'},
        {'n': 6, 'icon': '📄', 'title': 'HTML Response', 'desc': 'Flask renders a template with data. Sends back as HTTP response.', 'color': '#1a56db'},
        {'n': 7, 'icon': '🖥️', 'title': 'Browser Renders', 'desc': 'Browser displays the HTML page. You see the result!', 'color': '#d97706'},
    ]

    trace = None
    if request.method == 'POST':
        name = request.form.get('name', 'Anonymous')
        topic = request.form.get('topic', 'General')
        message = request.form.get('message', '')
        conn = get_db()
        conn.execute("INSERT INTO data_flow_log (name, topic, message) VALUES (?, ?, ?)",
                     (name, topic, message))
        conn.commit()
        conn.close()
        trace = [
            {'icon': '🌐', 'title': 'HTTP Request Received',
             'code': 'POST /data-flow\nBody: name="' + name + '", topic="' + topic + '", message="' + message + '"', 'color': '#d97706'},
            {'icon': '🐍', 'title': 'Flask Receives Data',
             'code': 'name = request.form["name"]  # "' + name + '"', 'color': '#1a56db'},
            {'icon': '🗄️', 'title': 'Database INSERT',
             'code': 'INSERT INTO data_flow_log (name, topic, message)\nVALUES ("' + name + '", "' + topic + '", "' + message + '")', 'color': '#059669'},
            {'icon': '📄', 'title': 'HTML Response Sent',
             'code': 'render_template("data_flow.html", ...) → 200 OK\n→ Browser renders the updated page', 'color': '#7c3aed'},
        ]
        flash(f'Data flow complete! Your message was saved to the database.', 'success')

    return render_template('data_flow.html', flow_steps=flow_steps, trace=trace)


@app.route('/data-flow/submit', methods=['POST'])
def data_flow_submit():
    """Legacy endpoint - redirects to main data flow page."""
    name = request.form.get('name', 'Anonymous')
    topic = request.form.get('topic', 'General')
    message = request.form.get('message', '')
    conn = get_db()
    conn.execute("INSERT INTO data_flow_log (name, topic, message) VALUES (?, ?, ?)",
                 (name, topic, message))
    conn.commit()
    conn.close()
    flash(f'Data saved! Check the Database page.', 'success')
    return redirect(url_for('data_flow'))


@app.route('/rag-demo', methods=['GET', 'POST'])
def rag_demo():
    documents = rag_engine.documents
    conn = get_db()
    recent = conn.execute(
        "SELECT query, answer, created_at FROM rag_queries ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    recent_queries = [dict(r) for r in recent]
    conn.close()

    if request.method == 'POST':
        query = request.form.get('query', '').strip()
        if not query:
            flash('Please enter a question!', 'warning')
            return render_template('rag_demo.html', documents=documents, recent_queries=recent_queries)

        result = rag_engine.ask(query)
        conn = get_db()
        conn.execute("INSERT INTO rag_queries (query, answer) VALUES (?, ?)",
                     (query, result['answer']))
        conn.commit()
        conn.close()

        return render_template('rag_demo.html', documents=documents,
                               query=query, result=result)

    return render_template('rag_demo.html', documents=documents, recent_queries=recent_queries)


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
    return jsonify({
        'lesson': lesson,
        'completed': lesson_id in completed,
        'prev_lesson': prev_lesson,
        'next_lesson': next_lesson,
        'tier': lesson.get('tier', '')
    })

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

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


# ═══════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════

if __name__ == '__main__':
    print("[RAG Academy] Starting server at http://localhost:5000")
    print("[RAG Academy] Open your browser and visit: http://localhost:5000")
    print(f"[RAG Academy] Loaded {len(ALL_LESSONS)} lessons across {len(MODULES)} modules")
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
