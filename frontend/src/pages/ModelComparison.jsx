import React, { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts'
import { Star, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'
import ChartCard from '../components/ChartCard'
import ConfusionMatrix from '../components/ConfusionMatrix'
import LoadingState from '../components/LoadingState'

const METRICS = ['accuracy','precision','recall','f1','roc_auc','pr_auc']
const COLORS   = ['#7c3aed','#3b82f6','#f59e0b','#10b981']

export default function ModelComparison() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [selCm,   setSelCm]   = useState(null)

  useEffect(() => {
    api.compareModels()
      .then(d => { setData(d); setSelCm(d.models?.find(m => m.is_best) || d.models?.[0]) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading comparison..." />
  if (error) return (
    <div className="rounded-xl p-6" style={{ background: '#1f0a0a', border: '1px solid #ef4444' }}>
      <p className="text-red-400">Error: {error}</p>
    </div>
  )

  const models = data?.models || []
  const best   = models.find(m => m.is_best) || models[0]

  // Bar chart data
  const barData = METRICS.map(k => {
    const row = { metric: k.replace('_','-').toUpperCase() }
    models.forEach(m => { row[m.display_name] = +((m[k] ?? 0) * 100).toFixed(1) })
    return row
  })

  // Radar data
  const radarData = METRICS.map(k => {
    const row = { metric: k.replace('_','-').toUpperCase() }
    models.forEach(m => { row[m.display_name] = +((m[k] ?? 0) * 100).toFixed(1) })
    return row
  })

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Model Comparison</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Side-by-side comparison of all trained models.
        </p>
      </div>

      {/* Why accuracy isn't enough */}
      <div className="rounded-xl p-4 mb-5"
           style={{ background: '#1e1b4b', border: '1px solid #4c1d95' }}>
        <div className="flex gap-3 items-start">
          <AlertTriangle size={18} style={{ color: '#a78bfa' }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#c4b5fd' }}>Why we don't use Accuracy to pick the best model</p>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              With only 0.17% fraud, a model that always predicts "Legitimate" achieves 99.83% accuracy but catches
              zero fraud. We use <strong className="text-purple-300">PR-AUC (Precision-Recall Area Under Curve)</strong> as
              the selection criterion — it directly measures trade-off between finding fraud (Recall) and not falsely
              flagging legitimate transactions (Precision).
            </p>
          </div>
        </div>
      </div>

      {/* Best model banner */}
      {best && (
        <div className="rounded-xl p-4 mb-5 flex items-center gap-4"
             style={{ background: '#071a12', border: '1px solid #10b981' }}>
          <Star size={24} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">Best Model: {best.display_name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Selected because it achieved the highest PR-AUC on validation data ({((best.pr_auc ?? 0)*100).toFixed(1)}%).
              High PR-AUC means the model both finds fraud AND avoids false alarms.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <ChartCard title="Validation Metrics — All Models" className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Model</th>
                {METRICS.map(m => (
                  <th key={m} className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {m.replace('_','-').toUpperCase()}
                    {m === 'pr_auc' && <span className="ml-1 text-purple-400 text-xs">★ Select</span>}
                  </th>
                ))}
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>FP</th>
                <th className="text-left py-2 font-medium"       style={{ color: 'var(--text-secondary)' }}>FN ⚠</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={m.id} className={m.is_best ? 'bg-purple-900/15' : ''}
                    style={{ borderBottom: '1px solid #0f172a' }}>
                  <td className="py-2 pr-4 font-medium">
                    {m.display_name}
                    {m.is_best && <span className="text-xs text-purple-400 ml-1">★</span>}
                  </td>
                  {METRICS.map(k => (
                    <td key={k} className="py-2 pr-4 font-mono text-xs"
                        style={{ color: COLORS[i] }}>
                      {((m[k] ?? 0) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="py-2 pr-4 font-mono text-xs" style={{ color: '#f97316' }}>
                    {m.confusion_matrix?.fp ?? '—'}
                  </td>
                  <td className="py-2 font-mono text-xs" style={{ color: '#ef4444' }}>
                    {m.confusion_matrix?.fn ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          FN (False Negatives) = fraud transactions missed. This is the most costly error in fraud detection.
        </p>
      </ChartCard>

      {/* Bar charts */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Metric Comparison Bar Chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ bottom: 30 }}>
              <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 105]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
              <Legend />
              {models.map((m, i) => <Bar key={m.id} dataKey={m.display_name} fill={COLORS[i]} radius={[3,3,0,0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Radar Chart — Overall Profile">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              {models.map((m, i) => (
                <Radar key={m.id} name={m.display_name} dataKey={m.display_name}
                       stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Confusion matrices */}
      <ChartCard title="Confusion Matrices" subtitle="Click a model to view its confusion matrix">
        <div className="flex flex-wrap gap-2 mb-5">
          {models.map((m, i) => (
            <button key={m.id} onClick={() => setSelCm(m)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: selCm?.id === m.id ? COLORS[i] : 'var(--bg-secondary)',
                      color: selCm?.id === m.id ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${COLORS[i]}44`,
                    }}>
              {m.display_name}
            </button>
          ))}
        </div>
        {selCm?.confusion_matrix && (
          <ConfusionMatrix cm={selCm.confusion_matrix} title={selCm.display_name} />
        )}
      </ChartCard>
    </div>
  )
}
