import React from 'react'

export default function StatCard({ title, value, sub, icon: Icon, color = '#7c3aed', loading }) {
  if (loading) {
    return (
      <div className="rounded-xl p-5 card-glow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-4 w-32 mb-3" />
        <div className="skeleton h-8 w-24 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    )
  }
  return (
    <div className="rounded-xl p-5 card-glow animate-fadein transition-all"
         style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <Icon size={18} style={{ color }} />
          </div>
        )}
      </div>
    </div>
  )
}
