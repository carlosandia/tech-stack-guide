import { useMemo } from 'react'
import logoSvgRaw from '@/assets/logotipo-renove.svg?raw'

/**
 * AIDEV-NOTE: Componente de logo Renove inline com suporte a dark mode
 * Renderiza o SVG inline para que as cores do texto "RENOVE" respondam ao tema.
 * - Texto "RENOVE": usa currentColor (herda text-foreground do contexto)
 * - Ícone (cérebro amarelo): mantém cor original (#F...)
 * - Aceita className para dimensionamento (h-7, h-8, etc.)
 * 
 * Substitui todas as ocorrências de <img src={renoveLogo}> no projeto.
 */

interface LogoRenoveProps {
  className?: string
  /** Quando true, força o logo todo em branco (para fundos escuros fixos como footer) */
  forceWhite?: boolean
}

export function LogoRenove({ className = 'h-8', forceWhite = false }: LogoRenoveProps) {
  const svgHtml = useMemo(() => {
    let svg = logoSvgRaw

    if (forceWhite) {
      // Torna TUDO branco (ícone + texto) — para fundos sempre escuros
      svg = svg.replace(/fill="#[0-9A-Fa-f]{3,8}"/g, 'fill="white"')
    } else {
      // Substitui apenas cores escuras do texto por currentColor
      // Mantém cores amarelas/douradas (#F..., #E8..., #D...) do ícone intactas
      svg = svg.replace(/fill="#([0-9A-Fa-f]{3,8})"/g, (_match, hex: string) => {
        const firstChar = hex[0].toUpperCase()
        // Cores que começam com 0-5 são escuras (texto "RENOVE")
        // Cores que começam com 6+ são claras (ícone amarelo/dourado)
        if ('012345'.includes(firstChar)) {
          return 'fill="currentColor"'
        }
        return _match // Mantém cor original (amarelo do ícone)
      })
    }

    // Remove width/height fixos e adiciona 100% para preencher container
    svg = svg.replace(/width="[^"]*"/, 'width="100%"')
    svg = svg.replace(/height="[^"]*"/, 'height="100%"')

    return svg
  }, [forceWhite])

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      role="img"
      aria-label="CRM Renove"
    />
  )
}
