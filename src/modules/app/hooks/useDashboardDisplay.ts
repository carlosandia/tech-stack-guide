/**
 * AIDEV-NOTE: Hook de visibilidade e ordenação dos blocos do dashboard.
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

export type ToggleableSectionId = keyof DashboardDisplayConfig

// AIDEV-NOTE: SectionId inclui todas as seções renderizáveis (toggle + fixas)
export type SectionId =
  | ToggleableSectionId
  | 'kpis-secundarios'
  | 'produtos'
  | 'atendimento'

const STORAGE_KEY = 'dashboard_display_config'
const ORDER_STORAGE_KEY = 'dashboard_section_order'

const DEFAULT_CONFIG: DashboardDisplayConfig = {
  metas: true,
  funil: true,
  reunioes: true,
  'kpis-principais': true,
  canal: true,
  motivos: true,
}

export const DEFAULT_ORDER: SectionId[] = [
  'metas',
  'funil',
  'reunioes',
  'kpis-principais',
  'kpis-secundarios',
  'canal',
  'motivos',
  'produtos',
  'atendimento',
]

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

function loadLocalOrder(): SectionId[] {
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SectionId[]
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed
    }
  } catch (_) {}
  return [...DEFAULT_ORDER]
}

function saveLocalOrder(order: SectionId[]) {
  try { localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order)) } catch (_) {}
}

export function useDashboardDisplay() {
  const [config, setConfig] = useState<DashboardDisplayConfig>(loadLocalConfig)
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(loadLocalOrder)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const orderTimer = useRef<ReturnType<typeof setTimeout>>()

  // Carregar do banco na montagem
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
        const { data } = await supabase
          .from('preferencias_dashboard')
          .select('config_exibicao, ordem_blocos')
          .eq('usuario_id', userId)
          .eq('organizacao_id', orgId)
          .maybeSingle()

        if (!cancelled && data) {
          if (data.config_exibicao) {
            const dbConfig = { ...DEFAULT_CONFIG, ...(data.config_exibicao as Partial<DashboardDisplayConfig>) }
            setConfig(dbConfig)
            saveLocalConfig(dbConfig)
          }
          if (data.ordem_blocos && Array.isArray(data.ordem_blocos)) {
            const dbOrder = data.ordem_blocos as SectionId[]
            // Garantir que todas as seções existam (caso novas tenham sido adicionadas)
            const merged = [...dbOrder]
            DEFAULT_ORDER.forEach(s => {
              if (!merged.includes(s)) merged.push(s)
            })
            setSectionOrder(merged.slice(0, DEFAULT_ORDER.length))
            saveLocalOrder(merged.slice(0, DEFAULT_ORDER.length))
          }
        }
      } catch (_) {
        // Fallback: usa localStorage (já carregado no estado inicial)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Persistir config_exibicao no banco com debounce
  const persistConfigToDb = useCallback((newConfig: DashboardDisplayConfig) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
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
      } catch (_) {}
    }, 500)
  }, [])

  // Persistir ordem_blocos no banco com debounce
  const persistOrderToDb = useCallback((newOrder: SectionId[]) => {
    if (orderTimer.current) clearTimeout(orderTimer.current)
    orderTimer.current = setTimeout(async () => {
      try {
        const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
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
              ordem_blocos: JSON.parse(JSON.stringify(newOrder)),
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await (supabase
            .from('preferencias_dashboard') as any)
            .insert({
              usuario_id: userId,
              organizacao_id: orgId,
              ordem_blocos: JSON.parse(JSON.stringify(newOrder)),
            })
        }
      } catch (_) {}
    }, 500)
  }, [])

  const toggleSection = useCallback((id: ToggleableSectionId) => {
    setConfig(prev => {
      const next = { ...prev, [id]: !prev[id] }
      saveLocalConfig(next)
      persistConfigToDb(next)
      return next
    })
  }, [persistConfigToDb])

  // AIDEV-NOTE: Move dragId para targetIndex no array de ordem
  const reorderSection = useCallback((dragId: SectionId, targetIndex: number) => {
    setSectionOrder(prev => {
      const fromIndex = prev.indexOf(dragId)
      if (fromIndex === -1 || fromIndex === targetIndex) return prev
      const next = [...prev]
      next.splice(fromIndex, 1)
      next.splice(targetIndex, 0, dragId)
      saveLocalOrder(next)
      persistOrderToDb(next)
      return next
    })
  }, [persistOrderToDb])

  return { config, toggleSection, sectionOrder, reorderSection, loaded }
}
