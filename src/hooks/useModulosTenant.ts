import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

/**
 * AIDEV-NOTE: Hook que retorna os slugs dos módulos ativos para o tenant do usuário logado.
 * Fluxo: organizacao_id → organizacoes_saas.plano (nome) → planos.id → planos_modulos → modulos.slug
 * Módulos obrigatórios são sempre incluídos.
 */

export function useModulosTenant() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['tenant', 'modulos', tenantId],
    queryFn: async (): Promise<string[]> => {
      if (!tenantId) return []

      // 1. Buscar nome do plano da organização
      const { data: org, error: orgError } = await supabase
        .from('organizacoes_saas')
        .select('plano')
        .eq('id', tenantId)
        .single()

      if (orgError || !org?.plano) return []

      // 2. Buscar ID do plano pelo nome
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('id')
        .ilike('nome', org.plano)
        .single()

      if (planoError || !plano) return []

      // 3. Buscar módulos vinculados ao plano
      const { data: planoModulos } = await supabase
        .from('planos_modulos')
        .select('modulo_id')
        .eq('plano_id', plano.id)

      const moduloIds = (planoModulos || []).map(pm => pm.modulo_id)

      // 4. Buscar slugs dos módulos (incluindo obrigatórios)
      const { data: modulos } = await supabase
        .from('modulos')
        .select('id, slug, obrigatorio')

      if (!modulos) return []

      // Módulos obrigatórios + módulos do plano
      const slugsAtivos = new Set<string>()
      for (const m of modulos) {
        if (m.obrigatorio || moduloIds.includes(m.id)) {
          slugsAtivos.add(m.slug)
        }
      }

      return Array.from(slugsAtivos)
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Mapeamento de path prefix → slug do módulo
 */
export const PATH_TO_MODULO_SLUG: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/contatos': 'contatos',
  '/negocios': 'negocios',
  '/conversas': 'conversas',
  '/emails': 'caixa-entrada-email',
  '/tarefas': 'atividades',
  '/formularios': 'formularios',
  '/automacoes': 'automacoes',
}

/**
 * Verifica se o path atual corresponde a um módulo bloqueado
 */
export function useIsModuloBloqueado(pathname: string): boolean {
  const { data: modulosAtivos } = useModulosTenant()
  
  if (!modulosAtivos) return false // enquanto carrega, não bloqueia
  
  for (const [pathPrefix, slug] of Object.entries(PATH_TO_MODULO_SLUG)) {
    if (pathname.startsWith(pathPrefix)) {
      return !modulosAtivos.includes(slug)
    }
  }
  
  return false
}
