/**
 * AIDEV-NOTE: Hook para persistir quais etapas do funil de conversão estão visíveis.
 * Leads e Ganhos ficam sempre visíveis (âncoras do funil).
 * Persiste em localStorage com key dedicada.
 * Segue o mesmo padrão do useDashboardDisplay.
 */

import { useState, useCallback } from 'react'

export interface FunilEtapasConfig {
  mqls: boolean
  sqls: boolean
  reunioes_agendadas: boolean
  reunioes_realizadas: boolean
}

export type EtapaConfigId = keyof FunilEtapasConfig

const STORAGE_KEY = 'funil_etapas_config'

const DEFAULT_CONFIG: FunilEtapasConfig = {
  mqls: true,
  sqls: true,
  reunioes_agendadas: true,
  reunioes_realizadas: true,
}

function loadConfig(): FunilEtapasConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch (_) {}
  return { ...DEFAULT_CONFIG }
}

function saveConfig(config: FunilEtapasConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch (_) {}
}

export function useFunilEtapasConfig() {
  const [config, setConfig] = useState<FunilEtapasConfig>(loadConfig)

  const toggleEtapa = useCallback((id: EtapaConfigId) => {
    setConfig(prev => {
      const next = { ...prev, [id]: !prev[id] }
      saveConfig(next)
      return next
    })
  }, [])

  const hiddenCount = Object.values(config).filter(v => !v).length

  return { config, toggleEtapa, hiddenCount }
}
