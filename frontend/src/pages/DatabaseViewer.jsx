import { useState, useEffect } from 'react';
import { getDatabase, runQuery } from '../lib/api.js';

export default function DatabaseViewer() {
  const [tables, setTables] = useState([]);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDatabase();
        const tableList = Object.entries(data).map(([name, info]) => ({ name, ...info }));
        setTables(tableList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runQuery(query.trim());
      setQueryResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="clay-container">Loading...</div>;
  if (error && !tables.length) {
    return <div className="clay-container clay-alert clay-alert--error">Error: {error}</div>;
  }

  return (
    <div className="clay-container">
      <section className="clay-hero">
        <h1>Database Viewer</h1>
        <p>
          Explore the RAG database schema, inspect table contents, and run
          custom SQL queries.
        </p>
      </section>

      {/* Tables */}
      <h2 className="clay-mb-md">Tables</h2>
      {tables.length === 0 && (
        <div className="clay-card clay-text-muted clay-text-center">
          No tables found in the database.
        </div>
      )}

      {tables.map((table, idx) => {
        const tableName = table.name || `Table ${idx + 1}`;
        const columns = table.columns || [];
        const rows = table.rows || [];

        return (
          <div key={tableName} className="clay-mb-lg">
            <div className="clay-flex clay-items-center clay-justify-between clay-mb-sm">
              <h3>{tableName}</h3>
              <span className="clay-badge clay-badge--neutral">
                {rows.length} rows
              </span>
            </div>
            <div className="clay-table-wrap">
              <table className="clay-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length || 1} className="clay-text-muted clay-text-center">
                        No data
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {columns.map((col) => (
                          <td key={col}>
                            {row[col] !== undefined && row[col] !== null
                              ? String(row[col])
                              : <span className="clay-text-muted">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* SQL Query */}
      <section className="clay-card clay-mt-lg">
        <h2 className="clay-mb-sm">Run SQL Query</h2>
        <div className="clay-flex clay-gap-sm">
          <input
            type="text"
            className="clay-input"
            placeholder="SELECT * FROM documents LIMIT 10;"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
          />
          <button
            className="clay-btn clay-btn--primary"
            onClick={handleRunQuery}
            disabled={running || !query.trim()}
          >
            {running ? 'Running...' : 'Run'}
          </button>
        </div>
        {error && (
          <div className="clay-alert clay-alert--error clay-mt-sm">{error}</div>
        )}
        {queryResult && (
          <div className="clay-mt-md">
            {queryResult.error ? (
              <div className="clay-alert clay-alert--error" style={{ cursor: 'default' }}>{queryResult.error}</div>
            ) : (
              <>
                <p className="clay-text-xs clay-text-muted clay-mb-sm">
                  {queryResult.rows?.length || 0} rows in {(queryResult.time || 0).toFixed(3)}s
                </p>
                <div className="clay-table-wrap">
                  <table className="clay-table">
                    <thead>
                      <tr>
                        {queryResult.columns?.map((col, i) => <th key={i}>{col}</th>)}
                      </tr>
                    </thead>
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
  );
}
