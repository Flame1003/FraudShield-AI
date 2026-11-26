import React from 'react'

export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-xl p-5 ${className}`}
         style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
