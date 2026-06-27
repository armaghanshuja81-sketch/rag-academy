import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRoadmapData } from '../lib/api.js';

const TIER_ICONS = {
  junior: '🌱',
  mid: '🌿',
  senior: '🌳',
  expert: '🏔️',
  bonus: '⭐',
};

const TIER_LABELS = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  expert: 'Expert',
  bonus: 'Bonus',
};

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getRoadmapData();
        setRoadmap(data);
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
  if (!roadmap) return <div className="clay-container clay-alert clay-alert--warning">No roadmap data available.</div>;

  const tiers = roadmap.tiers || roadmap || [];

  return (
    <div className="clay-container">
      {/* Hero */}
      <section className="clay-hero">
        <h1>Learning Roadmap</h1>
        <p>
          The spiral curriculum: each tier revisits RAG concepts with
          increasing depth. Start at Junior and work your way up.
        </p>
        <Link to="/lessons" className="clay-btn clay-btn--primary clay-btn--lg">
          Start Learning Now
        </Link>
      </section>

      {/* Tier Grid */}
      <h2 className="clay-mb-md">Tiers</h2>
      <div className="clay-grid-3">
        {tiers.map((tier) => {
          const tierId = tier.id || tier.name || tier.tier || '';
          const lessonCount = tier.lesson_count || tier.lessons || 0;
          return (
            <Link
              key={tierId}
              to={`/lessons?tier=${tierId}`}
              className={`clay-card clay-tier clay-tier--${tierId}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="clay-tier__icon">
                {tier.icon || TIER_ICONS[tierId] || '📘'}
              </div>
              <div className="clay-tier__label">
                {TIER_LABELS[tierId] || tierId}
              </div>
              <h3>{tier.title || tier.name || `Tier: ${tierId}`}</h3>
              <p className="clay-text-sm clay-text-muted clay-mt-sm">
                {tier.description || 'Build foundational knowledge.'}
              </p>
              <div className="clay-flex clay-items-center clay-justify-between clay-mt-md">
                <span className="clay-badge clay-badge--neutral">
                  {typeof lessonCount === 'number' ? `${lessonCount} lessons` : lessonCount}
                </span>
                <span className="clay-text-sm clay-text-muted">View &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Spiral Explanation */}
      <section className="clay-card clay-mt-lg">
        <h2>How the Spiral Works</h2>
        <p className="clay-text-muted clay-mt-sm">
          The spiral curriculum is designed so each tier revisits core RAG
          concepts at deeper levels. You start with basic retrieval in Junior,
          progress to chunking strategies and embeddings in Mid, master
          multi-step retrieval pipelines in Senior, and dive into advanced
          architectures and production deployment in Expert. The Bonus tier
          covers cutting-edge research and real-world case studies.
        </p>
        <div className="clay-grid-4 clay-mt-md">
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🔄</div>
            <h4>Revisit</h4>
            <p className="clay-text-xs clay-text-muted">
              Each tier deepens prior concepts
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>📈</div>
            <h4>Progress</h4>
            <p className="clay-text-xs clay-text-muted">
              Build from basics to advanced
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🛠️</div>
            <h4>Hands-on</h4>
            <p className="clay-text-xs clay-text-muted">
              Code alongside every lesson
            </p>
          </div>
          <div className="clay-text-center">
            <div style={{ fontSize: '2rem' }}>🏆</div>
            <h4>Mastery</h4>
            <p className="clay-text-xs clay-text-muted">
              End with production-ready skills
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
