import React from 'react'

export default function MetricBar({ label, value, max = 1, color = '#7c3aed' }) {
  const pct = Math.min(100, Math.round((value ?? 0) * 100))
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)' }} className="font-mono">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
