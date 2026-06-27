# -*- coding: utf-8 -*-
"""
RAG ACADEMY - Spiral Curriculum Lesson Index
=============================================
SPIRAL DESIGN: Every topic appears at multiple tiers with increasing depth.

  Junior  (🌱 Foundations)  — Intro exposure to ALL topics
  Mid     (⚡ Practitioner) — Deeper practical skills across ALL topics
  Senior  (🔬 Engineer)     — Advanced patterns across ALL topics
  Expert  (🏗️ Architect)    — Cutting-edge across ALL topics
  Bonus   (💼 Career)       — Portfolio, interviews, specialized deployments

Lesson content is stored in templates/lessons/*.html
"""

# ═══════════════════════════════════════════════════════════════════════
# TIER DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════

TIERS = [
    {
        "id": "junior", "title": "🌱 Foundations", "subtitle": "Junior Tier",
        "icon": "🌱",
        "color": "#22c55e",  # green
        "description": "Intro-level exposure to every topic — build your foundation across the full stack.",
    },
    {
        "id": "mid", "title": "⚡ Practitioner", "subtitle": "Mid Tier",
        "icon": "⚡",
        "color": "#3b82f6",  # blue
        "description": "Deeper practical skills — build real things, work with APIs, create pipelines.",
    },
    {
        "id": "senior", "title": "🔬 Engineer", "subtitle": "Senior Tier",
        "icon": "🔬",
        "color": "#8b5cf6",  # purple
        "description": "Advanced patterns — hybrid search, streaming, caching, security, production RAG.",
    },
    {
        "id": "expert", "title": "🏗️ Architect", "subtitle": "Expert Tier",
        "icon": "🏗️",
        "color": "#f59e0b",  # amber
        "description": "Cutting-edge — agentic RAG, multi-modal RAG, GraphRAG, RAG at scale.",
    },
    {
        "id": "bonus", "title": "💼 Career", "subtitle": "Bonus Tier",
        "icon": "💼",
        "color": "#ef4444",  # red
        "description": "Portfolio projects, interview prep, freelancing, specialized deployments.",
    },
]

# ═══════════════════════════════════════════════════════════════════════
# MODULES — Single source of truth
# ═══════════════════════════════════════════════════════════════════════
#
# Each module is a topic area that spans multiple tiers.
# Lesson IDs are globally unique. Existing IDs from v1 are preserved.
#
# Tier distribution (spiral — each topic appears in multiple tiers):
#   Junior  ~28 lessons   Mid     ~28 lessons   Senior  ~22 lessons
#   Expert  ~18 lessons   Bonus    ~6 lessons
#   Total   ~102 lessons

