import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle2, Download, X, Search, Loader2 } from 'lucide-react'
import { api } from '../services/api'

export default function BatchDetect() {
  const [models,    setModels]    = useState([])
  const [selModel,  setSelModel]  = useState('')
  const [file,      setFile]      = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const fileRef = useRef()

  useEffect(() => {
    api.listModels().then(d => {
      setModels(d.models)
      const best = d.models.find(m => m.is_best) || d.models[0]
      if (best) setSelModel(best.id)
    }).catch(() => {})
  }, [])

  const accept = files => {
    const f = files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) { setError('Only CSV files are accepted.'); return }
    if (f.size > 20 * 1024 * 1024) { setError('File too large. Max 20 MB.'); return }
    setFile(f); setError(null); setResult(null)
  }

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    accept(e.dataTransfer.files)
  }

  const submit = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await api.predictBatch(file, selModel || null)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!result?.results_csv) return
    const blob = new Blob([result.results_csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'fraudshield_predictions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = (result?.predictions || []).filter(p => {
    const matchFilter = filter === 'all' || (filter === 'fraud' ? p.prediction === 1 : p.prediction === 0)
    return matchFilter
  })

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Batch Transaction Detection</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Upload a CSV file with transaction features and get predictions for all rows.
        </p>
      </div>

      {/* Upload area */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>ML MODEL</label>
          <select value={selModel} onChange={e => setSelModel(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm w-full md:w-auto"
                  style={{ background: '#0d1529', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {models.map(m => <option key={m.id} value={m.id}>{m.display_name}{m.is_best ? ' ★ (Best)' : ''}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12 cursor-pointer transition-colors"
          style={{ borderColor: dragging ? '#7c3aed' : '#334155', background: dragging ? '#1e1b4b' : '#0a0f1e' }}
        >
          <Upload size={36} className="mb-3" style={{ color: dragging ? '#a78bfa' : '#475569' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {file ? file.name : 'Drag & drop your CSV file here'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse · Max 20 MB'}
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
                 onChange={e => accept(e.target.files)} />
        </div>

        {file && (
          <div className="flex items-center gap-3 mt-3 p-3 rounded-lg"
               style={{ background: '#0d1529', border: '1px solid var(--border)' }}>
            <FileText size={16} style={{ color: '#3b82f6' }} />
            <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null) }}
                    className="text-slate-500 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: '#0d1529', border: '1px solid var(--border)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>CSV Requirements:</p>
          <p style={{ color: '#475569' }}>
            Columns: Time, Amount, V1–V28. All values must be numeric. First row must be the header.
            Max 10,000 rows per upload.
          </p>
        </div>

        <button onClick={submit} disabled={!file || loading}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Analyzing...' : 'Run Batch Detection'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-5" style={{ background: '#1f0a0a', border: '1px solid #ef4444' }}>
          <div className="flex gap-2 items-center">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-fadein">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <SumCard label="Total Analyzed" value={result.total}       color="#3b82f6" />
            <SumCard label="Legitimate"     value={result.legitimate}  color="#10b981" />
            <SumCard label="Fraudulent"     value={result.fraudulent}  color="#ef4444" />
          </div>

          {result.skipped_invalid_rows > 0 && (
            <div className="rounded-lg p-3 mb-4" style={{ background: '#431407', border: '1px solid #f97316' }}>
              <p className="text-sm text-orange-400">
                ⚠ {result.skipped_invalid_rows} row(s) skipped due to invalid values.
              </p>
            </div>
          )}

          {/* Table controls */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
              <div className="flex gap-2">
                {['all','fraud','legitimate'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            ${filter === f ? 'bg-purple-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'fraud' && result.fraudulent > 0 && (
                      <span className="ml-1 bg-red-900 text-red-300 px-1 rounded-full text-xs">{result.fraudulent}</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={download}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: '#10b981' }}>
                <Download size={12} /> Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--text-secondary)' }}>#</th>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Prediction</th>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Fraud Probability</th>
                    <th className="text-left py-2 font-medium"       style={{ color: 'var(--text-secondary)' }}>Confidence Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td className="py-1.5 pr-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{p.row_index + 1}</td>
                      <td className="py-1.5 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${p.prediction === 1 ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                          {p.label}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 font-mono" style={{ color: 'var(--text-primary)' }}>
                        {(p.fraud_probability * 100).toFixed(2)}%
                      </td>
                      <td className="py-1.5 w-32">
                        <div className="w-full h-1.5 rounded-full bg-slate-800">
                          <div className="h-full rounded-full"
                               style={{
                                 width: `${(p.fraud_probability * 100).toFixed(0)}%`,
                                 background: p.prediction === 1 ? '#ef4444' : '#10b981',
                               }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 200 && (
                <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
                  Showing first 200 of {filtered.length} results. Download CSV for all.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SumCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-card)', border: `1px solid ${color}44` }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value?.toLocaleString()}</p>
    </div>
  )
}
