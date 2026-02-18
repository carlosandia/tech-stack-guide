/**
 * AIDEV-NOTE: Hook para gerenciar palavras bloqueadas do autocorrect via localStorage
 * Persistência entre sessões — palavras ignoradas com Esc não são mais sugeridas
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'crm:autocorrect:blocked'

function loadBlocked(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function useBlockedWords() {
  const [blocked, setBlocked] = useState<string[]>(loadBlocked)

  const blockWord = useCallback((word: string) => {
    const key = word.toLowerCase()
    setBlocked(prev => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const unblockWord = useCallback((word: string) => {
    setBlocked(prev => {
      const next = prev.filter(w => w !== word.toLowerCase())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isBlocked = useCallback((word: string) => {
    return blocked.includes(word.toLowerCase())
  }, [blocked])

  return { blocked, blockWord, unblockWord, isBlocked }
}
