export interface LessonSummary {
  id: string
  title: string
  description?: string
  icon?: string
  tier?: string
  difficulty?: string
  estimated_minutes?: number
  completed?: boolean
  module?: string
}

export interface ModuleData {
  id?: string
  title: string
  description?: string
  icon?: string
  tier?: string
  lessons: LessonSummary[]
}

export interface LessonDetail {
  id: string
  title: string
  description?: string
  icon?: string
  module?: { id?: string; title?: string }
  content_html?: string
  objectives?: string[]
  tier?: string
  difficulty?: string
}

export interface LessonApiResponse {
  lesson: LessonDetail
  completed: boolean
  prev_lesson: { id: string; title: string } | null
  next_lesson: { id: string; title: string } | null
  tier: string
}

export interface RoadmapTier {
  id: string
  name?: string
  tier?: string
  title?: string
  description?: string
  icon?: string
  lesson_count?: number
  lessons?: number
  modules?: { icon: string; title: string; lesson_count: number }[]
}

export interface RoadmapData {
  tiers?: RoadmapTier[]
}

export interface PythonResult {
  success: boolean
  output: string
  error?: string
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  time: number
  error?: string
}

export interface DbTable {
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface DbTableWithName extends DbTable {
  name: string
}

export interface TraceStep {
  icon: string
  title: string
  code: string
  color?: string
}

export interface DataFlowResult {
  success: boolean
  trace?: TraceStep[]
}

export interface RagResult {
  query: string
  answer: string
  sources?: { title?: string; content?: string }[]
  recent_queries?: { query: string; answer: string; created_at?: string }[]
  error?: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  explanation: string
}

export interface QuizData {
  questions: QuizQuestion[]
  has_quiz: boolean
  total: number
}

export interface QuizResultItem {
  question_id: number
  question: string
  selected: number
  correct_answer: number
  is_correct: boolean
  explanation: string
}

export interface QuizResult {
  passed: boolean
  score: number
  total: number
  correct_count: number
  passing_score: number
  results: QuizResultItem[]
  auto_completed?: boolean
  error?: string
}
