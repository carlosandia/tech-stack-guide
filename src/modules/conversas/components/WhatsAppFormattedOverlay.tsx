/**
 * AIDEV-NOTE: Overlay que renderiza pré-visualização de formatação WhatsApp
 * Posicionada atrás do textarea (texto do textarea fica transparente)
 * Suporta: *bold*, _italic_, ~strike~, ```mono```
 */

import { useMemo } from 'react'

interface WhatsAppFormattedOverlayProps {
  text: string
  className?: string
}

// AIDEV-NOTE: Regex para detectar marcadores WhatsApp e renderizar com estilo
// Ordem importa: ```...``` antes de marcadores simples
function parseWhatsAppFormatting(text: string): React.ReactNode[] {
  if (!text) return []

  const regex = /```([\s\S]+?)```|\*(.+?)\*|_(.+?)_|~(.+?)~/g
  const result: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Texto antes do match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // ```monospace```
      result.push(
        <span key={key++} className="font-mono bg-muted/60 rounded px-0.5">{match[0]}</span>
      )
    } else if (match[2] !== undefined) {
      // *bold*
      result.push(
        <span key={key++} className="font-bold">{match[0]}</span>
      )
    } else if (match[3] !== undefined) {
      // _italic_
      result.push(
        <span key={key++} className="italic">{match[0]}</span>
      )
    } else if (match[4] !== undefined) {
      // ~strikethrough~
      result.push(
        <span key={key++} className="line-through">{match[0]}</span>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Texto restante
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result
}

export function WhatsAppFormattedOverlay({ text, className }: WhatsAppFormattedOverlayProps) {
  const formatted = useMemo(() => parseWhatsAppFormatting(text), [text])

  // Verifica se tem alguma formatação ativa para evitar render desnecessário
  const hasFormatting = useMemo(() => /```[\s\S]+?```|\*.+?\*|_.+?_|~.+?~/.test(text), [text])

  if (!hasFormatting) return null

  return (
    <div
      className={className}
      aria-hidden="true"
    >
      {formatted}
      {/* Espaço extra para garantir que a altura corresponda ao textarea */}
      {'\u200B'}
    </div>
  )
}
