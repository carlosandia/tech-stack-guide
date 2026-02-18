/**
 * AIDEV-NOTE: Hook para gerenciar idioma do teclado/autocorrect via localStorage
 * Default: pt-br. Preparado para expansão futura (en, es)
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'crm:autocorrect:lang'

export const LANGUAGES = [
  { value: 'pt-br', label: 'Português (BR)' },
  { value: 'off', label: 'Desativado' },
] as const

export type KeyboardLanguage = typeof LANGUAGES[number]['value']

export function useKeyboardLanguage() {
  const [language, setLang] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) || 'pt-br'
  )

  const setLanguage = useCallback((lang: string) => {
    setLang(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  return { language, setLanguage, LANGUAGES }
}
