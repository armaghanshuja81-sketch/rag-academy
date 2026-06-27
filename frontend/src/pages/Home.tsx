import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getModules } from '../lib/api'
import type { ModuleData } from '../types'

export default function Home() {
  const [modules, setModules] = useState<ModuleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getModules()
      .then(data => setModules(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="clay-text-center clay-mt-xl">Loading...</div>
  if (error) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>

  const allLessons = modules.flatMap(m => m.lessons || [])
  const total = allLessons.length
  const done = allLessons.filter(l => l.completed).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  // Progress per tier
  const tierProgress = new Map<string, { total: number; done: number }>()
  for (const m of modules) {
    for (const l of m.lessons || []) {
      const t = l.tier || 'other'
      if (!tierProgress.has(t)) tierProgress.set(t, { total: 0, done: 0 })
      const entry = tierProgress.get(t)!
      entry.total++
      if (l.completed) entry.done++
    }
  }

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>RAG Academy</h1>
        <p>
          The complete roadmap from beginner to RAG expert. Learn
          Retrieval-Augmented Generation through hands-on lessons,
          a Python playground, and live demos.
        </p>
        <div className="clay-flex clay-flex-wrap clay-justify-center clay-gap-md">
          <Link to="/lessons" className="clay-btn clay-btn--primary clay-btn--lg">Start Lessons</Link>
          <Link to="/playground" className="clay-btn clay-btn--lg">Python Playground</Link>
          <Link to="/rag-demo" className="clay-btn clay-btn--lg">Try RAG Demo</Link>
          <Link to="/resources" className="clay-btn clay-btn--ghost clay-btn--lg">Resources</Link>
        </div>
      </section>

      {/* Overall Progress */}
      <section className="clay-card clay-mb-lg">
        <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
          <h3>Your Progress</h3>
          <span className="clay-badge clay-badge--primary">{done} / {total} lessons</span>
        </div>
        <div className="clay-progress">
          <div className="clay-progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="clay-text-sm clay-text-muted clay-mt-sm">{percent}% complete</p>
      </section>

      {/* Tier Progress Dashboard */}
      <section className="clay-card clay-mb-xl">
        <h3 className="clay-mb-md">Progress Dashboard</h3>
        <div className="clay-grid-4">
          {['junior', 'mid', 'senior', 'expert', 'bonus'].map(tier => {
            const tp = tierProgress.get(tier) || { total: 0, done: 0 }
            const tpPercent = tp.total > 0 ? Math.round((tp.done / tp.total) * 100) : 0
            return (
              <div key={tier} className={`clay-card clay-card--sm clay-tier clay-tier--${tier}`}>
                <div className="text-capitalize clay-tier__label">{tier}</div>
                <div className="clay-stat">{tpPercent}%</div>
                <div className="clay-progress clay-mt-sm">
                  <div className="clay-progress__fill" style={{ width: `${tpPercent}%` }} />
                </div>
                <p className="clay-text-xs clay-text-muted clay-mt-sm">
                  {tp.done} / {tp.total} lessons
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Modules */}
      <h2 className="clay-mb-md">Modules</h2>
      <div className="clay-grid-2">
        {modules.map((mod, idx) => {
          const modLessons = mod.lessons || []
          const modDone = modLessons.filter(l => l.completed).length
          return (
            <div key={mod.id || idx} className="clay-card clay-module">
              <div className="clay-module__number">{String(idx + 1).padStart(2, '0')}</div>
              <div className="clay-relative">
                <div className="clay-flex clay-items-center clay-gap-sm clay-mb-sm">
                  <span className="clay-icon-lg">{mod.icon || '📘'}</span>
                  <h3>{mod.title || `Module ${idx + 1}`}</h3>
                </div>
                <p className="clay-text-muted clay-mb-sm">{mod.description || 'Learn core concepts.'}</p>
                <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
                  <span className="clay-badge clay-badge--neutral">{modLessons.length} lessons</span>
                  <span className="clay-text-xs clay-text-muted">{modDone} completed</span>
                </div>
                <div className="clay-progress clay-mb-sm">
                  <div
                    className="clay-progress__fill"
                    style={{ width: `${modLessons.length > 0 ? Math.round((modDone / modLessons.length) * 100) : 0}%` }}
                  />
                </div>
                <Link to="/lessons" className="clay-btn clay-btn--ghost clay-btn--sm">View Module →</Link>
              </div>
            </div>
          )
        })}
      </div>

      <section className="clay-card clay-mt-lg">
        <h2 className="clay-mb-md">How This App Works</h2>
        <div className="clay-grid-4">
          {[
            { icon: '📚', title: 'Interactive Lessons', desc: 'Step-by-step from junior to expert' },
            { icon: '🐍', title: 'Python Playground', desc: 'Run code live in the browser' },
            { icon: '🔍', title: 'RAG Demo', desc: 'See RAG in action' },
            { icon: '🗄️', title: 'Database Explorer', desc: 'Inspect and query the DB' },
          ].map(item => (
            <div key={item.title} className="clay-text-center">
              <div className="clay-icon-2xl">{item.icon}</div>
              <h4 className="clay-mt-sm">{item.title}</h4>
              <p className="clay-text-sm clay-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
