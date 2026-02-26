/**
 * AIDEV-NOTE: Hook para verificar se a organização do usuário logado é parceira
 * Usado nos dropdowns de usuário (AppLayout + ConfigHeader) para exibir emblema
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

interface ParceiroInfo {
  isParceiro: boolean
  nivelCor: string | null // cor do nível para exibir emblema
  nivelNome: string | null
}

export function useParceiroStatus(): ParceiroInfo {
  const { user } = useAuth()
  const orgId = user?.organizacao_id

  const { data } = useQuery({
    queryKey: ['parceiro-status', orgId],
    queryFn: async (): Promise<ParceiroInfo> => {
      if (!orgId) return { isParceiro: false, nivelCor: null, nivelNome: null }

      // Buscar parceiro ativo para a org
      const { data: parceiro } = await (supabase as any)
        .from('parceiros')
        .select('id, nivel_override, status')
        .eq('organizacao_id', orgId)
        .eq('status', 'ativo')
        .maybeSingle()

      if (!parceiro) return { isParceiro: false, nivelCor: null, nivelNome: null }

      // Buscar config do programa para resolver nível
      const { data: config } = await (supabase as any)
        .from('config_programa_parceiros')
        .select('regras_gratuidade')
        .limit(1)
        .maybeSingle()

      if (!config?.regras_gratuidade?.ativo) {
        return { isParceiro: true, nivelCor: null, nivelNome: null }
      }

      const niveis = [...(config.regras_gratuidade.niveis ?? [])].sort(
        (a: any, b: any) => a.meta_indicados - b.meta_indicados
      )

      // Se tem override, usar diretamente
      if (parceiro.nivel_override) {
        const nivelOverride = niveis.find((n: any) => n.nome === parceiro.nivel_override)
        if (nivelOverride) {
          return { isParceiro: true, nivelCor: nivelOverride.cor, nivelNome: nivelOverride.nome }
        }
      }

      // Calcular nível baseado em indicados
      const { count: indicadosAtivos } = await (supabase as any)
        .from('indicacoes_parceiro')
        .select('*', { count: 'exact', head: true })
        .eq('parceiro_id', parceiro.id)
        .eq('status', 'ativa')

      const total = indicadosAtivos ?? 0
      let nivelAtual: any = null
      for (let i = niveis.length - 1; i >= 0; i--) {
        if (total >= niveis[i].meta_indicados) {
          nivelAtual = niveis[i]
          break
        }
      }

      return {
        isParceiro: true,
        nivelCor: nivelAtual?.cor ?? null,
        nivelNome: nivelAtual?.nome ?? null,
      }
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000, // 5 min cache
  })

  return data ?? { isParceiro: false, nivelCor: null, nivelNome: null }
}
