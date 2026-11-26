const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health:          ()       => req('/health'),
  dashboardStats:  ()       => req('/dashboard/stats'),
  datasetOverview: ()       => req('/dataset/overview'),
  listModels:      ()       => req('/models'),
  compareModels:   ()       => req('/models/compare'),
  modelEvaluation: ()       => req('/models/evaluation'),
  sampleTx:        ()       => req('/predict/sample'),

  predictSingle: (data)     => req('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  predictBatch: (file, modelName) => {
    const form = new FormData()
    form.append('file', file)
    if (modelName) form.append('model_name', modelName)
    return req('/predict/batch', { method: 'POST', body: form })
  },
}
