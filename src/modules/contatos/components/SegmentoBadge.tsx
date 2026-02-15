/**
 * AIDEV-NOTE: Badge colorido de segmento
 * Conforme Design System - Badge rounded-full
 */

import { forwardRef } from 'react'

interface SegmentoBadgeProps {
  nome: string
  cor: string
  onRemove?: () => void
}

export const SegmentoBadge = forwardRef<HTMLSpanElement, SegmentoBadgeProps>(function SegmentoBadge({ nome, cor, onRemove }, ref) {
  return (
    <span
      ref={ref}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `${cor}20`,
        color: cor,
        border: `1px solid ${cor}40`,
      }}
    >
      {nome}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 hover:opacity-70 text-current"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  )
})
SegmentoBadge.displayName = 'SegmentoBadge'
