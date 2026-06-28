import { useState } from 'react'
import { ragQuery } from '../lib/api'
import type { RagResult } from '../types'

export default function RagDemo() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RagResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<RagResult['recent_queries']>([])

  async function handleAsk(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await ragQuery(query.trim())
      setResult(data)
      if (data.recent_queries) setRecentQueries(data.recent_queries)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>RAG Demo</h1>
        <p>Experience Retrieval-Augmented Generation in action.</p>
      </section>

      <div className="clay-card clay-mb-lg">
        <form onSubmit={handleAsk}>
          <label className="clay-label" htmlFor="rag-query">Ask a question</label>
          <div className="clay-flex clay-gap-sm">
            <input
              id="rag-query" type="text" className="clay-input"
              placeholder="e.g., What is chunking in RAG?"
              value={query} onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="clay-btn clay-btn--primary" disabled={loading || !query.trim()}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="clay-alert clay-alert--error clay-alert--static clay-mb-lg">{error}</div>}

      {result && !result.error && (
        <div className="clay-card clay-mb-lg">
          <h4>Question</h4>
          <p className="clay-text-muted clay-mb-md">{result.query}</p>
          <h4>Answer</h4>
          <div className="clay-rag-result">{result.answer}</div>
          {result.sources && result.sources.length > 0 && (
            <>
              <h4 className="clay-mt-md">Sources ({result.sources.length})</h4>
              {result.sources.map((src, i) => (
                <div key={i} className="clay-rag-source">
                  <strong>{src.title || `Source ${i + 1}`}</strong>
                  {src.content && <p className="clay-text-sm clay-text-muted">{src.content}</p>}
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {result && result.error && (
        <div className="clay-alert clay-alert--error clay-alert--static clay-mb-lg">{result.error}</div>
      )}

      {!result && !error && !loading && (
        <div className="clay-card clay-text-center">
          <div className="clay-icon-2xl">🔍</div>
          <h3 className="clay-mt-sm">Ready to Explore</h3>
          <p className="clay-text-muted">Type a question and click Ask to see RAG in action.</p>
        </div>
      )}

      {recentQueries && recentQueries.length > 0 && (
        <div className="clay-card">
          <h3 className="clay-mb-sm">Recent Queries</h3>
          <div className="clay-flex clay-flex-wrap clay-gap-sm">
            {recentQueries.map((rq, idx) => (
              <button
                key={idx} className="clay-btn clay-btn--ghost clay-btn--sm"
                onClick={() => { setQuery(rq.query); setResult(null); setError(null) }}
              >
                {rq.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
