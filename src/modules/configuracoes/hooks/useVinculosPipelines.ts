/**
 * AIDEV-NOTE: Hook genérico para buscar vínculos de itens globais com pipelines.
 * Usado nos modais de edição para bloquear exclusão de itens vinculados.
 */

import { useQuery } from '@tanstack/react-query'
import { vinculosPipelinesApi, type VinculoPipeline } from '../services/configuracoes.api'

export type TipoVinculo = 'campo' | 'etapa' | 'tarefa' | 'motivo' | 'regra'

const fetchersMap: Record<TipoVinculo, (id: string) => Promise<VinculoPipeline[]>> = {
  campo: vinculosPipelinesApi.buscarVinculosCampo,
  etapa: vinculosPipelinesApi.buscarVinculosEtapa,
  tarefa: vinculosPipelinesApi.buscarVinculosTarefa,
  motivo: vinculosPipelinesApi.buscarVinculosMotivo,
  regra: vinculosPipelinesApi.buscarVinculosRegra,
}

/**
 * Busca vínculos de um item global com pipelines.
 * Ativado apenas quando itemId é fornecido (modo edição).
 */
export function useVinculosPipelines(tipo: TipoVinculo, itemId?: string | null) {
  return useQuery({
    queryKey: ['configuracoes', 'vinculos-pipelines', tipo, itemId],
    queryFn: () => fetchersMap[tipo](itemId!),
    enabled: !!itemId,
    staleTime: 30_000,
  })
}

/**
 * Busca vínculos em lote para campos (usado na CamposList).
 */
export function useVinculosCamposEmLote(campoIds: string[]) {
  return useQuery({
    queryKey: ['configuracoes', 'vinculos-pipelines', 'campos-lote', campoIds],
    queryFn: () => vinculosPipelinesApi.buscarVinculosCamposEmLote(campoIds),
    enabled: campoIds.length > 0,
    staleTime: 30_000,
  })
}
