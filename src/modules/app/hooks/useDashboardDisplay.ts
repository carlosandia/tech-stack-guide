/**
 * AIDEV-NOTE: Hook de visibilidade dos blocos do dashboard.
 * Persiste estado no localStorage (chave dashboard_display_config).
 */

import { useState, useCallback } from 'react'

export interface DashboardDisplayConfig {
  metas: boolean
  funil: boolean
  reunioes: boolean
  'kpis-principais': boolean
  canal: boolean
  motivos: boolean
}

const STORAGE_KEY = 'dashboard_display_config'

const DEFAULT_CONFIG: DashboardDisplayConfig = {
  metas: true,
  funil: true,
  reunioes: true,
  'kpis-principais': true,
  canal: true,
  motivos: true,
}

function loadConfig(): DashboardDisplayConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch (_) {}
  return { ...DEFAULT_CONFIG }
}

export function useDashboardDisplay() {
  const [config, setConfig] = useState<DashboardDisplayConfig>(loadConfig)

  const toggleSection = useCallback((id: keyof DashboardDisplayConfig) => {
    setConfig(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }, [])

  return { config, toggleSection }
}
