# RAG Academy

RAG Academy — interactive learning platform. Flask 3.x + Jinja2 + SQLite.
Blueprint: 100+ lessons across 5 tiers (Junior → Mid → Senior → Expert → Bonus).

## Architecture
- Flask server-rendered templates, no JS framework, no build step, no bundler
- SQLite (WAL mode) at `rag_academy.db`, init via `init_db()` in app.py
- Static: `static/css/style.css`, `static/js/main.js`
- Lessons defined in `lessons_data.py`, content in `templates/lessons/*.html`
- Routes in `app.py`: home, lessons, lesson view, mark-complete, roadmap,
  python playground, database viewer, data flow, RAG demo, resources
- All imports use `.js` extensions (ESM), Flask uses `url_for()` for all links

## Design System — Claymorphism

### Tokens (see style.css :root for full list)
| Token | Light | Dark |
|-------|-------|------|
| `--clay-bg` | `#f5f0eb` | `#2c2825` |
| `--clay-surface` | `#faf7f4` | `#35312d` |
| `--clay-primary` | `#d4786e` | `#e89286` |
| `--clay-text` | `#4a3f38` | `#e8e0d5` |
| `--clay-shadow-md` | `12px 12px 24px rgba(174,164,148,0.3), -6px -6px 12px rgba(255,252,248,0.9)` | darker variant |

### Typography
- Display (headings): Fredoka, 400-700
- Body: Nunito, 400-800
- Mono (code): JetBrains Mono, 400-500
- Loaded via Google Fonts CDN in base.html `<head>`
- System fallbacks: `'Baloo 2', sans-serif` / `sans-serif` / `monospace`

### Component classes
- `.clay-card` — surface + shadow-md + radius 20px + hover float
- `.clay-btn` — surface + shadow-button + radius 16px + active press
- `.clay-btn--primary` — accent bg + inverse text
- `.clay-input` — bg + inset shadow + radius 14px
- `.clay-nav` — translucent bg + backdrop-blur + bottom-rounded
- `.clay-badge` — pill-shaped, soft bg
- `.clay-progress` — inset shadow track + gradient fill
- `.clay-reveal` — staggered fadeUp children on page load

### Animation
- Page load: `.clay-reveal > *` staggered clayFadeUp (0.05s delay increments)
- Hover: cards translateY(-4px), buttons glow
- Press: buttons translateY(2px) + inset shadow swap
- Scroll: IntersectionObserver adds `.is-visible` for CSS transitions

### Dark mode
- `[data-theme="dark"]` on `<html>`, persisted to localStorage
- Anti-flash script in `<head>` sets attribute before paint
- Toggle button in navbar

## Conventions
- Lesson IDs: snake_case matching filename (`templates/lessons/<id>.html`)
- Module IDs: snake_case matching grouping key
- Flash categories: success, error, warning, info
- CSS: new rules at end of file, within labeled sections
- HTML: no inline `style=` attributes — use CSS classes
- New lesson metadata: tier, difficulty, estimated_minutes, prerequisites, tags
- Tier IDs: junior, mid, senior, expert, bonus

## Future: Auth, Subscription & ACL

The database schema is prepared with `user_id` columns (currently NULL for anonymous mode).
To add auth later:

1. **Auth**: Add Flask-Login or JWT middleware. Populate `users` table. Set `user_id` on progress/queries.
2. **Subscription tiers**: Add `tier` column to users (free/pro/enterprise). Gate premium lessons/content.
3. **ACL**: Add `access_level` to lessons. Check `user.role` before serving lesson content.
4. **User management**: Admin dashboard for user CRUD, role assignment, usage analytics.

All DB tables already have `user_id INTEGER` columns — ready for FK to `users(id)`.
- Dev server: `python app.py` → http://localhost:5000
- Docker: `docker build -t rag-academy . && docker run -p 5000:5000 rag-academy`
- Format: `ruff check .` (future)

## Validation
- All routes return 200: home, /lessons, /lesson/welcome, /roadmap, /python-playground, /database, /data-flow, /rag-demo, /resources
- No broken lesson links, all 100+ lessons accessible
- Theme toggle works, dark mode renders correctly
- Mobile responsive (down to 320px)
