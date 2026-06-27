import { useState } from 'react';
import { runPython } from '../lib/api.js';

const DEFAULT_CODE = `# Welcome to the Python Playground!
# Write your code below and click Run.

def greet(name):
    return f"Hello, {name}!"

print(greet("RAG Academy"))
print("Try some RAG-related experiments!")
`;

const EXAMPLES = [
  {
    label: 'Hello World',
    code: `print("Hello, RAG Academy!")\nprint("Let's learn retrieval-augmented generation!")`,
  },
  {
    label: 'Embeddings Demo',
    code: `# Simulating embedding similarity
import math

def cosine_sim(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    return dot / (mag_a * mag_b)

query = [0.1, 0.3, 0.5]
doc1 = [0.1, 0.2, 0.4]
doc2 = [0.9, 0.1, 0.1]

print(f"Query-doc1 similarity: {cosine_sim(query, doc1):.3f}")
print(f"Query-doc2 similarity: {cosine_sim(query, doc2):.3f}")
`,
  },
  {
    label: 'Tokenization',
    code: `# Simple tokenization demo
text = "RAG combines retrieval with generation for better answers."

# Word tokenization
tokens = text.lower().replace(".", "").split()
print("Tokens:", tokens)

# Bigrams
bigrams = list(zip(tokens[:-1], tokens[1:]))
print("Bigrams:", bigrams)
`,
  },
  {
    label: 'Retrieval Score',
    code: `# BM25-style scoring simulation
import math

def tf_idf(term_freq, doc_freq, total_docs):
    tf = 1 + math.log(term_freq) if term_freq > 0 else 0
    idf = math.log((total_docs - doc_freq + 0.5) / (doc_freq + 0.5) + 1)
    return tf * idf

# Simulate scores for a query term
scores = [
    ("Doc A", tf_idf(3, 5, 100)),
    ("Doc B", tf_idf(1, 5, 100)),
    ("Doc C", tf_idf(5, 5, 100)),
]

for doc, score in sorted(scores, key=lambda x: -x[1]):
    print(f"{doc}: {score:.3f}")
`,
  },
];

export default function Playground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setOutput('');
    try {
      const result = await runPython(code);
      setOutput(result.output || '');
      if (!result.success) setError(result.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
    setError(null);
  };

  const handleExample = (exampleCode) => {
    setCode(exampleCode);
    setOutput('');
    setError(null);
  };

  return (
    <div className="clay-container">
      <section className="clay-hero">
        <h1>Python Playground</h1>
        <p>
          Experiment with Python code related to RAG concepts. Run your
          code in a sandboxed environment and see the output instantly.
        </p>
      </section>

      {/* Example Buttons */}
      <div className="clay-flex clay-flex-wrap clay-gap-sm clay-mb-md">
        <span className="clay-label" style={{ margin: 0, alignSelf: 'center' }}>
          Quick examples:
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            className="clay-btn clay-btn--ghost clay-btn--sm"
            onClick={() => handleExample(ex.code)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Playground */}
      <div className="clay-playground">
        <div className="clay-playground__editor">
          <textarea
            className="clay-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          />
        </div>
        <div className="clay-playground__output">
          {error && (
            <div className="clay-alert clay-alert--error">{error}</div>
          )}
          {output ? (
            <pre style={{ background: 'transparent', color: 'inherit', margin: 0, padding: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{output}</pre>
          ) : (
            <span className="clay-text-muted">
              Click Run to execute your code. Output will appear here.
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="clay-flex clay-gap-md clay-mt-md">
        <button
          className="clay-btn clay-btn--primary clay-btn--lg"
          onClick={handleRun}
          disabled={running}
        >
          {running ? 'Running...' : '▶ Run'}
        </button>
        <button
          className="clay-btn clay-btn--ghost clay-btn--lg"
          onClick={handleClear}
        >
          Clear Output
        </button>
      </div>
    </div>
  );
}
