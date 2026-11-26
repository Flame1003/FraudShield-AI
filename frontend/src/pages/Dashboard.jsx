import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Database, AlertTriangle, CheckCircle2, TrendingUp, Cpu
} from 'lucide-react'
import { api } from '../services/api'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import LoadingState from '../components/LoadingState'
import ConfusionMatrix from '../components/ConfusionMatrix'
import MetricBar from '../components/MetricBar'

const COLORS = ['#10b981', '#ef4444']
const METRIC_COLORS = { accuracy: '#3b82f6', precision: '#7c3aed', recall: '#10b981', f1: '#06b6d4' }

export default function Dashboard() {
  const [stats,  setStats]   = useState(null)
  const [models, setModels]  = useState(null)
  const [error,  setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.compareModels()])
      .then(([s, m]) => { setStats(s); setModels(m) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading dashboard..." />
  if (error) return (
    <div className="rounded-xl p-6" style={{ background: '#1f0a0a', border: '1px solid #ef4444' }}>
      <p className="text-red-400">⚠ Backend error: {error}</p>
      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
        Make sure the backend is running: <code className="bg-slate-800 px-1 rounded">uvicorn app.main:app --reload</code>
      </p>
    </div>
  )

  const best = models?.models?.find(m => m.is_best) || models?.models?.[0]
  const distData = stats ? [
    { name: 'Legitimate', value: stats.legitimate },
    { name: 'Fraudulent', value: stats.fraudulent },
  ] : []

  const comparisonData = models?.models?.map(m => ({
    name: m.display_name,
    Accuracy:  +(m.accuracy  * 100).toFixed(1),
    Precision: +(m.precision * 100).toFixed(1),
    Recall:    +(m.recall    * 100).toFixed(1),
    F1:        +(m.f1        * 100).toFixed(1),
    'PR-AUC':  +(m.pr_auc   * 100).toFixed(1),
  })) || []

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Dataset statistics and model evaluation metrics.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Transactions"   value={stats?.total?.toLocaleString()}      icon={Database}      color="#3b82f6" />
        <StatCard title="Legitimate"           value={stats?.legitimate?.toLocaleString()}  icon={CheckCircle2}  color="#10b981" />
        <StatCard title="Fraudulent"           value={stats?.fraudulent?.toLocaleString()}  icon={AlertTriangle} color="#ef4444" />
        <StatCard title="Fraud Rate"           value={`${stats?.fraud_pct ?? 0}%`}          icon={TrendingUp}    color="#f59e0b" sub="Class imbalance challenge" />
      </div>

      {/* Best model banner */}
      {best && (
        <div className="rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4"
             style={{ background: '#1e1b4b', border: '1px solid #4c1d95' }}>
          <Cpu size={20} style={{ color: '#a78bfa' }} />
          <div>
            <p className="text-sm font-semibold text-purple-300">Best Model: {best.display_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Selected by highest validation PR-AUC — most reliable metric for imbalanced fraud data.
            </p>
          </div>
          <div className="ml-auto flex gap-4 flex-wrap">
            {['recall', 'precision', 'f1', 'pr_auc'].map(k => (
              <div key={k} className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{k.replace('_', '-').toUpperCase()}</p>
                <p className="text-sm font-bold text-purple-300">{((best[k] ?? 0) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Transaction Class Distribution" subtitle="Legitimate vs Fraudulent">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(1)}%`}>
                {distData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transaction Amount Distribution" subtitle="Bin counts by amount range">
          <AmountHistogram data={stats?.amount_hist} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Model Performance Comparison" subtitle="Validation metrics (%)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 105]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
              <Legend />
              {Object.entries(METRIC_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key.charAt(0).toUpperCase() + key.slice(1)} fill={color} radius={[3,3,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {best?.confusion_matrix && (
          <ChartCard title="Confusion Matrix" subtitle={`Best model: ${best.display_name}`}>
            <ConfusionMatrix cm={best.confusion_matrix} />
          </ChartCard>
        )}
      </div>

      {/* Metrics table */}
      <ChartCard title="All Models — Validation Metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Model','Accuracy','Precision','Recall','F1','ROC-AUC','PR-AUC','Threshold'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models?.models?.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                    className={m.is_best ? 'bg-purple-900/20' : ''}>
                  <td className="py-2 pr-4 font-medium">
                    {m.display_name} {m.is_best && <span className="text-xs text-purple-400 ml-1">★ Best</span>}
                  </td>
                  {['accuracy','precision','recall','f1','roc_auc','pr_auc'].map(k => (
                    <td key={k} className="py-2 pr-4 font-mono text-xs"
                        style={{ color: m.is_best ? '#a78bfa' : 'var(--text-primary)' }}>
                      {((m[k] ?? 0)*100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {((m.threshold ?? 0.5)*100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function AmountHistogram({ data }) {
  if (!data) return <div className="skeleton h-52 w-full" />
  const chartData = data.counts.map((count, i) => ({
    range: `$${data.bin_edges[i].toFixed(0)}`,
    count,
  }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ bottom: 30 }}>
        <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-45} textAnchor="end" interval={4} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
        <Bar dataKey="count" fill="#3b82f6" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
