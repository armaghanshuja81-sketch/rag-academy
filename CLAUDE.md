# RAG Academy

Interactive RAG learning platform — 108 lessons across 5 tiers (Junior → Mid → Senior → Expert → Bonus) with a spiral curriculum where every tier revisits every topic at increasing depth.

## Active Migration

**Current phase**: Audit complete → awaiting approval to start Phase 0 (Retokenize)

- **Plan**: `implementation-plan.md` (root of repo) — full spec with phases, rules, per-component specs
- **Progress**: `.progress.md` — checklist tracking what's done/pending
- **Audit**: `.audit-report.md` — Phase -1 findings (tokens, hardcoded values, clay tells, a11y issues)

**Rule**: Stop after each phase and wait for user review. Do not proceed automatically.

## Architecture

```
Browser (React SPA)
  └─ Vite dev server (:5173) ──proxy──> Flask API server (:5000)
       /api/*  ──────────────────────────> app.py (JSON endpoints)
       /*      ──────────────────────────> React Router (client-side)
```

- **Frontend**: Vite + React 19 + TypeScript + react-router-dom v7 — SPA at `frontend/`
- **Backend**: Flask 3.x — JSON API server + legacy Jinja2 templates at root
- **Database**: SQLite (WAL mode) at `rag_academy.db`
- **Styling**: Single CSS file `frontend/src/index.css` — Claymorphism design system
- **No build step for backend**, no bundler needed (Vite handles the frontend)

## File Structure

```
rag-academy/
├── app.py                     # Flask app — static routes + /api/* JSON endpoints
├── lessons_data.py            # 108 lessons, modules, tiers, helper functions
├── rag_engine.py              # Keyword-based RAG engine (no embedding model needed)
├── database.py                # SQLite init, schema (users, progress, queries tables)
├── rag_academy.db             # SQLite database file
├── CLAUDE.md                  # This file — AI agent source point
│
├── frontend/
│   ├── index.html             # Vite entry — <script src="/src/main.tsx">
│   ├── package.json           # react, react-router-dom, vite, typescript
│   ├── vite.config.ts         # Vite config + React plugin + API proxy to :5000
│   ├── tsconfig.json          # TypeScript strict config
│   └── src/
│       ├── main.tsx           # React root — BrowserRouter > App
│       ├── App.tsx            # Route table — 10 routes
│       ├── types.ts           # Shared TypeScript interfaces (all API shapes)
│       ├── index.css          # Claymorphism design system (~800 lines)
│       ├── lib/
│       │   └── api.ts         # Typed API client — fetchJSON/postJSON helpers
│       ├── components/
│       │   ├── Navbar.tsx     # 8 nav links + theme toggle (dark mode)
│       │   └── Footer.tsx     # Simple footer
│       └── pages/
│           ├── Home.tsx       # Tier progress dashboard + module cards
│           ├── Lessons.tsx    # Search + tier filter + lesson grid
│           ├── LessonsView.tsx# Lesson content + sidebar (prev/next, mark complete)
│           ├── Roadmap.tsx    # 5-tier curriculum map
│           ├── Playground.tsx # Python code editor + execution
│           ├── DatabaseViewer.tsx # Table browser + SQL runner
│           ├── DataFlow.tsx   # RAG pipeline diagram + trace submission
│           ├── RagDemo.tsx    # RAG query interface + recent queries
│           ├── Resources.tsx  # Curated external links
│           └── NotFound.tsx   # 404 page
│
├── templates/                 # Legacy Jinja2 templates (still served by Flask for some routes)
│   ├── base.html
│   └── lessons/              # 108 lesson HTML files
│
└── static/                    # Legacy static assets (still served for template routes)
    ├── css/style.css
    └── js/main.js
```

## API Endpoints

All JSON endpoints return `Content-Type: application/json`.

