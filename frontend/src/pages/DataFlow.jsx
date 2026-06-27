import { useState } from 'react';
import { submitDataFlow } from '../lib/api.js';

const FLOW_STEPS = [
  { id: 'browser', label: 'Browser', icon: '🌐' },
  { id: 'flask', label: 'Flask Server', icon: '⚙️' },
  { id: 'embedding', label: 'Embedding', icon: '🧮' },
  { id: 'database', label: 'Vector DB', icon: '🗄️' },
  { id: 'llm', label: 'LLM', icon: '🤖' },
  { id: 'response', label: 'Response', icon: '📩' },
];

export default function DataFlow() {
  const [form, setForm] = useState({ name: '', topic: '', message: '' });
  const [trace, setTrace] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setTrace(null);
    try {
      const result = await submitDataFlow(form);
      setTrace(result.trace || result);
      if (result.trace) {
        result.trace.forEach((_, i) => {
          setTimeout(() => setActiveStep(i), (i + 1) * 800);
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepHover = (stepId) => {
    setActiveStep(stepId);
  };

  return (
    <div className="clay-container">
      <section className="clay-hero">
        <h1>Data Flow</h1>
        <p>
          See how data moves through the RAG pipeline: from your query,
          through the embedding model and vector database, to the LLM
          and back as a response.
        </p>
      </section>

      {/* Flow Diagram */}
      <div className="clay-card clay-mb-lg">
        <h3 className="clay-mb-md">RAG Pipeline</h3>
        <div className="clay-flow">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step.id}>
              {idx > 0 && <span className="clay-flow__arrow">&rarr;</span>}
              <div
                className={`clay-flow__box clay-flow__box--${step.id} ${activeStep === step.id ? 'active' : ''}`}
                onMouseEnter={() => handleStepHover(step.id)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div style={{ fontSize: '1.5rem' }}>{step.icon}</div>
                <div>{step.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="clay-card clay-mb-lg">
        <h3 className="clay-mb-sm">Submit a Trace</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="clay-label" htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              name="name"
              className="clay-input"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="clay-label" htmlFor="topic">Topic</label>
            <input
              id="topic"
              type="text"
              name="topic"
              className="clay-input"
              placeholder="e.g., RAG, embeddings, chunking"
              value={form.topic}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="clay-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              className="clay-textarea"
              placeholder="Your question or message..."
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="clay-btn clay-btn--primary clay-btn--lg"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Submit & Trace'}
          </button>
        </form>
      </div>

      {error && (
        <div className="clay-alert clay-alert--error clay-mb-lg">{error}</div>
      )}

      {/* Trace Result */}
      {trace && Array.isArray(trace) && (
        <div className="clay-card clay-mb-lg">
          <h3 className="clay-mb-sm">Trace Result</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trace.map((step, i) => (
              <div
                key={i}
                className="clay-card clay-card--inset clay-card--sm"
                style={{
                  borderLeft: `4px solid ${step.color || '#d4786e'}`,
                  opacity: activeStep >= i ? 1 : 0.4,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <div className="clay-flex clay-items-center clay-gap-sm">
                  <span>{step.icon}</span>
                  <strong>{step.title}</strong>
                </div>
                <pre style={{ margin: '0.5rem 0 0', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                  {step.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