MODULES = [
    # ═══════════════════════════════════════════════════════════════
    # MODULE 0: Getting Started
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "setup", "title": "Getting Started", "icon": "🚀",
        "tier": "junior",
        "description": "Set up Python, VS Code, Git, and learn how this app works.",
        "order": 0,
        "lessons": [
            {"id": "welcome", "title": "Welcome to RAG Academy", "icon": "🚀",
             "desc": "How this app works and what you will learn",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 10,
             "prerequisites": [], "tags": ["setup", "intro"]},
            {"id": "install_setup", "title": "Installing Python & VS Code", "icon": "💻",
             "desc": "Set up your development environment",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": [], "tags": ["setup", "tools"]},
            {"id": "first_program", "title": "Your First Python Program", "icon": "🎯",
             "desc": "Write and run your first code",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["install_setup"], "tags": ["setup", "python"]},
            {"id": "git_basics", "title": "Git & GitHub Basics", "icon": "📦",
             "desc": "Version control for your code",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["install_setup"], "tags": ["setup", "git"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 1: Python Engineering
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "python", "title": "Python Engineering", "icon": "🐍",
        "tier": "junior",
        "description": "From zero to confident Python coder — variables, loops, functions, OOP, async.",
        "order": 1,
        "lessons": [
            # ── Junior: Python Basics ──
            {"id": "py_variables", "title": "Variables & Data Types", "icon": "🔤",
             "desc": "Strings, integers, floats, booleans",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["first_program"], "tags": ["python", "basics"]},
            {"id": "py_strings", "title": "Strings & String Methods", "icon": "📝",
             "desc": "Text manipulation and f-strings",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["py_variables"], "tags": ["python", "basics"]},
            {"id": "py_lists", "title": "Lists & Tuples", "icon": "📦",
             "desc": "Ordered collections of data",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_variables"], "tags": ["python", "basics"]},
            {"id": "py_dicts", "title": "Dictionaries & Sets", "icon": "📖",
             "desc": "Key-value pairs and unique items",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_lists"], "tags": ["python", "basics"]},
            {"id": "py_conditionals", "title": "Conditionals (if/elif/else)", "icon": "⚖️",
             "desc": "Make decisions in your code",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["py_variables"], "tags": ["python", "basics"]},
            {"id": "py_loops", "title": "Loops (for & while)", "icon": "🔄",
             "desc": "Repeat operations efficiently",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_conditionals"], "tags": ["python", "basics"]},
            {"id": "py_functions", "title": "Functions", "icon": "⚙️",
             "desc": "Reusable blocks of code",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 25,
             "prerequisites": ["py_loops"], "tags": ["python", "basics"]},
            {"id": "py_file_io", "title": "File I/O", "icon": "📂",
             "desc": "Read and write files",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_functions"], "tags": ["python", "basics"]},
            {"id": "py_errors", "title": "Exception Handling", "icon": "🛡️",
             "desc": "Handle errors gracefully",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_functions"], "tags": ["python", "basics"]},

            # ── Mid: Practical Python ──
            {"id": "py_comprehensions", "title": "List Comprehensions", "icon": "✨",
             "desc": "Create lists in one clean line",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 20,
             "prerequisites": ["py_lists", "py_loops"], "tags": ["python", "advanced"]},
            {"id": "py_lambda", "title": "Lambda Functions", "icon": "λ",
             "desc": "Anonymous functions for concise code",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 15,
             "prerequisites": ["py_functions"], "tags": ["python", "functional"]},
            {"id": "py_modules", "title": "Modules, pip & Virtual Envs", "icon": "📦",
             "desc": "Install packages and manage dependencies",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["py_functions"], "tags": ["python", "tools"]},
            {"id": "py_oop", "title": "Classes & OOP", "icon": "🏗️",
             "desc": "Object-oriented programming",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 30,
             "prerequisites": ["py_functions", "py_dicts"], "tags": ["python", "oop"]},
            {"id": "py_numpy", "title": "NumPy Basics", "icon": "📐",
             "desc": "Numerical computing for vectors",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["py_lists", "py_modules"], "tags": ["python", "data"]},
            {"id": "py_debugging", "title": "Debugging Techniques", "icon": "🔍",
             "desc": "Find and fix bugs",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_functions"], "tags": ["python", "tools"]},
            {"id": "py_json_csv", "title": "JSON & CSV", "icon": "📊",
             "desc": "Data exchange formats",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["py_file_io", "py_dicts"], "tags": ["python", "data"]},

            # ── Senior: Advanced Python ──
            {"id": "py_clean_code", "title": "Writing Clean Code", "icon": "🧹",
             "desc": "Readable, maintainable Python — PEP 8, SOLID, design patterns",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["py_oop"], "tags": ["python", "best-practices"]},
            {"id": "py_type_hints", "title": "Type Hints & mypy", "icon": "🏷️",
             "desc": "Static type checking for production Python",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 20,
             "prerequisites": ["py_oop"], "tags": ["python", "types"]},
            {"id": "py_testing", "title": "Testing with pytest", "icon": "🧪",
             "desc": "Unit tests, fixtures, mocking for production code",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["py_oop", "py_modules"], "tags": ["python", "testing"]},
            {"id": "py_async", "title": "Async Python & asyncio", "icon": "⚡",
             "desc": "Concurrent programming for high-performance apps",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["py_oop", "py_modules"], "tags": ["python", "async"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 2: Web Foundations
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "web", "title": "Web Foundations", "icon": "🎨",
        "tier": "junior",
        "description": "Build web pages with HTML & CSS and understand how data enters your app.",
        "order": 2,
        "lessons": [
            # ── Junior: HTML Basics ──
            {"id": "html_structure", "title": "HTML Document Structure", "icon": "📄",
             "desc": "Every web page starts here",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["first_program"], "tags": ["web", "html"]},
            {"id": "html_tags", "title": "Common HTML Tags", "icon": "🏷️",
             "desc": "Headings, paragraphs, links, lists",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["html_structure"], "tags": ["web", "html"]},
            {"id": "html_forms", "title": "HTML Forms & Data Flow", "icon": "📝",
             "desc": "How data gets from browser to server",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["html_tags"], "tags": ["web", "html", "forms"]},

            # ── Mid: CSS & Styling ──
            {"id": "css_selectors", "title": "CSS Selectors & Properties", "icon": "🎨",
             "desc": "Colors, fonts, spacing",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 20,
             "prerequisites": ["html_tags"], "tags": ["web", "css"]},
            {"id": "css_box_model", "title": "CSS Box Model", "icon": "📦",
             "desc": "The most important CSS concept",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 20,
             "prerequisites": ["css_selectors"], "tags": ["web", "css"]},
            {"id": "css_layout", "title": "CSS Layout (Flexbox & Grid)", "icon": "📐",
             "desc": "Position elements on the page",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["css_box_model"], "tags": ["web", "css"]},
            {"id": "ui_mockup", "title": "Building a Professional UI", "icon": "🖥️",
             "desc": "Combine HTML and CSS into polished interfaces",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 30,
             "prerequisites": ["css_layout", "html_forms"], "tags": ["web", "ui"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 3: Flask & Web Servers
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "flask", "title": "Flask & Web Servers", "icon": "🌐",
        "tier": "junior",
        "description": "Turn Python into a web server — from routes to production middleware.",
        "order": 3,
        "lessons": [
            # ── Junior: Flask Basics ──
            {"id": "flask_intro", "title": "What is Flask?", "icon": "🌐",
             "desc": "Python web framework basics",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["py_functions", "html_structure"], "tags": ["flask", "web"]},
            {"id": "flask_routes", "title": "Routes & Views", "icon": "🗺️",
             "desc": "Map URLs to Python functions",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["flask_intro"], "tags": ["flask", "web"]},

            # ── Mid: Flask APIs ──
            {"id": "flask_templates", "title": "Jinja2 Templates", "icon": "📄",
             "desc": "Embed Python in HTML",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["flask_routes", "html_tags"], "tags": ["flask", "templates"]},
            {"id": "flask_forms", "title": "Handling Form Submissions", "icon": "📝",
             "desc": "The complete data flow from browser to server",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["flask_templates", "html_forms"], "tags": ["flask", "forms"]},

            # ── Senior: Production Flask ──
            {"id": "flask_middleware", "title": "Flask Middleware & Auth", "icon": "🔐",
             "desc": "Request/response hooks, authentication, error handling",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["flask_forms", "py_debugging"], "tags": ["flask", "security"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 4: Databases & SQL
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "databases", "title": "Databases & SQL", "icon": "🗄️",
        "tier": "junior",
        "description": "Store and retrieve data with SQLite, PostgreSQL, and vector databases.",
        "order": 4,
        "lessons": [
            # ── Junior: SQL Basics ──
            {"id": "db_what", "title": "What are Databases?", "icon": "🗄️",
             "desc": "Tables, rows, columns, SQL",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["py_variables"], "tags": ["databases", "sql"]},
            {"id": "db_crud", "title": "CRUD Operations", "icon": "📝",
             "desc": "INSERT, SELECT, UPDATE, DELETE",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 20,
             "prerequisites": ["db_what"], "tags": ["databases", "sql"]},

            # ── Mid: SQL in Practice ──
            {"id": "db_python", "title": "SQLite from Python", "icon": "🐍",
             "desc": "Connect Python to a database",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["db_crud", "py_functions"], "tags": ["databases", "python"]},
            {"id": "db_flask", "title": "Flask + SQLite Integration", "icon": "🔗",
             "desc": "Full-stack database app",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["db_python", "flask_routes"], "tags": ["databases", "flask"]},

            # ── Senior: PostgreSQL & Vector Stores ──
            {"id": "db_pgvector", "title": "PostgreSQL + pgvector", "icon": "🐘",
             "desc": "Vector search inside PostgreSQL",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["db_flask", "chromadb"], "tags": ["databases", "vectors"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 5: AI & LLM Fundamentals
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "ai_llm", "title": "AI & LLM Fundamentals", "icon": "🤖",
        "tier": "junior",
        "description": "Understand LLMs, embeddings, APIs, and prompt engineering.",
        "order": 5,
        "lessons": [
            # ── Junior: LLM Concepts ──
            {"id": "llm_what", "title": "What are LLMs?", "icon": "🤖",
             "desc": "How ChatGPT and AI models work",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["py_variables"], "tags": ["ai", "llm"]},
            {"id": "prompt_eng", "title": "Prompt Engineering Basics", "icon": "🎯",
             "desc": "Write effective prompts",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["llm_what"], "tags": ["ai", "prompts"]},

            # ── Mid: Working with LLM APIs ──
            {"id": "api_keys", "title": "Getting API Keys", "icon": "🔑",
             "desc": "Set up free LLM accounts (OpenAI, Anthropic, Cohere)",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 15,
             "prerequisites": ["llm_what"], "tags": ["ai", "apis"]},
            {"id": "llm_apis", "title": "Calling LLM APIs from Python", "icon": "📡",
             "desc": "OpenAI SDK, Anthropic SDK, streaming responses",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["api_keys", "py_modules"], "tags": ["ai", "apis"]},
            {"id": "llm_tokenization", "title": "Tokenization & Context Windows", "icon": "🧮",
             "desc": "How text becomes tokens, context limits, cost estimation",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["llm_apis"], "tags": ["ai", "tokenization"]},
            {"id": "embeddings", "title": "Embeddings & Cosine Similarity", "icon": "📐",
             "desc": "Convert text to vectors and measure similarity",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["py_numpy", "llm_what"], "tags": ["ai", "embeddings"]},
            {"id": "embeddings_deep", "title": "Embeddings Deep Dive", "icon": "🔬",
             "desc": "Open-source vs API embeddings, dimensionality, choosing models",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["embeddings"], "tags": ["ai", "embeddings"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 6: RAG Pipeline
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "rag", "title": "RAG Pipeline", "icon": "🔍",
        "tier": "junior",
        "description": "Retrieval-Augmented Generation — from basic concepts to cutting-edge architectures.",
        "order": 6,
        "lessons": [
            # ── Junior: RAG Concepts ──
            {"id": "rag_what", "title": "What is RAG?", "icon": "💡",
             "desc": "Retrieval-Augmented Generation explained simply",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["llm_what"], "tags": ["rag", "concepts"]},

            # ── Mid: Building RAG ──
            {"id": "rag_architecture", "title": "The RAG Architecture", "icon": "🏗️",
             "desc": "Retrieve-Augment-Generate: the full pipeline",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["rag_what", "embeddings"], "tags": ["rag", "architecture"]},
            {"id": "chunking", "title": "Document Chunking", "icon": "🧩",
             "desc": "Split documents into pieces — strategies and trade-offs",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["rag_architecture"], "tags": ["rag", "chunking"]},
            {"id": "rag_pipeline_full", "title": "Complete RAG Pipeline", "icon": "🔧",
             "desc": "Build RAG from scratch — ingestion to query",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 30,
             "prerequisites": ["chunking", "chromadb"], "tags": ["rag", "pipeline"]},
            {"id": "rag_evaluation", "title": "RAG Evaluation", "icon": "📊",
             "desc": "Measure RAG quality with RAGAS",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full"], "tags": ["rag", "evaluation"]},

            # ── Senior: Advanced RAG ──
            {"id": "advanced_rag", "title": "Advanced RAG Overview", "icon": "⚡",
             "desc": "Hybrid search, reranking, streaming, production patterns",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full"], "tags": ["rag", "advanced"]},
            {"id": "rag_hybrid", "title": "Hybrid Search", "icon": "🔀",
             "desc": "Combine sparse (BM25) and dense (vector) retrieval",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "hybrid"]},
            {"id": "rag_rerank", "title": "Reranking & Cross-Encoders", "icon": "📈",
             "desc": "Improve retrieval precision with second-pass scoring",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "reranking"]},
            {"id": "rag_multihop", "title": "Multi-Hop Retrieval", "icon": "🪜",
             "desc": "Answer questions that require multiple retrieval steps",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["rag_hybrid"], "tags": ["rag", "multihop"]},
            {"id": "rag_query_xform", "title": "Query Transformation", "icon": "🔄",
             "desc": "Rewrite, expand, and decompose user queries for better retrieval",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "query"]},
            {"id": "rag_parent_doc", "title": "Parent Document Retriever", "icon": "📑",
             "desc": "Retrieve small chunks, return larger parent documents",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["chunking", "rag_hybrid"], "tags": ["rag", "retrieval"]},
            {"id": "rag_streaming", "title": "Streaming RAG", "icon": "🌊",
             "desc": "Real-time token-by-token RAG responses",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full", "llm_apis"], "tags": ["rag", "streaming"]},
            {"id": "rag_cache", "title": "Semantic Caching", "icon": "💾",
             "desc": "Cache similar queries to reduce cost and latency",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full", "embeddings"], "tags": ["rag", "caching"]},
            {"id": "rag_observe", "title": "RAG Observability", "icon": "🔭",
             "desc": "Monitor, trace, and debug RAG pipelines in production",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full"], "tags": ["rag", "observability"]},
            {"id": "rag_eval_adv", "title": "Advanced RAG Evaluation", "icon": "📊",
             "desc": "Faithfulness, relevance, context precision — comprehensive metrics",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["rag_evaluation"], "tags": ["rag", "evaluation"]},

            # ── Expert: Cutting-Edge RAG ──
            {"id": "agentic_rag_intro", "title": "Agentic RAG: Concepts", "icon": "🤖",
             "desc": "RAG systems that plan, reason, and use tools autonomously",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag", "langchain_tools"], "tags": ["rag", "agents"]},
            {"id": "agentic_rag_tools", "title": "Agentic RAG: Tool Use", "icon": "🔧",
             "desc": "Giving RAG agents search, calculator, and database tools",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["agentic_rag_intro"], "tags": ["rag", "agents"]},
            {"id": "agentic_rag_multi", "title": "Agentic RAG: Multi-Agent", "icon": "👥",
             "desc": "Multiple specialized agents collaborating on complex queries",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["agentic_rag_tools"], "tags": ["rag", "agents"]},
            {"id": "agentic_rag_patterns", "title": "Agentic RAG: Patterns", "icon": "🧩",
             "desc": "Self-RAG, corrective RAG, adaptive RAG — production patterns",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["agentic_rag_multi"], "tags": ["rag", "agents"]},
            {"id": "mm_rag_images", "title": "Multi-Modal RAG: Images", "icon": "🖼️",
             "desc": "Retrieve and generate using both text and images",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "multimodal"]},
            {"id": "mm_rag_audio", "title": "Multi-Modal RAG: Audio", "icon": "🎵",
             "desc": "Speech-to-text, audio embeddings, voice RAG",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["mm_rag_images"], "tags": ["rag", "multimodal"]},
            {"id": "mm_rag_video", "title": "Multi-Modal RAG: Video", "icon": "🎬",
             "desc": "Frame extraction, temporal indexing, video Q&A",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["mm_rag_images"], "tags": ["rag", "multimodal"]},
            {"id": "mm_rag_tables", "title": "Multi-Modal RAG: Tables", "icon": "📋",
             "desc": "Retrieve structured data from tables and spreadsheets",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 25,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "multimodal"]},
            {"id": "graphrag_concepts", "title": "GraphRAG: Concepts", "icon": "🕸️",
             "desc": "Knowledge graphs for retrieval — entities, relationships, communities",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "graphrag"]},
            {"id": "graphrag_neo4j", "title": "GraphRAG: Neo4j & Cypher", "icon": "💎",
             "desc": "Store and query knowledge graphs with Neo4j",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["graphrag_concepts"], "tags": ["rag", "graphrag"]},
            {"id": "graphrag_build", "title": "GraphRAG: Full Implementation", "icon": "🏗️",
             "desc": "Build an end-to-end GraphRAG pipeline",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 35,
             "prerequisites": ["graphrag_neo4j"], "tags": ["rag", "graphrag"]},
            {"id": "ft_plus_rag", "title": "Fine-Tuning + RAG", "icon": "🎛️",
             "desc": "When to fine-tune vs. when to use RAG — and how to combine them",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag", "llm_apis"], "tags": ["rag", "finetuning"]},
            {"id": "longctx_vs_rag", "title": "Long Context vs. RAG", "icon": "📏",
             "desc": "Trade-offs between large context windows and retrieval",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 25,
             "prerequisites": ["advanced_rag", "llm_tokenization"], "tags": ["rag", "architecture"]},
            {"id": "rag_routing", "title": "Query Routing", "icon": "🧭",
             "desc": "Route queries to the right retriever or data source",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 25,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "routing"]},
            {"id": "rag_conv_mem", "title": "Conversational Memory for RAG", "icon": "🧠",
             "desc": "Maintain context across multi-turn RAG conversations",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 25,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "memory"]},
            {"id": "rag_benchmark", "title": "Benchmarking RAG (BEIR/MTEB)", "icon": "📊",
             "desc": "Standard benchmarks for retrieval and embedding evaluation",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["rag_eval_adv"], "tags": ["rag", "benchmarking"]},
            {"id": "rag_at_scale", "title": "RAG at Scale", "icon": "📡",
             "desc": "Millions of documents — partitioning, distributed retrieval, cost",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["rag_cache", "rag_observe"], "tags": ["rag", "scale"]},
            {"id": "rag_for_code", "title": "RAG for Code", "icon": "💻",
             "desc": "Code-aware chunking, AST-based retrieval, code generation RAG",
             "tier": "expert", "difficulty": "expert", "estimated_minutes": 30,
             "prerequisites": ["advanced_rag"], "tags": ["rag", "code"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 7: Vector Databases
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "vector_dbs", "title": "Vector Databases", "icon": "📐",
        "tier": "junior",
        "description": "Store and search embeddings — ChromaDB, FAISS, Pinecone, pgvector.",
        "order": 7,
        "lessons": [
            # ── Junior: Concepts ──
            {"id": "vectordb_what", "title": "What are Vector Databases?", "icon": "❓",
             "desc": "How vector search works and why it matters for RAG",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["rag_what"], "tags": ["vector-db", "concepts"]},

            # ── Mid: Practical Vector DBs ──
            {"id": "chromadb", "title": "ChromaDB Fundamentals", "icon": "💜",
             "desc": "The easiest vector database — install, index, query",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["vectordb_what", "embeddings"], "tags": ["vector-db", "chromadb"]},
            {"id": "faiss", "title": "FAISS Vector Search", "icon": "⚡",
             "desc": "High-performance vector search from Meta",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["vectordb_what", "embeddings"], "tags": ["vector-db", "faiss"]},

            # ── Senior: Managed Vector DBs ──
            {"id": "vectordb_pinecone", "title": "Pinecone: Managed Vector DB", "icon": "🌲",
             "desc": "Production-grade serverless vector database",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["chromadb", "faiss"], "tags": ["vector-db", "pinecone"]},

            # ── Bonus: Specialized Deployments ──
            {"id": "vectordb_supabase", "title": "Supabase pgvector Stack", "icon": "⚡",
             "desc": "Full-stack RAG with Supabase — auth, storage, pgvector",
             "tier": "bonus", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["db_pgvector", "chromadb"], "tags": ["vector-db", "supabase"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 8: LLM Frameworks
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "frameworks", "title": "LLM Frameworks", "icon": "⛓️",
        "tier": "junior",
        "description": "LangChain, LlamaIndex — industry-standard frameworks for RAG apps.",
        "order": 8,
        "lessons": [
            # ── Junior: Concepts ──
            {"id": "langchain_what", "title": "What is LangChain?", "icon": "⛓️",
             "desc": "LLM framework fundamentals — why frameworks matter",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["rag_what"], "tags": ["frameworks", "langchain"]},

            # ── Mid: Framework Skills ──
            {"id": "langchain_intro", "title": "LangChain Overview", "icon": "⛓️",
             "desc": "RAG framework fundamentals — chains, prompts, parsers",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["langchain_what", "rag_pipeline_full"], "tags": ["frameworks", "langchain"]},
            {"id": "langchain_chains", "title": "Chains & RetrievalQA", "icon": "🔗",
             "desc": "Build RAG chains with LangChain",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 30,
             "prerequisites": ["langchain_intro"], "tags": ["frameworks", "langchain"]},
            {"id": "langchain_tools", "title": "LangChain Tools & Agents", "icon": "🔧",
             "desc": "Give LLMs the ability to call APIs, search, and compute",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 30,
             "prerequisites": ["langchain_chains"], "tags": ["frameworks", "langchain"]},
            {"id": "llamaindex_intro", "title": "LlamaIndex Introduction", "icon": "🦙",
             "desc": "Data framework for LLM apps — ingestion, indexing, querying",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["langchain_intro"], "tags": ["frameworks", "llamaindex"]},

            # ── Senior: Advanced Frameworks ──
            {"id": "langchain_adv", "title": "LangChain: Advanced Patterns", "icon": "⚡",
             "desc": "LCEL, Runnable branching, streaming, callbacks",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["langchain_tools"], "tags": ["frameworks", "langchain"]},
            {"id": "llamaindex_adv", "title": "LlamaIndex: Advanced Patterns", "icon": "🦙",
             "desc": "Composable ingestion, advanced retrieval, observability",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["llamaindex_intro"], "tags": ["frameworks", "llamaindex"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 9: Security & Production
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "security_prod", "title": "Security & Production", "icon": "🛡️",
        "tier": "mid",
        "description": "Secure, deploy, and scale your RAG applications.",
        "order": 9,
        "lessons": [
            # ── Mid: Data Privacy Fundamentals ──
            {"id": "sec_privacy", "title": "Data Privacy for LLM Apps", "icon": "🔒",
             "desc": "GDPR basics, data minimization, user consent in RAG apps",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 20,
             "prerequisites": ["rag_pipeline_full"], "tags": ["security", "privacy"]},

            # ── Senior: Production Security ──
            {"id": "sec_injection", "title": "Prompt Injection Defense", "icon": "💉",
             "desc": "Detect and prevent prompt injection attacks in RAG",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full", "llm_apis"], "tags": ["security", "injection"]},
            {"id": "sec_pii", "title": "PII Detection & Redaction", "icon": "🔏",
             "desc": "Identify and mask personally identifiable information",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["sec_privacy"], "tags": ["security", "pii"]},
            {"id": "sec_access", "title": "Access Control for RAG", "icon": "🔐",
             "desc": "Document-level permissions, user-scoped retrieval",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_pipeline_full"], "tags": ["security", "access"]},
            {"id": "sec_multitenant", "title": "Multi-Tenant RAG", "icon": "🏢",
             "desc": "Isolate data and queries across multiple clients",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["sec_access", "db_pgvector"], "tags": ["security", "multitenant"]},
            {"id": "deploy_rag", "title": "Deploying RAG to Production", "icon": "🚀",
             "desc": "Docker, cloud deployment, CI/CD for RAG pipelines",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["rag_pipeline_full", "flask_middleware"], "tags": ["prod", "deployment"]},
            {"id": "deploy_cost", "title": "Cost Optimization", "icon": "💰",
             "desc": "Reduce LLM API costs — caching, batching, model selection",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["rag_cache", "llm_tokenization"], "tags": ["prod", "cost"]},
            {"id": "deploy_rate", "title": "Rate Limiting & Throttling", "icon": "🚦",
             "desc": "Handle API limits gracefully with queues and backoff",
             "tier": "senior", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["deploy_rag"], "tags": ["prod", "rate-limiting"]},
        ],
    },

    # ═══════════════════════════════════════════════════════════════
    # MODULE 10: Portfolio & Career
    # ═══════════════════════════════════════════════════════════════
    {
        "id": "career", "title": "Portfolio & Career", "icon": "💼",
        "tier": "bonus",
        "description": "Build projects, ace interviews, land freelance clients, deploy specialized solutions.",
        "order": 10,
        "lessons": [
            # ── Junior: Career Intro ──
            {"id": "career_intro", "title": "Your AI Engineering Career", "icon": "🧭",
             "desc": "Roles, skills, and career paths in AI and RAG engineering",
             "tier": "junior", "difficulty": "beginner", "estimated_minutes": 15,
             "prerequisites": ["welcome"], "tags": ["career", "intro"]},

            # ── Mid: Building Your Portfolio ──
            {"id": "career_portfolio", "title": "Building a RAG Portfolio Project", "icon": "📂",
             "desc": "End-to-end RAG project to showcase your skills",
             "tier": "mid", "difficulty": "intermediate", "estimated_minutes": 45,
             "prerequisites": ["rag_pipeline_full", "langchain_chains"], "tags": ["career", "portfolio"]},

            # ── Bonus: Career Acceleration ──
            {"id": "career_guide", "title": "Career & Portfolio Guide", "icon": "💼",
             "desc": "Projects, freelancing, earning — your career roadmap",
             "tier": "bonus", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["career_portfolio"], "tags": ["career", "guide"]},
            {"id": "career_interview", "title": "Interview Prep for AI Engineers", "icon": "🎤",
             "desc": "Common RAG and LLM interview questions with answers",
             "tier": "bonus", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["rag_pipeline_full", "langchain_chains"], "tags": ["career", "interview"]},
            {"id": "career_freelance", "title": "Freelancing as an AI Engineer", "icon": "💸",
             "desc": "Find clients, price projects, deliver RAG solutions",
             "tier": "bonus", "difficulty": "intermediate", "estimated_minutes": 25,
             "prerequisites": ["career_portfolio"], "tags": ["career", "freelance"]},
            {"id": "career_aws", "title": "AWS Bedrock RAG Deployment", "icon": "☁️",
             "desc": "Deploy RAG on AWS using Bedrock, Lambda, and OpenSearch",
             "tier": "bonus", "difficulty": "advanced", "estimated_minutes": 30,
             "prerequisites": ["deploy_rag"], "tags": ["career", "aws"]},
            {"id": "career_oss", "title": "Open-Source RAG Tools", "icon": "🌟",
             "desc": "Haystack, Verba, txtai, RAGFlow — evaluating the ecosystem",
             "tier": "bonus", "difficulty": "advanced", "estimated_minutes": 25,
             "prerequisites": ["langchain_adv", "llamaindex_adv"], "tags": ["career", "oss"]},
        ],
    },
]

# ═══════════════════════════════════════════════════════════════════════
# BUILD LOOKUPS
# ═══════════════════════════════════════════════════════════════════════

# Global lookup: lesson_id -> lesson dict (with module_id added)
ALL_LESSONS = {}
for module in MODULES:
    for lesson in module["lessons"]:
        lesson_copy = dict(lesson)
        lesson_copy["module_id"] = module["id"]
        lesson_copy["module_title"] = module["title"]
        lesson_copy["module_icon"] = module["icon"]
        ALL_LESSONS[lesson["id"]] = lesson_copy


def _build_tier_order():
    """Build ordered lesson IDs grouped by tier for prev/next navigation."""
    tier_order = {}
    for tier_info in TIERS:
        tier_id = tier_info["id"]
        tier_order[tier_id] = []
        for module in sorted(MODULES, key=lambda m: m["order"]):
            for lesson in module["lessons"]:
                if lesson["tier"] == tier_id:
                    tier_order[tier_id].append(lesson["id"])
    return tier_order


_TIER_ORDER = _build_tier_order()


# ═══════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════════

def get_lesson(lid):
    """Return a lesson dict by its ID, or None if not found."""
    return ALL_LESSONS.get(lid)


def get_modules_with_progress(completed_ids=None):
    """
    Return all modules with their lessons annotated with completion status.

    Args:
        completed_ids: set of completed lesson IDs

    Returns:
        List of module dicts with lessons annotated as {..., "completed": bool}
    """
    if completed_ids is None:
        completed_ids = set()
    result = []
    for m in MODULES:
        mod = {
            "id": m["id"],
            "title": m["title"],
            "icon": m["icon"],
            "tier": m.get("tier", ""),
            "description": m.get("description", ""),
            "order": m["order"],
        }
        mod["lessons"] = []
        for l in m["lessons"]:
            lesson_entry = dict(l)
            lesson_entry["completed"] = l["id"] in completed_ids
            lesson_entry["module_id"] = m["id"]
            lesson_entry["module_title"] = m["title"]
            lesson_entry["module_icon"] = m["icon"]
            mod["lessons"].append(lesson_entry)
        result.append(mod)
    return result


def get_prev_next(lid):
    """
    Return (prev_lesson_id, next_lesson_id) for linear navigation WITHIN a tier.

    Navigation is scoped to the lesson's own tier. At tier boundaries,
    prev or next may be None.
    """
    lesson = ALL_LESSONS.get(lid)
    if not lesson:
        return None, None
    tier = lesson.get("tier", "")
    ordered = _TIER_ORDER.get(tier, [])
    try:
        idx = ordered.index(lid)
        prev_id = ordered[idx - 1] if idx > 0 else None
        next_id = ordered[idx + 1] if idx < len(ordered) - 1 else None
        return prev_id, next_id
    except ValueError:
        return None, None


def get_tiers():
    """
    Return the tier definitions.

    Returns:
        List of dicts with id, title, subtitle, icon, color, description,
        and a 'count' field for total lessons in that tier.
    """
    # Count lessons per tier
    tier_counts = {}
    for module in MODULES:
        for lesson in module["lessons"]:
            t = lesson.get("tier", "")
            tier_counts[t] = tier_counts.get(t, 0) + 1

    result = []
    for t in TIERS:
        tier_dict = dict(t)
        tier_dict["count"] = tier_counts.get(t["id"], 0)
        result.append(tier_dict)
    return result


def get_roadmap_data(completed_ids=None):
    """
    Return full curriculum data grouped by tiers with progress statistics,
    for the roadmap visualization page.

    Args:
        completed_ids: set of completed lesson IDs

    Returns:
        List of tier dicts, each containing:
          - id, title, subtitle, icon, color, description
          - modules: list of modules for that tier with lessons
          - total: lesson count for that tier
          - done: completed lesson count for that tier
          - percent: completion percentage (0-100)
    """
    if completed_ids is None:
        completed_ids = set()

    # Build completed-id set for quick lookup
    completed = set(completed_ids)

    # Group modules and their tier-specific lessons
    tier_data = {}
    for t in TIERS:
        tier_id = t["id"]
        tier_data[tier_id] = {
            "id": tier_id,
            "title": t["title"],
            "subtitle": t["subtitle"],
            "icon": t["icon"],
            "color": t["color"],
            "description": t["description"],
            "modules": [],
            "total": 0,
            "done": 0,
        }

    for module in MODULES:
        # Collect lessons for each tier within this module
        tier_lessons = {}
        for lesson in module["lessons"]:
            t = lesson.get("tier", "")
            if t not in tier_lessons:
                tier_lessons[t] = []
            lesson_entry = dict(lesson)
            lesson_entry["completed"] = lesson["id"] in completed
            lesson_entry["module_id"] = module["id"]
            lesson_entry["module_title"] = module["title"]
            lesson_entry["module_icon"] = module["icon"]
            tier_lessons[t].append(lesson_entry)

        # Attach module slices to each tier
        for tier_id, lessons in tier_lessons.items():
            if tier_id in tier_data:
                module_slice = {
                    "id": module["id"],
                    "title": module["title"],
                    "icon": module["icon"],
                    "description": module.get("description", ""),
                    "order": module["order"],
                    "lessons": lessons,
                    "total": len(lessons),
                    "done": sum(1 for l in lessons if l["completed"]),
                }
                module_slice["percent"] = (
                    round((module_slice["done"] / module_slice["total"]) * 100)
                    if module_slice["total"] > 0 else 0
                )
                tier_data[tier_id]["modules"].append(module_slice)
                tier_data[tier_id]["total"] += len(lessons)
                tier_data[tier_id]["done"] += module_slice["done"]

    # Calculate percentages and build final list
    result = []
    for t in TIERS:
        td = tier_data[t["id"]]
        td["percent"] = round((td["done"] / td["total"]) * 100) if td["total"] > 0 else 0
        result.append(td)

    return result


# ═══════════════════════════════════════════════════════════════════════
# STARTUP DIAGNOSTICS
# ═══════════════════════════════════════════════════════════════════════

_tier_counts = {}
for m in MODULES:
    for l in m["lessons"]:
        t = l.get("tier", "unknown")
        _tier_counts[t] = _tier_counts.get(t, 0) + 1

print(f"[lessons_data] Loaded {len(ALL_LESSONS)} lessons across {len(MODULES)} modules")
for tier_id, tier_name in [("junior", "Junior"), ("mid", "Mid"),
                            ("senior", "Senior"), ("expert", "Expert"),
                            ("bonus", "Bonus")]:
    print(f"[lessons_data]   {tier_name}: {_tier_counts.get(tier_id, 0)} lessons")