| Method | Path | Request Body | Response | Description |
|--------|------|-------------|----------|-------------|
| GET | `/api/modules` | — | `ModuleData[]` | All modules with lessons, tiers, completion |
| GET | `/api/lesson/<id>` | — | `LessonApiResponse` | Full lesson with prev/next, content as HTML |
| POST | `/api/lesson/<id>/complete` | `{}` | `{success: true}` | Mark lesson complete (anonymous) |
| GET | `/api/roadmap` | — | `{tiers: RoadmapTier[]}` | Tier curriculum map |
| POST | `/api/python-run` | `{code: string}` | `PythonResult` | Execute Python code |
| GET | `/api/database` | — | `Record<string, DbTable>` | Database schema + contents |
| POST | `/api/database-query` | `{query: string}` | `QueryResult` | Run SQL (SELECT/PRAGMA only) |
| POST | `/api/data-flow-submit` | `{name, topic, message}` | `DataFlowResult` | Submit trace through RAG pipeline |
| POST | `/api/rag-query` | `{query: string}` | `RagResult` | Query the RAG engine |
| GET | `/api/rag-recent` | — | `RagResult[]` | Recent RAG queries |

Legacy routes serving HTML: `/`, `/lessons`, `/lesson/<id>`, `/roadmap`, `/python-playground`, `/database`, `/data-flow`, `/rag-demo`, `/resources`

## TypeScript Types (frontend/src/types.ts)

Core interfaces:
- `ModuleData { id, title, description, icon, lessons: LessonSummary[] }`
- `LessonSummary { id, title, tier, difficulty, estimated_minutes, completed }`
- `LessonApiResponse { lesson, prev_id, next_id, content }`
- `LessonDetail { id, title, tier, difficulty, estimated_minutes, prerequisites, tags, module_id }`
- `RoadmapTier { id, name, color, description, modules: RoadmapModule[] }`
- `PythonResult { output, error, execution_time }`
- `DbTable { columns: string[], rows: Record<string, unknown>[] }`
- `QueryResult { columns: string[], rows: Record<string, unknown>[], time: number, error?: string }`
- `TraceStep { title, icon, code, color }`
- `DataFlowResult { trace: TraceStep[] }`
- `RagResult { query, answer, sources: RagSource[], error?: string, recent_queries?: RagRecentQuery[] }`

All API functions in `lib/api.ts` are fully typed using these interfaces.

## Design System — Claymorphism

### Tokens (defined in index.css :root)
| Token | Light | Dark |
|-------|-------|------|
| `--clay-bg` | `#f5f0eb` | `#2c2825` |
| `--clay-surface` | `#faf7f4` | `#35312d` |
| `--clay-primary` | `#d4786e` | `#e89286` |
| `--clay-text` | `#4a3f38` | `#e8e0d5` |
| `--clay-text-muted` | `#8b7d72` | `#a09085` |
| `--clay-shadow-md` | `12px 12px 24px rgba(174,164,148,0.3), -6px -6px 12px rgba(255,252,248,0.9)` | darker variant |

### Typography
- Display (headings): Fredoka, 400-700
- Body: Nunito, 400-800
- Mono (code): JetBrains Mono, 400-500
- Loaded via Google Fonts CDN in index.html

### Component classes
- `.clay-card` — surface bg + shadow-md + radius 20px + hover translateY(-4px)
- `.clay-btn` — surface bg + shadow-button + radius 16px + active press state
- `.clay-btn--primary` — accent bg (`#d4786e`) + white text
- `.clay-input` — bg + inset shadow + radius 14px
- `.clay-nav` — translucent bg + backdrop-blur + bottom-rounded corners
- `.clay-badge` — pill-shaped, soft bg
- `.clay-progress` — inset shadow track + gradient fill
- `.clay-reveal` — staggered fadeUp children on page load
- `.clay-alert--static` — static alert (non-dismissible)

### Dark mode
- Toggled by `data-theme="dark"` on `<html>`
- Persisted to localStorage as `clay-theme`
- Anti-flash script in index.html sets attribute before paint
- Toggle button in Navbar.tsx

