# -*- coding: utf-8 -*-
"""
RAG ACADEMY - Lesson Data Index
Simple module that indexes all lessons and their metadata.
Lesson content is stored in templates/lessons/*.html
"""

MODULES = [
    {
        "id": "setup", "title": "Welcome & Setup", "icon": "🚀",
        "description": "Set up Python, VS Code, Git, and learn how this app works.",
        "order": 0,
        "lessons": [
            {"id": "welcome", "title": "Welcome to RAG Academy", "icon": "🚀", "desc": "How this app works and what you will learn"},
            {"id": "install_setup", "title": "Installing Python & VS Code", "icon": "💻", "desc": "Set up your development environment"},
            {"id": "first_program", "title": "Your First Python Program", "icon": "🎯", "desc": "Write and run your first code"},
            {"id": "git_basics", "title": "Git & GitHub Basics", "icon": "📦", "desc": "Version control for your code"},
        ]
    },
    {
        "id": "python", "title": "Python Fundamentals", "icon": "🐍",
        "description": "From zero to confident Python coder - variables, loops, functions, OOP",
        "order": 1,
        "lessons": [
            {"id": "py_variables", "title": "Variables & Data Types", "icon": "🔤", "desc": "Strings, integers, floats, booleans"},
            {"id": "py_strings", "title": "Strings & String Methods", "icon": "📝", "desc": "Text manipulation and f-strings"},
            {"id": "py_lists", "title": "Lists & Tuples", "icon": "📦", "desc": "Ordered collections of data"},
            {"id": "py_dicts", "title": "Dictionaries & Sets", "icon": "📖", "desc": "Key-value pairs and unique items"},
            {"id": "py_conditionals", "title": "Conditionals (if/elif/else)", "icon": "⚖️", "desc": "Make decisions in your code"},
            {"id": "py_loops", "title": "Loops (for & while)", "icon": "🔄", "desc": "Repeat operations efficiently"},
            {"id": "py_functions", "title": "Functions", "icon": "⚙️", "desc": "Reusable blocks of code"},
            {"id": "py_file_io", "title": "File I/O", "icon": "📂", "desc": "Read and write files"},
            {"id": "py_errors", "title": "Exception Handling", "icon": "🛡️", "desc": "Handle errors gracefully"},
            {"id": "py_comprehensions", "title": "List Comprehensions", "icon": "✨", "desc": "Create lists in one clean line"},
            {"id": "py_lambda", "title": "Lambda Functions", "icon": "λ", "desc": "Anonymous functions"},
            {"id": "py_modules", "title": "Modules, pip & Virtual Envs", "icon": "📦", "desc": "Install packages and manage dependencies"},
            {"id": "py_oop", "title": "Classes & OOP", "icon": "🏗️", "desc": "Object-oriented programming"},
            {"id": "py_numpy", "title": "NumPy Basics", "icon": "📐", "desc": "Numerical computing for vectors"},
            {"id": "py_json_csv", "title": "JSON & CSV", "icon": "📊", "desc": "Data exchange formats"},
            {"id": "py_debugging", "title": "Debugging Techniques", "icon": "🔍", "desc": "Find and fix bugs"},
            {"id": "py_clean_code", "title": "Writing Clean Code", "icon": "🧹", "desc": "Readable, maintainable Python"},
        ]
    },
    {
        "id": "html_css", "title": "HTML & CSS Basics", "icon": "🎨",
        "description": "Build web pages and understand how data enters your app.",
        "order": 2,
        "lessons": [
            {"id": "html_structure", "title": "HTML Document Structure", "icon": "📄", "desc": "Every web page starts here"},
            {"id": "html_tags", "title": "Common HTML Tags", "icon": "🏷️", "desc": "Headings, paragraphs, links, lists"},
            {"id": "html_forms", "title": "HTML Forms & Data Flow", "icon": "📝", "desc": "How data gets from browser to server"},
            {"id": "css_selectors", "title": "CSS Selectors & Properties", "icon": "🎨", "desc": "Colors, fonts, spacing"},
            {"id": "css_box_model", "title": "CSS Box Model", "icon": "📦", "desc": "The most important CSS concept"},
            {"id": "css_layout", "title": "CSS Layout (Flexbox & Grid)", "icon": "📐", "desc": "Position elements on the page"},
            {"id": "ui_mockup", "title": "Building a Professional UI", "icon": "🖥️", "desc": "Combine HTML and CSS"},
        ]
    },
    {
        "id": "flask", "title": "Flask Web Framework", "icon": "🐍",
        "description": "Turn Python into a web server.",
        "order": 3,
        "lessons": [
            {"id": "flask_intro", "title": "What is Flask?", "icon": "🐍", "desc": "Python web framework basics"},
            {"id": "flask_routes", "title": "Routes & Views", "icon": "🗺️", "desc": "Map URLs to Python functions"},
            {"id": "flask_templates", "title": "Jinja2 Templates", "icon": "📄", "desc": "Embed Python in HTML"},
            {"id": "flask_forms", "title": "Handling Form Submissions", "icon": "📝", "desc": "The complete data flow"},
        ]
    },
    {
        "id": "databases", "title": "Databases & SQL", "icon": "🗄️",
        "description": "Store and retrieve data permanently with SQLite and PostgreSQL.",
        "order": 4,
        "lessons": [
            {"id": "db_what", "title": "What are Databases?", "icon": "🗄️", "desc": "Tables, rows, columns, SQL"},
            {"id": "db_crud", "title": "CRUD Operations", "icon": "📝", "desc": "INSERT, SELECT, UPDATE, DELETE"},
            {"id": "db_python", "title": "SQLite from Python", "icon": "🐍", "desc": "Connect Python to a database"},
            {"id": "db_flask", "title": "Flask + SQLite Integration", "icon": "🔗", "desc": "Full-stack database app"},
        ]
    },
    {
        "id": "ai_llm", "title": "AI & LLM Fundamentals", "icon": "🤖",
        "description": "Understand LLMs, embeddings, APIs, and prompt engineering.",
        "order": 5,
        "lessons": [
            {"id": "llm_what", "title": "What are LLMs?", "icon": "🤖", "desc": "How ChatGPT and AI models work"},
            {"id": "prompt_eng", "title": "Prompt Engineering", "icon": "🎯", "desc": "Write effective prompts"},
            {"id": "api_keys", "title": "Getting API Keys", "icon": "🔑", "desc": "Set up free LLM accounts"},
            {"id": "embeddings", "title": "Embeddings & Cosine Similarity", "icon": "📐", "desc": "Convert text to vectors"},
        ]
    },
    {
        "id": "rag_scratch", "title": "RAG from Scratch", "icon": "🔍",
        "description": "Build a complete RAG pipeline from the ground up.",
        "order": 6,
        "lessons": [
            {"id": "rag_architecture", "title": "The RAG Architecture", "icon": "🏗️", "desc": "Retrieve-Augment-Generate"},
            {"id": "chunking", "title": "Document Chunking", "icon": "🧩", "desc": "Split documents into pieces"},
            {"id": "rag_pipeline_full", "title": "Complete RAG Pipeline", "icon": "🔧", "desc": "Build RAG from scratch"},
            {"id": "rag_evaluation", "title": "RAG Evaluation", "icon": "📊", "desc": "Measure RAG quality with RAGAS"},
        ]
    },
    {
        "id": "vector_dbs", "title": "Vector Databases", "icon": "📐",
        "description": "ChromaDB, FAISS, Pinecone - store and search embeddings.",
        "order": 7,
        "lessons": [
            {"id": "chromadb", "title": "ChromaDB Fundamentals", "icon": "💜", "desc": "The easiest vector database"},
            {"id": "faiss", "title": "FAISS Vector Search", "icon": "⚡", "desc": "High-performance vector search"},
        ]
    },
    {
        "id": "langchain", "title": "LangChain Framework", "icon": "⛓️",
        "description": "Industry-standard framework for RAG applications.",
        "order": 8,
        "lessons": [
            {"id": "langchain_intro", "title": "LangChain Overview", "icon": "⛓️", "desc": "RAG framework fundamentals"},
            {"id": "langchain_chains", "title": "Chains & RetrievalQA", "icon": "🔗", "desc": "Build RAG chains"},
        ]
    },
    {
        "id": "advanced_rag", "title": "Advanced RAG Techniques", "icon": "⚡",
        "description": "Hybrid search, reranking, evaluation, production RAG.",
        "order": 9,
        "lessons": [
            {"id": "advanced_rag", "title": "Advanced RAG Overview", "icon": "⚡", "desc": "Hybrid search, reranking, agents"},
        ]
    },
    {
        "id": "career", "title": "Portfolio & Career", "icon": "💼",
        "description": "Build projects, earn certifications, land freelance clients.",
        "order": 10,
        "lessons": [
            {"id": "career_guide", "title": "Career & Portfolio Guide", "icon": "💼", "desc": "Projects, freelancing, earning"},
        ]
    },
]

# Build lookup
ALL_LESSONS = {}
for module in MODULES:
    for lesson in module["lessons"]:
        ALL_LESSONS[lesson["id"]] = lesson


def get_lesson(lid):
    return ALL_LESSONS.get(lid)

def get_modules_with_progress(completed_ids=None):
    if completed_ids is None:
        completed_ids = set()
    result = []
    for m in MODULES:
        mod = dict(m)
        mod["lessons"] = [
            {**l, "completed": l["id"] in completed_ids}
            for l in m["lessons"]
        ]
        result.append(mod)
    return result

def get_prev_next(lid):
    ordered = []
    for m in MODULES:
        for l in m["lessons"]:
            ordered.append(l["id"])
    try:
        idx = ordered.index(lid)
        return (ordered[idx-1] if idx > 0 else None,
                ordered[idx+1] if idx < len(ordered)-1 else None)
    except ValueError:
        return None, None

print(f"[lessons_data] Loaded {len(ALL_LESSONS)} lessons across {len(MODULES)} modules")
