import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getModules } from '../lib/api'
import type { ModuleData } from '../types'

export default function Lessons() {
  const [modules, setModules] = useState<ModuleData[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const tierFilter = searchParams.get('tier')

  useEffect(() => {
    getModules()
      .then(data => setModules(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredModules = useMemo(() => {
    return modules
      .map(mod => {
        const lessons = (mod.lessons || []).filter(l => {
          if (tierFilter && (l.tier || '').toLowerCase() !== tierFilter.toLowerCase()) return false
          if (search.trim()) {
            const q = search.toLowerCase()
            return (l.title || '').toLowerCase().includes(q) ||
              (l.description || '').toLowerCase().includes(q)
          }
          return true
        })
        return { ...mod, filteredLessons: lessons }
      })
      .filter(mod => mod.filteredLessons.length > 0)
  }, [modules, search, tierFilter])

  const tiers = ['junior', 'mid', 'senior', 'expert', 'bonus']
  const total = modules.reduce((s, m) => s + (m.lessons || []).length, 0)

  if (loading) return <div className="clay-text-center clay-mt-xl">Loading...</div>
  if (error) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>

  return (
    <div className="clay-reveal">
      <div className="clay-hero" style={{ padding: '2rem 0 1.5rem' }}>
        <h1>Lessons</h1>
        <p>{total}+ lessons across 5 tiers. Search, filter, and start learning.</p>
      </div>

      <div className="clay-mb-lg">
        <input
          className="clay-input clay-search-input"
          type="text"
          placeholder="Search lessons by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="clay-flex clay-gap-sm clay-mt-sm">
          <Link to="/lessons" className={`clay-btn clay-btn--sm ${!tierFilter ? 'clay-btn--primary' : 'clay-btn--ghost'}`}>All</Link>
          {tiers.map(t => (
            <Link
              key={t}
              to={`/lessons?tier=${t}`}
              className={`clay-btn clay-btn--sm ${tierFilter === t ? 'clay-btn--primary' : 'clay-btn--ghost'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {filteredModules.length === 0 && (
        <div className="clay-card clay-text-center clay-text-muted">No lessons matching your search.</div>
      )}

      {filteredModules.map((mod, idx) => {
        const done = mod.filteredLessons.filter(l => l.completed).length
        const pct = mod.filteredLessons.length > 0 ? Math.round((done / mod.filteredLessons.length) * 100) : 0
        return (
          <div key={mod.id || idx} className="clay-card clay-mb-lg">
            <div className="clay-flex clay-items-center clay-gap-sm clay-mb-sm">
              <span className="clay-icon-lg">{mod.icon || '📘'}</span>
              <div>
                <h3>Module {idx + 1}: {mod.title}</h3>
                <p className="clay-text-sm clay-text-muted">{mod.description}</p>
              </div>
              <span className="clay-badge clay-badge--neutral">{mod.filteredLessons.length} lessons</span>
              <span className="clay-text-xs clay-text-muted">{done} done — {pct}%</span>
            </div>
            <div className="clay-progress clay-mb-sm">
              <div className="clay-progress__fill" style={{ width: `${pct}%` }} />
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
                    <span className="clay-icon-lg">{lesson.icon || '📄'}</span>
                    <div className="clay-w-full">
                      <div className="clay-flex clay-items-center clay-justify-between">
                        <h4 className="clay-text-sm">{lIdx + 1}. {lesson.title}</h4>
                        {lesson.completed && <span className="clay-badge clay-badge--success">✓</span>}
                      </div>
                      <p className="clay-text-xs clay-text-muted">{lesson.description}</p>
                      {lesson.difficulty && (
                        <span className={`clay-badge clay-badge--${lesson.difficulty === 'beginner' ? 'success' : lesson.difficulty === 'advanced' ? 'danger' : 'warning'} clay-text-xs`}>
                          {lesson.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
