import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRoadmapData } from '../lib/api'
import type { RoadmapTier } from '../types'

const TIER_ICONS: Record<string, string> = { junior: '🌱', mid: '🌿', senior: '🌳', expert: '🏔️', bonus: '⭐' }
const TIER_LABELS: Record<string, string> = { junior: 'Junior', mid: 'Mid', senior: 'Senior', expert: 'Expert', bonus: 'Bonus' }

export default function Roadmap() {
  const [tiers, setTiers] = useState<RoadmapTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRoadmapData()
      .then(data => setTiers(data.tiers || (Array.isArray(data) ? data as unknown as RoadmapTier[] : [])))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="clay-text-center clay-mt-xl">Loading...</div>
  if (error) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>Learning Roadmap</h1>
        <p>The spiral curriculum: each tier revisits RAG concepts with increasing depth.</p>
        <Link to="/lessons" className="clay-btn clay-btn--primary clay-btn--lg">Start Learning</Link>
      </section>

      <h2 className="clay-mb-md">Tiers</h2>
      <div className="clay-grid-3">
        {tiers.map(tier => {
          const tierId = tier.id || tier.name || tier.tier || ''
          const lessonCount = tier.lesson_count || tier.lessons || 0
          const modules = tier.modules || []
          return (
            <Link
              key={tierId}
              to={`/lessons?tier=${tierId}`}
              className={`clay-card clay-tier clay-tier--${tierId}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="clay-tier__icon">{tier.icon || TIER_ICONS[tierId] || '📘'}</div>
              <div className="clay-tier__label">{TIER_LABELS[tierId] || tierId}</div>
              <h3>{tier.title || tier.name || tierId}</h3>
              <p className="clay-text-sm clay-text-muted clay-mt-sm">{tier.description}</p>
              <div className="clay-flex clay-items-center clay-justify-between clay-mt-md">
                <span className="clay-badge clay-badge--neutral">
                  {typeof lessonCount === 'number' ? `${lessonCount} lessons` : lessonCount}
                </span>
                <span className="clay-text-sm clay-text-muted">{modules.length} modules</span>
                <span className="clay-text-sm clay-text-muted">View →</span>
              </div>
            </Link>
          )
        })}
      </div>

      {tiers.length === 0 && (
        <div className="clay-card clay-text-center clay-mt-xl">
          <h3>Curriculum Structure</h3>
          <div className="clay-grid-3 clay-mt-md">
            {Object.entries(TIER_LABELS).map(([key, label]) => (
              <Link
                key={key}
                to={`/lessons?tier=${key}`}
                className={`clay-card clay-card--sm clay-tier clay-tier--${key}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="clay-tier__icon">{TIER_ICONS[key]}</div>
                <h4>{label}</h4>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="clay-card clay-mt-lg">
        <h2>How the Spiral Works</h2>
        <p className="clay-text-muted clay-mt-sm">
          Each tier revisits core RAG concepts at deeper levels. Start with basic retrieval
          in Junior, progress to chunking strategies and embeddings in Mid, master
          multi-step pipelines in Senior, and dive into agentic architectures in Expert.
        </p>
        <div className="clay-grid-4 clay-mt-md">
          {[
            { icon: '🔄', title: 'Revisit', desc: 'Each tier deepens prior concepts' },
            { icon: '📈', title: 'Progress', desc: 'Build from basics to advanced' },
            { icon: '🛠️', title: 'Hands-on', desc: 'Code alongside every lesson' },
            { icon: '🏆', title: 'Mastery', desc: 'Production-ready skills' },
          ].map(item => (
            <div key={item.title} className="clay-text-center">
              <div className="clay-icon-2xl">{item.icon}</div>
              <h4>{item.title}</h4>
              <p className="clay-text-xs clay-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
