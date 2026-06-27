import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getModules } from '../lib/api.js';

export default function Lessons() {
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const tierFilter = searchParams.get('tier');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getModules();
        setModules(data.modules || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="clay-container">Loading...</div>;
  if (error) return <div className="clay-container clay-alert clay-alert--error">Error: {error}</div>;

  const filteredModules = modules
    .map((mod) => {
      const lessons = mod.lessons || [];
      const filtered = search.trim()
        ? lessons.filter((l) =>
            (l.title || '').toLowerCase().includes(search.toLowerCase())
          )
        : lessons;
      return { ...mod, filteredLessons: filtered };
    })
    .filter((mod) => {
      if (tierFilter && mod.tier !== tierFilter) return false;
      return mod.filteredLessons.length > 0;
    });

  return (
    <div className="clay-container">
      <div className="clay-hero">
        <h1>Lessons</h1>
        <p>Browse all modules and lessons across every tier.</p>
      </div>

      {/* Search */}
      <div className="clay-mb-lg">
        <input
          type="text"
          className="clay-input"
          placeholder="Search lessons by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tierFilter && (
          <div className="clay-mt-sm">
            <span className="clay-badge clay-badge--primary">
              Filtered by: {tierFilter}
            </span>
            <Link to="/lessons" className="clay-btn clay-btn--ghost clay-btn--sm clay-mt-sm">
              Clear filter
            </Link>
          </div>
        )}
      </div>

      {/* Modules */}
      {filteredModules.length === 0 && (
        <div className="clay-card clay-text-center clay-text-muted">
          No lessons found matching your search.
        </div>
      )}

      {filteredModules.map((mod, idx) => (
        <div key={mod.id || idx} className="clay-card clay-mb-md">
          <div className="clay-flex clay-items-center clay-gap-sm clay-mb-sm">
            <span style={{ fontSize: '1.5rem' }}>{mod.icon || '📘'}</span>
            <div>
              <h3>{mod.title || `Module ${idx + 1}`}</h3>
              <p className="clay-text-sm clay-text-muted">
                {mod.description || 'Learn core concepts.'}
              </p>
            </div>
            <span className="clay-badge clay-badge--neutral" style={{ marginLeft: 'auto' }}>
              {mod.filteredLessons.length} lessons
            </span>
          </div>
          <hr />
          <div className="clay-grid-2 clay-mt-sm">
            {mod.filteredLessons.map((lesson, lIdx) => (
              <Link
                key={lesson.id || lIdx}
                to={`/lesson/${lesson.id}`}
                className="clay-card clay-card--sm clay-card--inset"
                style={{ textDecoration: 'none' }}
              >
                <div className="clay-flex clay-items-center clay-gap-sm">
                  <span style={{ fontSize: '1.2rem' }}>{lesson.icon || '📄'}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>
                      {lesson.title || `Lesson ${lIdx + 1}`}
                    </h4>
                    <p className="clay-text-xs clay-text-muted">
                      {lesson.description || 'Click to view this lesson.'}
                    </p>
                  </div>
                  {lesson.completed && (
                    <span className="clay-badge clay-badge--success" style={{ marginLeft: 'auto' }}>
                      ✓ Complete
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
