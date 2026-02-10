/**
 * AIDEV-NOTE: Hook para gerenciar histórico de emails visualizados no localStorage
 * Máximo 20 itens, deduplicação automática, FIFO
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'emails_historico_visualizados'
const MAX_ITEMS = 20

export interface HistoricoItem {
  id: string
  nome: string
  email: string
  assunto: string
  timestamp: number
}

function readFromStorage(): HistoricoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeToStorage(items: HistoricoItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function useEmailHistorico() {
  const [items, setItems] = useState<HistoricoItem[]>(readFromStorage)

  const adicionar = useCallback((email: { id: string; de_nome?: string | null; de_email: string; assunto?: string | null }) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== email.id)
      const newItem: HistoricoItem = {
        id: email.id,
        nome: email.de_nome || email.de_email,
        email: email.de_email,
        assunto: email.assunto || '(sem assunto)',
        timestamp: Date.now(),
      }
      const next = [newItem, ...filtered].slice(0, MAX_ITEMS)
      writeToStorage(next)
      return next
    })
  }, [])

  const limpar = useCallback(() => {
    writeToStorage([])
    setItems([])
  }, [])

  return { items, adicionar, limpar }
}
