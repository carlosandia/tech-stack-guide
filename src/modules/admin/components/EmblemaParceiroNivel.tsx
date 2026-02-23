import emblemasSprite from '@/assets/emblemas-parceiro.png'

/**
 * AIDEV-NOTE: Componente que exibe o emblema do nível do parceiro
 * Usa sprite sheet 2x2 (Bronze, Prata, Ouro, Diamante)
 * Posições: Bronze=top-left, Prata=top-right, Ouro=bottom-left, Diamante=bottom-right
 */

// Mapeamento de cor do nível para posição no sprite (objectPosition)
const POSICAO_SPRITE: Record<string, string> = {
  amber: '0% 0%',       // Bronze - top-left
  gray: '100% 0%',      // Prata - top-right
  yellow: '0% 100%',    // Ouro - bottom-left
  blue: '100% 100%',    // Diamante - bottom-right
}

interface EmblemaParceiroNivelProps {
  cor: string
  size?: number // px
  className?: string
}

export function EmblemaParceiroNivel({ cor, size = 48, className = '' }: EmblemaParceiroNivelProps) {
  const posicao = POSICAO_SPRITE[cor]

  // Se a cor não tem emblema mapeado, não renderiza
  if (!posicao) return null

  return (
    <div
      className={`overflow-hidden rounded-md flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={emblemasSprite}
        alt=""
        className="block"
        style={{
          width: size * 2,
          height: size * 2,
          objectFit: 'none',
          objectPosition: posicao,
          // Use clip approach instead for precise cropping
          display: 'none',
        }}
      />
      <div
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${emblemasSprite})`,
          backgroundSize: `${size * 2}px ${size * 2}px`,
          backgroundPosition: posicao,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  )
}
