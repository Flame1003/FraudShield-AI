import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 size={36} className="animate-spin" style={{ color: '#7c3aed' }} />
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  )
}
