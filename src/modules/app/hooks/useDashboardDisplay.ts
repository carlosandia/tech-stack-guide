/**
 * AIDEV-NOTE: Hook de visibilidade dos blocos do dashboard.
 * Persiste no Supabase (tabela preferencias_dashboard) com fallback localStorage.
 * Atualização otimista: UI muda imediatamente, salva no banco em background.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'

export interface DashboardDisplayConfig {
  metas: boolean
  funil: boolean
  reunioes: boolean
  'kpis-principais': boolean
  canal: boolean
  motivos: boolean
}

export type SectionId = keyof DashboardDisplayConfig

const STORAGE_KEY = 'dashboard_display_config'

const DEFAULT_CONFIG: DashboardDisplayConfig = {
  metas: true,
  funil: true,
  reunioes: true,
  'kpis-principais': true,
  canal: true,
  motivos: true,
}

function loadLocalConfig(): DashboardDisplayConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch (_) {}
  return { ...DEFAULT_CONFIG }
}

function saveLocalConfig(config: DashboardDisplayConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch (_) {}
}

export function useDashboardDisplay() {
  const [config, setConfig] = useState<DashboardDisplayConfig>(loadLocalConfig)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // Carregar do banco na montagem
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
        const { data } = await supabase
          .from('preferencias_dashboard')
          .select('config_exibicao')
          .eq('usuario_id', userId)
          .eq('organizacao_id', orgId)
          .maybeSingle()

        if (!cancelled && data?.config_exibicao) {
          const dbConfig = { ...DEFAULT_CONFIG, ...(data.config_exibicao as Partial<DashboardDisplayConfig>) }
          setConfig(dbConfig)
          saveLocalConfig(dbConfig)
        }
      } catch (_) {
        // Fallback: usa localStorage (já carregado no estado inicial)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Salvar no banco com debounce
  const persistToDb = useCallback((newConfig: DashboardDisplayConfig) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
        // Tenta atualizar primeiro, se não existir faz insert
        const { data: existing } = await supabase
          .from('preferencias_dashboard')
          .select('id')
          .eq('usuario_id', userId)
          .eq('organizacao_id', orgId)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('preferencias_dashboard')
            .update({
              config_exibicao: JSON.parse(JSON.stringify(newConfig)),
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await (supabase
            .from('preferencias_dashboard') as any)
            .insert({
              usuario_id: userId,
              organizacao_id: orgId,
              config_exibicao: JSON.parse(JSON.stringify(newConfig)),
            })
        }
      } catch (_) {
        // Silencioso — localStorage serve como fallback
      }
    }, 500)
  }, [])

  const toggleSection = useCallback((id: SectionId) => {
    setConfig(prev => {
      const next = { ...prev, [id]: !prev[id] }
      saveLocalConfig(next)
      persistToDb(next)
      return next
    })
  }, [persistToDb])

  return { config, toggleSection, loaded }
}
