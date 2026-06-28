import type { ModuleData, LessonApiResponse, RoadmapData, PythonResult, QueryResult, DbTable, DataFlowResult, RagResult, QuizData, QuizResult } from '../types'

const BASE = ''

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export function getModules(): Promise<ModuleData[]> {
  return fetchJSON<ModuleData[]>('/api/modules')
}

export function getLesson(lessonId: string): Promise<LessonApiResponse> {
  return fetchJSON<LessonApiResponse>(`/api/lesson/${lessonId}`)
}

export function getRoadmapData(): Promise<RoadmapData> {
  return fetchJSON<RoadmapData>('/api/roadmap')
}

export function getDatabase(): Promise<Record<string, DbTable>> {
  return fetchJSON<Record<string, DbTable>>('/api/database')
}

export function markComplete(lessonId: string): Promise<{ success: boolean; percent: number }> {
  return postJSON('/api/progress', { lesson_id: lessonId })
}

export function runPython(code: string): Promise<PythonResult> {
  return postJSON<PythonResult>('/api/python-run', { code })
}

export function runQuery(sql: string): Promise<QueryResult> {
  return postJSON<QueryResult>('/api/database-query', { query: sql })
}

export function submitDataFlow(formData: { name: string; topic: string; message: string }): Promise<DataFlowResult> {
  return postJSON<DataFlowResult>('/api/data-flow-submit', formData)
}

export function ragQuery(query: string): Promise<RagResult> {
  return postJSON<RagResult>('/api/rag-query', { query })
}

export function getRagRecent(): Promise<{ query: string; answer: string; created_at?: string }[]> {
  return fetchJSON('/api/rag-recent')
}

export function getQuiz(lessonId: string): Promise<QuizData> {
  return fetchJSON<QuizData>(`/api/lesson/${lessonId}/quiz`)
}

export function submitQuiz(lessonId: string, answers: number[]): Promise<QuizResult> {
  return postJSON<QuizResult>(`/api/lesson/${lessonId}/quiz/submit`, { answers })
}
