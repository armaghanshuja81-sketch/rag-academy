import { useState, useEffect } from 'react'
import { getQuiz, submitQuiz } from '../lib/api'
import type { QuizData, QuizResult, QuizResultItem } from '../types'

interface Props {
  lessonId: string
  onPass: () => void
}

export default function Quiz({ lessonId, onPass }: Props) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getQuiz(lessonId)
      .then(data => {
        setQuiz(data)
        setSelected(new Array(data.total).fill(-1))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [lessonId])

  function handleSelect(qIdx: number, optIdx: number) {
    if (result) return
    setSelected(prev => {
      const next = [...prev]
      next[qIdx] = optIdx
      return next
    })
  }

  async function handleSubmit() {
    if (selected.some(s => s === -1)) {
      setError('Please answer all questions before submitting.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitQuiz(lessonId, selected)
      setResult(res)
      if (res.passed) onPass()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Quiz submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetry() {
    setResult(null)
    setSelected(new Array(quiz?.total || 0).fill(-1))
    setError(null)
  }

  if (loading) return <QuizSkeleton />
  if (error && !quiz) return <div className="clay-alert clay-alert--error clay-alert--static">{error}</div>
  if (!quiz || !quiz.has_quiz) {
    return (
      <div className="clay-card clay-card--inset clay-mt-lg clay-text-center">
        <p className="clay-text-muted">No quiz available for this lesson yet.</p>
      </div>
    )
  }

  if (result) {
    return <QuizResultCard result={result} onRetry={handleRetry} />
  }

  const allAnswered = selected.every(s => s !== -1)

  return (
    <div className="clay-quiz clay-mt-lg">
      <div className="clay-quiz__header">
        <h3>Knowledge Check</h3>
        <p className="clay-text-sm clay-text-muted">
          Answer all {quiz.total} questions. Score {quiz.total >= 3 ? '70%' : 'correctly'} to pass.
        </p>
      </div>

      {error && <div className="clay-alert clay-alert--error clay-alert--static clay-mb-md">{error}</div>}

      {quiz.questions.map((q, qIdx) => (
        <div key={qIdx} className="clay-quiz__question">
          <p className="clay-quiz__question-text">
            <span className="clay-quiz__number">{qIdx + 1}.</span> {q.question}
          </p>
          <div className="clay-quiz__options">
            {q.options.map((opt, optIdx) => (
              <button
                key={optIdx}
                className={`clay-quiz__option ${selected[qIdx] === optIdx ? 'clay-quiz__option--selected' : ''}`}
                onClick={() => handleSelect(qIdx, optIdx)}
              >
                <span className="clay-quiz__option-letter">{String.fromCharCode(65 + optIdx)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        className="clay-btn clay-btn--primary clay-btn--lg clay-btn--block clay-mt-md"
        onClick={handleSubmit}
        disabled={submitting || !allAnswered}
      >
        {submitting ? 'Checking...' : 'Submit Answers'}
      </button>
    </div>
  )
}

function QuizResultCard({ result, onRetry }: { result: QuizResult; onRetry: () => void }) {
  return (
    <div className="clay-quiz clay-mt-lg">
      <div className={`clay-quiz__result ${result.passed ? 'clay-quiz__result--pass' : 'clay-quiz__result--fail'}`}>
        <div className="clay-quiz__result-icon">{result.passed ? '🎉' : '📚'}</div>
        <h3>{result.passed ? 'You passed!' : 'Keep studying'}</h3>
        <div className="clay-stat clay-mt-sm">{result.score}%</div>
        <p className="clay-text-sm clay-text-muted clay-mt-sm">
          {result.correct_count} of {result.total} correct
          {result.passing_score > 0 && ` (${result.passing_score}% needed to pass)`}
        </p>
        {result.auto_completed && (
          <div className="clay-badge clay-badge--success clay-mt-sm">Lesson auto-completed!</div>
        )}
      </div>

      <div className="clay-mt-md">
        <h4 className="clay-mb-sm">Review</h4>
        {result.results.map((item: QuizResultItem, i: number) => (
          <div key={i} className={`clay-quiz__review ${item.is_correct ? 'clay-quiz__review--correct' : 'clay-quiz__review--wrong'}`}>
            <div className="clay-flex clay-items-center clay-gap-sm">
              <span>{item.is_correct ? '✓' : '✗'}</span>
              <strong>{i + 1}. {item.question}</strong>
            </div>
            <p className="clay-text-sm clay-text-muted">{item.explanation}</p>
          </div>
        ))}
      </div>

      {!result.passed && (
        <button className="clay-btn clay-btn--primary clay-btn--lg clay-btn--block clay-mt-md" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}

function QuizSkeleton() {
  return (
    <div className="clay-quiz clay-mt-lg">
      <div className="clay-quiz__header">
        <div style={{ height: '1.5rem', width: '12rem', background: 'var(--clay-surface-alt)', borderRadius: 'var(--clay-radius-sm)' }} />
        <div className="clay-mt-sm" style={{ height: '0.85rem', width: '16rem', background: 'var(--clay-surface-alt)', borderRadius: 'var(--clay-radius-sm)' }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="clay-quiz__question">
          <div style={{ height: '1rem', width: '80%', background: 'var(--clay-surface-alt)', borderRadius: 'var(--clay-radius-sm)', marginBottom: '0.75rem' }} />
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="clay-mb-sm" style={{ height: '2.5rem', background: 'var(--clay-surface-alt)', borderRadius: 'var(--clay-radius-sm)' }} />
          ))}
        </div>
      ))}
    </div>
  )
}
