import { useState, useEffect } from 'react'
import { getDatabase, runQuery } from '../lib/api'
import type { DbTableWithName, QueryResult } from '../types'

export default function DatabaseViewer() {
  const [tables, setTables] = useState<DbTableWithName[]>([])
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    getDatabase()
      .then(data => {
        const list = Object.entries(data).map(([tableName, info]) => ({ name: tableName, ...info }))
        setTables(list)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRunQuery() {
    if (!query.trim()) return
    setRunning(true)
    setError(null)
    try {
      setQueryResult(await runQuery(query.trim()))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="clay-text-center clay-mt-xl">Loading...</div>
  if (error && tables.length === 0) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>Database Explorer</h1>
        <p>Explore the RAG Academy database schema, inspect tables, and run SQL queries.</p>
      </section>

      <h2 className="clay-mb-md">Tables ({tables.length})</h2>
      {tables.length === 0 && <div className="clay-card clay-text-muted clay-text-center">No tables found.</div>}

      {tables.map(table => (
        <div key={table.name} className="clay-mb-lg">
          <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
            <h3>{table.name}</h3>
            <span className="clay-badge clay-badge--neutral">{table.rows?.length || 0} rows</span>
          </div>
          <div className="clay-table-wrap">
            <table className="clay-table">
              <thead>
                <tr>{table.columns?.map(col => <th key={col}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {(!table.rows || table.rows.length === 0) ? (
                  <tr><td colSpan={table.columns?.length || 1} className="clay-text-muted clay-text-center">No data</td></tr>
                ) : (
                  table.rows.slice(0, 20).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {table.columns?.map(col => (
                        <td key={col}>{row[col] != null ? String(row[col]) : <span className="clay-text-muted">NULL</span>}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {table.rows?.length > 20 && (
            <p className="clay-text-sm clay-text-muted clay-mt-sm">Showing 20 of {table.rows.length}. Use a query.</p>
          )}
        </div>
      ))}

      <section className="clay-card clay-mt-lg">
        <h2 className="clay-mb-sm">Run SQL Query</h2>
        <p className="clay-text-xs clay-text-muted clay-mb-sm">SELECT and PRAGMA queries only.</p>
        <div className="clay-flex clay-gap-sm">
          <input
            className="clay-input"
            type="text"
            placeholder="SELECT * FROM lesson_progress"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunQuery()}
          />
          <button className="clay-btn clay-btn--primary" onClick={handleRunQuery} disabled={running || !query.trim()}>
            {running ? '...' : 'Run'}
          </button>
        </div>
        {error && <div className="clay-alert clay-alert--error clay-alert--static clay-mt-sm">{error}</div>}
        {queryResult && (
          <div className="clay-mt-md">
            {queryResult.error ? (
              <div className="clay-alert clay-alert--error clay-alert--static">{queryResult.error}</div>
            ) : (
              <>
                <p className="clay-text-xs clay-text-muted clay-mb-sm">
                  {queryResult.rows?.length || 0} rows in {(queryResult.time || 0).toFixed(3)}s
                </p>
                <div className="clay-table-wrap">
                  <table className="clay-table">
                    <thead><tr>{queryResult.columns?.map((col, i) => <th key={i}>{col}</th>)}</tr></thead>
                    <tbody>
                      {queryResult.rows?.map((row, ri) => (
                        <tr key={ri}>
                          {queryResult.columns?.map((col, ci) => (
                            <td key={ci}>{row[col] != null ? String(row[col]) : <span className="clay-text-muted">NULL</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
