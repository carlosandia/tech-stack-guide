/**
 * AIDEV-NOTE: Dropdowns dinâmicos de Funil e Etapa para ações CRM
 * Consulta tabelas funis e etapas_funil via Supabase
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface FunilEtapaSelectProps {
  funilId: string
  etapaId?: string
  onFunilChange: (id: string) => void
  onEtapaChange?: (id: string) => void
  mostrarEtapa?: boolean
  labelFunil?: string
  labelEtapa?: string
}

export function FunilEtapaSelect({
  funilId,
  etapaId,
  onFunilChange,
  onEtapaChange,
  mostrarEtapa = true,
  labelFunil = 'Pipeline / Funil',
  labelEtapa = 'Etapa',
}: FunilEtapaSelectProps) {
  // Buscar funis ativos
  const { data: funis, isLoading: loadingFunis } = useQuery({
    queryKey: ['automacao-funis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funis')
        .select('id, nome')
        .eq('arquivado', false)
        .is('deletado_em', null)
        .order('nome')
      if (error) throw error
      return data || []
    },
    staleTime: 60_000,
  })

  // Buscar etapas do funil selecionado
  const { data: etapas, isLoading: loadingEtapas } = useQuery({
    queryKey: ['automacao-etapas', funilId],
    queryFn: async () => {
      if (!funilId) return []
      const { data, error } = await supabase
        .from('etapas_funil')
        .select('id, nome, ordem')
        .eq('funil_id', funilId)
        .is('deletado_em', null)
        .order('ordem')
      if (error) throw error
      return data || []
    },
    enabled: !!funilId,
    staleTime: 60_000,
  })

  return (
    <div className="space-y-3" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{labelFunil}</label>
        {loadingFunis ? (
          <p className="text-xs text-muted-foreground mt-1">Carregando pipelines...</p>
        ) : (
          <select
            value={funilId}
            onChange={e => {
              onFunilChange(e.target.value)
            }}
            onMouseDown={e => e.stopPropagation()}
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Selecione uma pipeline...</option>
            {(funis || []).map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        )}
        {!loadingFunis && (funis || []).length === 0 && (
          <p className="text-[11px] text-amber-600 mt-1">Nenhuma pipeline encontrada. Crie uma em Negócios.</p>
        )}
      </div>

      {mostrarEtapa && funilId && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">{labelEtapa}</label>
          {loadingEtapas ? (
            <p className="text-xs text-muted-foreground mt-1">Carregando etapas...</p>
          ) : (
            <select
              value={etapaId || ''}
              onChange={e => onEtapaChange?.(e.target.value)}
              onMouseDown={e => e.stopPropagation()}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Selecione uma etapa...</option>
              {(etapas || []).map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
