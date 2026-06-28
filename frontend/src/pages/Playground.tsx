import { useState } from 'react'
import { runPython } from '../lib/api'
import type { PythonResult } from '../types'

const DEFAULT_CODE = `# Welcome to the Python Playground!
# Write your code below and click Run.

def greet(name):
    return f"Hello, {name}!"

print(greet("RAG Academy"))
`

const EXAMPLES = [
  { label: 'Hello World', code: 'print("Hello, RAG Academy!")' },
  {
    label: 'Embeddings',
    code: `import math

def cosine_sim(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x*x for x in a)) * math.sqrt(sum(x*x for x in b)))

query = [0.1, 0.3, 0.5]
doc1 = [0.1, 0.2, 0.4]
doc2 = [0.9, 0.1, 0.1]
print(f"Query-doc1: {cosine_sim(query, doc1):.3f}")
print(f"Query-doc2: {cosine_sim(query, doc2):.3f}")`,
  },
  {
    label: 'Tokenization',
    code: `text = "RAG combines retrieval with generation."
tokens = text.lower().replace(".", "").split()
print("Tokens:", tokens)
print("Bigrams:", list(zip(tokens[:-1], tokens[1:])))`,
  },
  { label: 'TF-IDF', code: `import math
def tf_idf(tf, df, N):
    return (1 + math.log(tf)) * math.log((N - df + 0.5) / (df + 0.5) + 1)
for doc, score in [("A", tf_idf(3,5,100)), ("B", tf_idf(1,5,100)), ("C", tf_idf(5,5,100))]:
    print(f"{doc}: {score:.3f}")` },
]

export default function Playground() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setError(null)
    setOutput('')
    try {
      const result: PythonResult = await runPython(code)
      setOutput(result.output || '')
      if (!result.success) setError(result.error || 'Unknown error')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>Python Playground</h1>
        <p>Experiment with Python code. Run in a sandboxed environment and see output instantly.</p>
      </section>

      <div className="clay-flex clay-flex-wrap clay-gap-sm clay-mb-md">
        <span className="clay-label">Quick examples:</span>
        {EXAMPLES.map(ex => (
          <button key={ex.label} className="clay-btn clay-btn--ghost clay-btn--sm" onClick={() => { setCode(ex.code); setOutput(''); setError(null) }}>
            {ex.label}
          </button>
        ))}
      </div>

      <div className="clay-playground">
        <div className="clay-playground__editor">
          <textarea
            className="clay-code-editor"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="clay-playground__output">
          {error && <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>}
          {output ? (
            <pre className="clay-pre-output">{output}</pre>
          ) : (
            <span className="clay-text-muted">Click Run to execute your code.</span>
          )}
        </div>
      </div>

      <div className="clay-flex clay-gap-md clay-mt-md">
        <button className="clay-btn clay-btn--primary clay-btn--lg" onClick={handleRun} disabled={running}>
          {running ? 'Running...' : '▶ Run'}
        </button>
        <button className="clay-btn clay-btn--ghost clay-btn--lg" onClick={() => { setOutput(''); setError(null) }}>
          Clear Output
        </button>
      </div>
    </div>
  )
}
