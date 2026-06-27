import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLesson } from '../lib/api'
import Quiz from '../components/Quiz'
import type { LessonApiResponse } from '../types'

export default function LessonView() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<LessonApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    setData(null)
    setIsComplete(false)
    getLesson(id)
      .then(d => { setData(d); setIsComplete(d.completed) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="clay-text-center clay-mt-xl">Loading...</div>
  if (error) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>
  if (!data) return <div className="clay-alert clay-alert--warning clay-alert--static">Lesson not found.</div>

  const { lesson, prev_lesson, next_lesson, tier } = data

  return (
    <div className="clay-reveal">
      <div className="clay-lesson-header">
        <Link to="/lessons" className="clay-btn clay-btn--ghost clay-btn--sm clay-mb-sm">← Back to Lessons</Link>
        <div className="clay-flex clay-items-center clay-gap-md">
          <span className="clay-icon-xl">{lesson.icon || '📄'}</span>
          <div>
            <h1>{lesson.title || 'Lesson'}</h1>
            <p className="clay-text-muted">{lesson.description || ''}</p>
          </div>
        </div>
        <div className="clay-flex clay-gap-sm clay-mt-sm">
          {tier && <span className="clay-badge clay-badge--primary">{tier}</span>}
          {lesson.difficulty && <span className="clay-badge clay-badge--warning">{lesson.difficulty}</span>}
          {isComplete && <span className="clay-badge clay-badge--success">✓ Completed</span>}
        </div>
      </div>

      <div className="clay-lesson-layout">
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
                    {lesson.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                  </ul>
                </div>
              )}
              <div className="clay-alert clay-alert--info clay-alert--static clay-mt-md">
                Lesson content coming soon.
              </div>
            </div>
          )}

          {id && <Quiz lessonId={id} onPass={() => setIsComplete(true)} />}
        </div>

        <div className="clay-lesson-sidebar">
          <div className="clay-card clay-card--sm clay-mb-md">
            <h4 className="clay-mb-sm">Navigation</h4>
            <div className="clay-flex clay-gap-sm">
              {prev_lesson ? (
                <Link to={`/lesson/${prev_lesson.id}`} className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">← {prev_lesson.title}</Link>
              ) : (
                <span className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block" style={{ opacity: 0.4 }}>First Lesson</span>
              )}
              {next_lesson ? (
                <Link to={`/lesson/${next_lesson.id}`} className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">{next_lesson.title} →</Link>
              ) : (
                <span className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block" style={{ opacity: 0.4 }}>Last Lesson</span>
              )}
            </div>
          </div>

          <div className="clay-card clay-card--sm">
            <h4 className="clay-mb-sm">Quick Links</h4>
            <div className="clay-flex clay-flex-col clay-gap-sm">
              <Link to="/resources" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">📺 Resources</Link>
              <Link to="/playground" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">🐍 Playground</Link>
              <Link to="/rag-demo" className="clay-btn clay-btn--ghost clay-btn--sm clay-btn--block">🔍 RAG Demo</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
