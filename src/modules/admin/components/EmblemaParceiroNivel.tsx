import emblemaBronze from '@/assets/emblema-bronze.png'
import emblemaPrata from '@/assets/emblema-prata.png'
import emblemaOuro from '@/assets/emblema-ouro.png'
import emblemaDiamante from '@/assets/emblema-diamante.png'

/**
 * AIDEV-NOTE: Componente que exibe o emblema do nível do parceiro
 * Cada nível tem sua própria imagem individual
 */

const EMBLEMA_POR_COR: Record<string, string> = {
  amber: emblemaBronze,
  gray: emblemaPrata,
  yellow: emblemaOuro,
  blue: emblemaDiamante,
}

interface EmblemaParceiroNivelProps {
  cor: string
  size?: number
  className?: string
}

export function EmblemaParceiroNivel({ cor, size = 48, className = '' }: EmblemaParceiroNivelProps) {
  const src = EMBLEMA_POR_COR[cor]
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
