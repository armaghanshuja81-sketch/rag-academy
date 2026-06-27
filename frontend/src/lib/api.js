const BASE = '';

async function fetchJSON(url) {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getModules() {
  return fetchJSON('/api/modules');
}

export async function getLesson(lessonId) {
  return fetchJSON(`/api/lesson/${lessonId}`);
}

export async function getRoadmapData() {
  return fetchJSON('/api/roadmap');
}

export async function getDatabase() {
  return fetchJSON('/api/database');
}

export async function markComplete(lessonId) {
  return postJSON('/api/progress', { lesson_id: lessonId });
}

export async function runPython(code) {
  return postJSON('/api/python-run', { code });
}

export async function runQuery(sql) {
  return postJSON('/api/database-query', { query: sql });
}

export async function submitDataFlow(formData) {
  return postJSON('/api/data-flow-submit', formData);
}

export async function ragQuery(query) {
  return postJSON('/api/rag-query', { query });
}

export async function getRagRecent() {
  return fetchJSON('/api/rag-recent');
}
