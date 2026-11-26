import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Database, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { api } from '../services/api'
import ChartCard from '../components/ChartCard'
import StatCard from '../components/StatCard'
import LoadingState from '../components/LoadingState'

const V_FEATURES = Array.from({ length: 28 }, (_, i) => `V${i + 1}`)

export default function DatasetExplorer() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.datasetOverview()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading dataset info..." />
  if (error) return (
    <div className="rounded-xl p-6" style={{ background: '#1f0a0a', border: '1px solid #ef4444' }}>
      <p className="text-red-400">Error: {error}</p>
    </div>
  )

  const distData = [
    { name: 'Legitimate', value: data.legitimate, fill: '#10b981' },
    { name: 'Fraudulent', value: data.fraudulent, fill: '#ef4444' },
  ]

  const amountHist = data.amount_hist?.counts.map((c, i) => ({
    range: `$${data.amount_hist.bin_edges[i].toFixed(0)}`,
    count: c,
  })) || []

  const cols = ['Time', 'Amount', ...V_FEATURES, 'Class']

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Dataset Explorer</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Explore the structure, quality, and statistics of the credit card transaction dataset.
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Records"   value={data.total?.toLocaleString()} icon={Database} color="#3b82f6" />
        <StatCard title="Features"        value={data.num_features}            icon={Info}      color="#7c3aed" />
        <StatCard title="Missing Values"  value={data.has_missing === 0 ? 'None' : data.has_missing} icon={CheckCircle2} color="#10b981" />
        <StatCard title="Duplicate Rows"  value={data.has_duplicates === 0 ? 'None' : data.has_duplicates} icon={AlertTriangle} color={data.has_duplicates > 0 ? '#f59e0b' : '#10b981'} />
      </div>

      {/* Class imbalance */}
      <div className="rounded-xl p-5 mb-5 flex flex-wrap items-center gap-6"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>CLASS DISTRIBUTION</p>
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{data.fraud_pct}% Fraud</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Severe class imbalance — the core challenge</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Legitimate</p>
            <p className="text-xl font-bold" style={{ color: '#10b981' }}>{data.legitimate?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fraudulent</p>
            <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{data.fraudulent?.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex-1 min-w-48">
          <div className="w-full h-4 rounded-full overflow-hidden bg-slate-800">
            <div className="h-full bg-red-500 transition-all"
                 style={{ width: `${Math.max(data.fraud_pct, 1)}%` }} />
          </div>
          <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
            Fraud is {data.fraud_pct}% of data
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Class Distribution" subtitle="Legitimate vs Fraudulent transactions">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                   label={({ name, percent }) => `${name}: ${(percent*100).toFixed(2)}%`}
                   labelLine={false}>
                {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transaction Amount Distribution" subtitle="All transactions">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={amountHist.slice(0, 20)} margin={{ bottom: 30 }}>
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Amount statistics */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Amount Statistics — All Transactions">
          <StatTable rows={[
            ['Min',    `$${data.amount_stats?.min}`],
            ['Max',    `$${data.amount_stats?.max}`],
            ['Mean',   `$${data.amount_stats?.mean}`],
            ['Median', `$${data.amount_stats?.median}`],
            ['Std Dev',`$${data.amount_stats?.std}`],
          ]} />
        </ChartCard>
        <ChartCard title="Amount Statistics — Fraudulent Transactions Only">
          <StatTable rows={[
            ['Min',    `$${data.fraud_amount_stats?.min}`],
            ['Max',    `$${data.fraud_amount_stats?.max}`],
            ['Mean',   `$${data.fraud_amount_stats?.mean}`],
            ['Median', `$${data.fraud_amount_stats?.median}`],
          ]} />
        </ChartCard>
      </div>

      {/* Column reference */}
      <ChartCard title="Feature Reference" subtitle="All columns in the dataset">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Column</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Type</th>
                <th className="text-left py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {cols.map(c => (
                <tr key={c} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td className="py-1.5 pr-4 font-mono text-xs" style={{ color: '#06b6d4' }}>{c}</td>
                  <td className="py-1.5 pr-4 text-xs" style={{ color: '#94a3b8' }}>float64{c === 'Class' ? ' → int' : ''}</td>
                  <td className="py-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {c === 'Time' ? 'Seconds since the first transaction in the dataset.' :
                     c === 'Amount' ? 'Transaction amount in USD.' :
                     c === 'Class' ? '0 = Legitimate · 1 = Fraudulent (target label)' :
                     `PCA component ${c} — anonymized financial feature (privacy-protected).`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg" style={{ background: '#0d1529', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>Why V1–V28?</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            The original dataset was transformed using PCA (Principal Component Analysis) to protect cardholder
            privacy. The 28 components (V1–V28) capture the most important patterns in the original financial
            features without revealing personal information.
          </p>
        </div>
      </ChartCard>
    </div>
  )
}

function StatTable({ rows }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between items-center py-1.5"
             style={{ borderBottom: '1px solid #0f172a' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}
