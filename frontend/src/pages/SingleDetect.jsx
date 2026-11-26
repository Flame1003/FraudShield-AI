import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'
import FraudStatus from '../components/FraudStatus'

const V_FEATURES = Array.from({ length: 28 }, (_, i) => `V${i + 1}`)
const ALL_FEATURES = ['Time', 'Amount', ...V_FEATURES]

const FIELD_HELP = {
  Time:   'Seconds elapsed since the first transaction in the dataset.',
  Amount: 'Transaction amount in USD.',
}
for (const v of V_FEATURES) FIELD_HELP[v] = `PCA component ${v} — anonymized financial feature.`

function emptyForm() {
  const o = {}
  for (const f of ALL_FEATURES) o[f] = ''
  return o
}

export default function SingleDetect() {
  const [form,    setForm]    = useState(emptyForm())
  const [models,  setModels]  = useState([])
  const [selModel,setSelModel]= useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [samples, setSamples] = useState([])

  useEffect(() => {
    api.listModels().then(d => {
      setModels(d.models)
      const best = d.models.find(m => m.is_best) || d.models[0]
      if (best) setSelModel(best.id)
    }).catch(() => {})

    api.sampleTx().then(d => setSamples(d.samples)).catch(() => {})
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const loadSample = sample => {
    const next = {}
    for (const f of ALL_FEATURES) next[f] = sample[f] !== undefined ? String(sample[f]) : ''
    setForm(next)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const payload = {}
      for (const f of ALL_FEATURES) payload[f] = parseFloat(form[f] || 0)
      if (!payload.Amount || payload.Amount <= 0) throw new Error('Amount must be greater than 0.')
      payload.model_name = selModel || undefined
      const res = await api.predictSingle(payload)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setForm(emptyForm()); setResult(null); setError(null) }

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Single Transaction Detection</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enter transaction features and get an instant fraud prediction.
        </p>
      </div>

      {/* Sample buttons */}
      {samples.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            LOAD A SAMPLE TRANSACTION
          </p>
          <div className="flex flex-wrap gap-2">
            {samples.map((s, i) => (
              <button key={i} onClick={() => loadSample(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${s.label === 'FRAUD'
                          ? 'bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60'
                          : 'bg-emerald-900/40 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/60'
                        }`}>
                {s.label === 'FRAUD' ? '⚠' : '✓'} Sample {i + 1} ({s.label})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit}>
            {/* Model selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                ML MODEL
              </label>
              <select value={selModel} onChange={e => setSelModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: '#0d1529', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}{m.is_best ? ' ★ (Best)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Core fields */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Time', 'Amount'].map(f => (
                <div key={f}>
                  <label className="block text-xs mb-1" title={FIELD_HELP[f]}
                         style={{ color: 'var(--text-secondary)' }}>
                    {f} {f === 'Amount' && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    name={f} type="number" step="any" value={form[f]}
                    onChange={handleChange}
                    placeholder={f === 'Amount' ? '0.00' : '0'}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                    style={{ background: '#0d1529', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required={f === 'Amount'}
                  />
                </div>
              ))}
            </div>

            {/* V features */}
            <div>
              <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                PCA COMPONENTS (V1–V28) — Anonymized financial features
              </p>
              <div className="grid grid-cols-4 gap-2">
                {V_FEATURES.map(f => (
                  <div key={f}>
                    <label className="block text-xs mb-0.5" style={{ color: '#475569' }}>{f}</label>
                    <input
                      name={f} type="number" step="any" value={form[f]}
                      onChange={handleChange} placeholder="0"
                      className="w-full px-2 py-1.5 rounded text-xs font-mono"
                      style={{ background: '#0a0f1e', border: '1px solid #1e293b', color: 'var(--text-primary)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white transition-opacity disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Analyzing...' : 'Detect Fraud'}
              </button>
              <button type="button" onClick={reset}
                      className="px-4 py-2.5 rounded-lg transition-colors"
                      style={{ background: '#1e293b', color: 'var(--text-secondary)' }}>
                <RefreshCw size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div>
          {error && (
            <div className="rounded-xl p-4 mb-4" style={{ background: '#1f0a0a', border: '1px solid #ef4444' }}>
              <div className="flex gap-2 items-center">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <FraudStatus result={result} />
          ) : (
            <div className="rounded-xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Search size={40} className="mx-auto mb-3" style={{ color: '#334155' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Load a sample or fill in the form, then click Detect Fraud.</p>
            </div>
          )}

          {/* Model info */}
          {models.length > 0 && (
            <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ACTIVE MODELS</p>
              <div className="space-y-2">
                {models.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: m.is_best ? '#a78bfa' : 'var(--text-secondary)' }}>
                      {m.display_name}{m.is_best ? ' ★' : ''}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      Threshold: {((m.threshold ?? 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
