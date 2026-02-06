/**
 * AIDEV-NOTE: Badge colorido de segmento
 * Conforme Design System - Badge rounded-full
 */

interface SegmentoBadgeProps {
  nome: string
  cor: string
  onRemove?: () => void
}

export function SegmentoBadge({ nome, cor, onRemove }: SegmentoBadgeProps) {
  return (
    <span
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
}
