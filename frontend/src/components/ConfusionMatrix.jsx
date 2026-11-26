import React from 'react'

export default function ConfusionMatrix({ cm, title }) {
  if (!cm) return null
  const { tn = 0, fp = 0, fn = 0, tp = 0 } = cm
  const total = tn + fp + fn + tp

  const cells = [
    { label: 'True Negative', abbr: 'TN', value: tn, bg: '#064e3b', border: '#10b981', note: 'Correctly identified as Legitimate' },
    { label: 'False Positive', abbr: 'FP', value: fp, bg: '#431407', border: '#f97316', note: 'Legitimate flagged as Fraud' },
    { label: 'False Negative', abbr: 'FN', value: fn, bg: '#450a0a', border: '#ef4444', note: 'Missed fraud — most costly!' },
    { label: 'True Positive', abbr: 'TP', value: tp, bg: '#1a1a40', border: '#7c3aed', note: 'Correctly identified as Fraud' },
  ]

  return (
    <div>
      {title && <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h4>}
      <div className="grid grid-cols-2 gap-2">
        {cells.map(c => (
          <div key={c.abbr} className="rounded-lg p-3 text-center"
               style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <p className="text-xs mb-1" style={{ color: c.border }}>{c.abbr}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{c.value.toLocaleString()}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{c.note}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {total > 0 ? `${((c.value / total) * 100).toFixed(1)}%` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
