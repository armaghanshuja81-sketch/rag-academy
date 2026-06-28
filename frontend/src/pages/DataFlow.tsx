import { useState } from 'react'
import { submitDataFlow } from '../lib/api'
import type { TraceStep } from '../types'

interface FlowStep {
  id: string
  label: string
  icon: string
}

const FLOW_STEPS: FlowStep[] = [
  { id: 'browser', label: 'Browser', icon: '🌐' },
  { id: 'flask', label: 'Flask Server', icon: '⚙️' },
  { id: 'embedding', label: 'Embedding', icon: '🧮' },
  { id: 'database', label: 'Vector DB', icon: '🗄️' },
  { id: 'llm', label: 'LLM', icon: '🤖' },
  { id: 'response', label: 'Response', icon: '📩' },
]

export default function DataFlow() {
  const [form, setForm] = useState({ name: '', topic: '', message: '' })
  const [trace, setTrace] = useState<TraceStep[] | null>(null)
  const [activeStep, setActiveStep] = useState<number>(-1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setTrace(null)
    setActiveStep(-1)
    try {
      const result = await submitDataFlow(form)
      const steps = result.trace || []
      setTrace(steps)
      steps.forEach((_, i) => setTimeout(() => setActiveStep(i), (i + 1) * 800))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>Data Flow</h1>
        <p>See how data moves through the RAG pipeline: from your query to the response.</p>
      </section>

      <div className="clay-card clay-mb-lg">
        <h3 className="clay-mb-md">RAG Pipeline</h3>
        <div className="clay-flow">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step.id}>
              {idx > 0 && <span className="clay-flow__arrow">→</span>}
              <div
                className={`clay-flow__box clay-flow__box--${step.id} ${activeStep === idx ? 'active' : ''}`}
                onMouseEnter={() => setActiveStep(idx)}
                onMouseLeave={() => setActiveStep(-1)}
              >
                <div className="clay-icon-lg">{step.icon}</div>
                <div>{step.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="clay-card clay-mb-lg">
        <h3 className="clay-mb-sm">Submit a Trace</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="clay-label" htmlFor="name">Your Name</label>
            <input id="name" type="text" name="name" className="clay-input" placeholder="Enter your name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="clay-label" htmlFor="topic">Topic</label>
            <input id="topic" type="text" name="topic" className="clay-input" placeholder="e.g., RAG, embeddings" value={form.topic} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="clay-label" htmlFor="message">Message</label>
            <textarea id="message" name="message" className="clay-textarea" placeholder="Your question..." value={form.message} onChange={handleChange} required />
          </div>
          <button type="submit" className="clay-btn clay-btn--primary clay-btn--lg" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit & Trace'}
          </button>
        </form>
      </div>

      {error && <div className="clay-alert clay-alert--error clay-alert--static clay-mb-lg">{error}</div>}

      {trace && trace.length > 0 && (
        <div className="clay-card clay-mb-lg">
          <h3 className="clay-mb-sm">Trace Result</h3>
          <div className="clay-flex clay-flex-col" style={{ gap: '0.75rem' }}>
            {trace.map((step, i) => (
              <div
                key={i}
                className={`clay-card clay-card--inset clay-card--sm clay-trace-card ${activeStep >= i ? 'clay-trace-card--active' : 'clay-trace-card--pending'}`}
                style={{ borderLeftColor: step.color || '#d4786e' }}
              >
                <div className="clay-flex clay-items-center clay-gap-sm">
                  <span>{step.icon}</span>
                  <strong>{step.title}</strong>
                </div>
                <pre className="clay-pre-output">{step.code}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