### Layout utilities
- `.clay-container` — max-width 1200px centered
- `.clay-main` — min-height: calc(100vh - 200px)
- `.clay-flex`, `.clay-flex-col`, `.clay-flex-wrap`, `.clay-items-center`, `.clay-justify-center`, `.clay-justify-between`
- `.clay-gap-sm`, `.clay-gap-md`, `.clay-gap-lg`
- `.clay-grid-2`, `.clay-grid-3` — 2/3 column responsive grids
- `.clay-text-center`, `.clay-text-muted`, `.clay-text-xs`, `.clay-text-sm`
- `.clay-mt-sm/md/lg/xl`, `.clay-mb-sm/md/lg`, `.clay-mr-sm`

## Conventions

### TypeScript
- Strict mode — no `any` without explicit reason
- React functional components with explicit return types or inference
- All API responses typed via `types.ts`
- CSS classes only — no inline `style={}` objects
- `.tsx` extension for components, `.ts` for utilities

### Backend
- Lesson IDs: snake_case matching filename (`templates/lessons/<id>.html`)
- Module IDs: snake_case matching grouping key
- Tier IDs: `junior`, `mid`, `senior`, `expert`, `bonus`
- Lesson metadata fields: `tier`, `difficulty`, `estimated_minutes`, `prerequisites`, `tags`

### Git
- Branch: `overhaul`
- **No Co-Authored-By** in commits

## Curriculum — Spiral Model

All 5 tiers cover ALL 11 topics. Each tier goes deeper on the same topics rather than introducing new ones:

| Tier | Depth | ~Lessons | Color |
|------|-------|----------|-------|
| Junior | Fundamentals — "what" and "how" | 25 | `#6a9fb5` (blue) |
| Mid | Application — "why" and "when" | 25 | `#c19a6b` (gold) |
| Senior | Design — architecture and tradeoffs | 20 | `#d4786e` (terracotta) |
| Expert | Research — cutting edge and optimization | 20 | `#8b6b9e` (purple) |
| Bonus | Career — portfolio, deploy, monetize | 18 | `#5a9e6b` (green) |

Modules: Setup, Python, Web Development, Flask, SQL, Git, LLMs, Embeddings, RAG, Vector Databases, LangChain, Evaluation, Advanced Retrieval, Production, Security, Agentic RAG, Multi-Modal, GraphRAG, Career, Deployment

## How to Run

```bash
# Backend (Flask)
cd rag-academy
python app.py                          # → http://localhost:5000

# Frontend (React) — separate terminal
cd rag-academy/frontend
npm install                            # first time only
npm run dev                            # → http://localhost:5173

# TypeScript type-check
cd rag-academy/frontend
npx tsc --noEmit

# Build for production
npm run build                          # → frontend/dist/
```

## Testing

```bash
# Backend smoke test
python -c "
from app import app
client = app.test_client()
for route in ['/', '/api/modules', '/api/roadmap', '/api/database', '/api/rag-recent']:
    r = client.get(route)
    print(f'{route}: {r.status_code}')
"

# Frontend (Playwright) — to be set up
cd frontend
npx playwright install
npx playwright test
```

## Future: Auth, Subscription & ACL

Database is prepared with `users` table and `user_id` columns (currently NULL for anonymous):

1. **Auth**: Add Flask-Login or JWT middleware. Populate `users` table. Set `user_id` on progress/queries.
2. **Subscription tiers**: Add `tier` column to users (free/pro/enterprise). Gate premium lessons.
3. **ACL**: Add `access_level` to lessons. Check user role before serving content.
4. **User management**: Admin dashboard for user CRUD, role assignment, usage analytics.

All DB tables already have `user_id INTEGER` columns — ready for FK to `users(id)`.

## Notes on Build Tooling

This project uses **Vite 8** — the current industry standard for React/TypeScript. It's faster than webpack (native ESM, esbuild pre-bundling, instant HMR) and is the recommended tool in the React and Vue ecosystems. Vite 8 includes:
- Native TypeScript support (no plugin needed for `.tsx`)
- CSS import support
- Dev server with HMR at :5173
- Production builds via Rollup (`npm run build` → `dist/`)
- API proxy to Flask backend (configured in `vite.config.ts`)
