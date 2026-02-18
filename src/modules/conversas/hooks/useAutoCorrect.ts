/**
 * AIDEV-NOTE: Hook para detecção de palavras e sugestão de correção ortográfica
 * Extrai a palavra atual antes do cursor e busca no dicionário PT-BR
 * Retorna sugestões se houver match, null caso contrário
 */

import { useMemo } from 'react'
import { CORRECOES_PT_BR } from '../utils/dicionario-correcoes'

export interface AutoCorrectResult {
  palavraOriginal: string
  sugestoes: string[]
  /** Posição de início da palavra no texto */
  start: number
  /** Posição de fim da palavra no texto */
  end: number
}

export function useAutoCorrect(
  texto: string,
  cursorPos: number
): AutoCorrectResult | null {
  return useMemo(() => {
    if (!texto || cursorPos <= 0) return null

    // Encontrar início da palavra atual (antes do cursor)
    let start = cursorPos
    while (start > 0 && /\S/.test(texto[start - 1])) {
      start--
    }

    // Palavra atual = do início até o cursor
    const palavra = texto.slice(start, cursorPos)
    if (palavra.length < 2) return null

    // Buscar no dicionário (lowercase)
    const key = palavra.toLowerCase()
    const sugestoes = CORRECOES_PT_BR[key]

    if (!sugestoes || sugestoes.length === 0) return null

    // Não sugerir se a palavra já está correta (é igual a uma das sugestões)
    if (sugestoes.some(s => s === palavra)) return null

    return {
      palavraOriginal: palavra,
      sugestoes,
      start,
      end: cursorPos,
    }
  }, [texto, cursorPos])
}
