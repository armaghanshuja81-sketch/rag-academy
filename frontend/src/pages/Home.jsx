import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getModules } from '../lib/api.js';

export default function Home() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const allLessons = modules.flatMap((mod) => mod.lessons || []);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.completed).length;
  const progressPercent = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return (
    <div className="clay-container">
      {/* Hero */}
      <section className="clay-hero">
        <h1>RAG Academy</h1>
        <p>
          The complete roadmap from beginner to RAG expert. Learn
          Retrieval-Augmented Generation through hands-on lessons,
          a Python playground, and live demos.
        </p>
        <div className="clay-flex clay-flex-wrap clay-justify-center clay-gap-md">
          <Link to="/lessons" className="clay-btn clay-btn--primary clay-btn--lg">
            Start Lessons
          </Link>
          <Link to="/playground" className="clay-btn clay-btn--lg">
            Python Playground
          </Link>
          <Link to="/rag-demo" className="clay-btn clay-btn--lg">
            Try RAG Demo
          </Link>
          <Link to="/resources" className="clay-btn clay-btn--ghost clay-btn--lg">
            Video Resources
          </Link>
        </div>
      </section>

      {/* Progress Card */}
      <section className="clay-card clay-mb-lg">
        <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
          <h3>Your Progress</h3>
          <span className="clay-text-sm clay-text-muted">
            {completedLessons} / {totalLessons} lessons completed
          </span>
        </div>
        <div className="clay-progress">
          <div
            className="clay-progress__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="clay-text-sm clay-text-muted clay-mt-sm">{progressPercent}% complete</p>
      </section>

      {/* Modules Grid */}
      <h2 className="clay-mb-md">Modules</h2>
      <div className="clay-grid-2">
        {modules.map((mod, idx) => {
          const moduleLessons = mod.lessons || [];
          return (
            <div key={mod.id || idx} className="clay-card clay-module">
              <div className="clay-module__number">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="clay-flex clay-items-center clay-gap-sm clay-mb-sm">
                <span style={{ fontSize: '1.5rem' }}>{mod.icon || '📘'}</span>
                <h3>{mod.title || `Module ${idx + 1}`}</h3>
              </div>
              <p className="clay-text-muted clay-mb-sm">
                {mod.description || 'Learn core concepts step by step.'}
              </p>
              <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
                <span className="clay-badge clay-badge--neutral">
                  {moduleLessons.length} lessons
                </span>
              </div>
              <div className="clay-flex clay-flex-wrap clay-gap-sm">
                {moduleLessons.map((lesson, lIdx) => {
                  const isComplete = lesson.completed || false;
                  return (
                    <Link
                      key={lesson.id || lIdx}
                      to={`/lesson/${lesson.id}`}
                      className={`clay-btn clay-btn--sm ${isComplete ? 'clay-btn--success' : 'clay-btn--ghost'}`}
                    >
                      {isComplete ? '✓' : ''} {lesson.title || `Lesson ${lIdx + 1}`}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* How This App Works */}
      <section className="clay-card clay-mt-lg">
        <h2 className="clay-mb-md">How This App Works</h2>
        <div className="clay-grid-4">
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>📚</div>
            <h4 className="clay-mt-sm">Interactive Lessons</h4>
            <p className="clay-text-sm clay-text-muted">
              Step-by-step modules from junior to expert level
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🐍</div>
            <h4 className="clay-mt-sm">Python Playground</h4>
            <p className="clay-text-sm clay-text-muted">
              Run code live in the browser sandbox
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🔍</div>
            <h4 className="clay-mt-sm">RAG Demo</h4>
            <p className="clay-text-sm clay-text-muted">
              See retrieval-augmented generation in action
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🗄️</div>
            <h4 className="clay-mt-sm">Database Explorer</h4>
            <p className="clay-text-sm clay-text-muted">
              Inspect the vector database and run queries
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
