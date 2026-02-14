/**
 * AIDEV-NOTE: Componente minimalista para exibir uma etiqueta do WhatsApp
 * Pill com borda colorida e fundo sutil usando cor_hex com opacidade
 */

interface LabelBadgeProps {
  nome: string
  corHex: string | null
  size?: 'sm' | 'md'
  onClick?: () => void
}

export function LabelBadge({ nome, corHex, size = 'sm', onClick }: LabelBadgeProps) {
  const color = corHex || '#6b7280'

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full font-medium whitespace-nowrap
        ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px] gap-0.5' : 'px-2 py-0.5 text-[11px] gap-1'}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: color }}
      />
      {nome}
    </span>
  )
}
