import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLesson, markComplete } from '../lib/api.js';

export default function LessonView() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const data = await getLesson(id);
        setLesson(data);
        setIsComplete(data.completed || false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [id]);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      await markComplete(id);
      setIsComplete(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="clay-container">Loading...</div>;
  if (error) return <div className="clay-container clay-alert clay-alert--error">Error: {error}</div>;
  if (!lesson) return <div className="clay-container clay-alert clay-alert--warning">Lesson not found.</div>;

  const moduleInfo = lesson.module || {};
  const prevLesson = lesson.prev_lesson || null;
  const nextLesson = lesson.next_lesson || null;

  return (
    <div className="clay-container">
      {/* Header */}
      <div className="clay-lesson-header">
        <Link to="/lessons" className="clay-btn clay-btn--ghost clay-btn--sm clay-mb-sm">
          &larr; Back to Lessons
        </Link>
        <div className="clay-flex clay-items-center clay-gap-md">
          <span style={{ fontSize: '2rem' }}>{lesson.icon || '📄'}</span>
          <div>
            <h1 style={{ margin: 0 }}>{lesson.title || 'Lesson'}</h1>
            <p className="clay-text-muted">{lesson.description || ''}</p>
          </div>
        </div>
        <div className="clay-flex clay-gap-sm clay-mt-sm">
          {moduleInfo.id && (
            <span className="clay-badge clay-badge--primary">
              📘 {moduleInfo.title || 'Module'}
            </span>
          )}
          {isComplete && (
            <span className="clay-badge clay-badge--success">✓ Completed</span>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Content */}
        <div className="clay-lesson-content">
          {lesson.content_html ? (
            <div dangerouslySetInnerHTML={{ __html: lesson.content_html }} />
          ) : (
            <div className="clay-card">
              <h2>{lesson.title}</h2>
              <p className="clay-text-muted clay-mt-sm">{lesson.description}</p>
              {lesson.objectives && (
                <div className="clay-mt-md">
                  <h4>Learning Objectives</h4>
                  <ul>
                    {lesson.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="clay-alert clay-alert--info clay-mt-md">
                Lesson content coming soon.
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="clay-lesson-sidebar">
          <div className="clay-card clay-card--sm clay-mb-md">
            <h4 className="clay-mb-sm">Progress</h4>
            <button
              className={`clay-btn clay-btn--block ${isComplete ? 'clay-btn--success' : 'clay-btn--primary'}`}
              onClick={handleMarkComplete}
              disabled={marking || isComplete}
            >
              {isComplete ? '✓ Completed' : marking ? 'Marking...' : 'Mark Complete'}
            </button>
          </div>

          <div className="clay-card clay-card--sm clay-mb-md">
            <h4 className="clay-mb-sm">Navigation</h4>
            <div className="clay-flex clay-gap-sm">
              {prevLesson ? (
                <Link
                  to={`/lesson/${prevLesson.id}`}
                  className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block" style={{ opacity: 0.4 }}>
                  &larr; Previous
                </span>
              )}
              {nextLesson ? (
                <Link
                  to={`/lesson/${nextLesson.id}`}
                  className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block" style={{ opacity: 0.4 }}>
                  Next &rarr;
                </span>
              )}
            </div>
          </div>

          <div className="clay-card clay-card--sm">
            <h4 className="clay-mb-sm">Quick Links</h4>
            <div className="clay-flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/resources" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">
                📺 Resources
              </Link>
              <Link to="/playground" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">
                🐍 Playground
              </Link>
              <Link to="/rag-demo" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">
                🔍 RAG Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
