/**
 * AIDEV-NOTE: Hook para detecção de palavras e sugestão de correção ortográfica
 * Detecta tanto a palavra sendo digitada quanto a palavra recém-completada (após espaço)
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
  cursorPos: number,
  enabled = true
): AutoCorrectResult | null {
  return useMemo(() => {
    if (!enabled || !texto || cursorPos <= 0) return null

    let start: number
    let end: number

    // AIDEV-NOTE: Se cursor está após espaço, olhar a palavra anterior (recém-completada)
    if (texto[cursorPos - 1] === ' ') {
      end = cursorPos - 1
      start = end
      while (start > 0 && /\S/.test(texto[start - 1])) {
        start--
      }
    } else {
      // Palavra sendo digitada (antes do cursor)
      end = cursorPos
      start = end
      while (start > 0 && /\S/.test(texto[start - 1])) {
        start--
      }
    }

    const palavra = texto.slice(start, end)
    if (palavra.length < 1) return null

    // Buscar no dicionário (lowercase)
    const key = palavra.toLowerCase()
    const sugestoes = CORRECOES_PT_BR[key]

    if (!sugestoes || sugestoes.length === 0) return null

    // Não sugerir se a palavra já está correta (é igual a uma das sugestões)
    if (sugestoes.some(s => s.toLowerCase() === key && s === palavra)) return null

    return {
      palavraOriginal: palavra,
      sugestoes,
      start,
      end,
    }
  }, [texto, cursorPos, enabled])
}
