/**
 * AIDEV-NOTE: Hooks TanStack Query para Configuração de Pipeline
 * Conforme PRD-07 RF-03 a RF-09
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pipelineConfigApi } from '../services/pipeline-config.api'

// =====================================================
// Etapas
// =====================================================

export function useEtapasFunil(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'etapas', funilId],
    queryFn: () => pipelineConfigApi.listarEtapas(funilId!),
    enabled: !!funilId,
  })
}

export function useCriarEtapa(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { nome: string; tipo?: string; cor?: string; probabilidade?: number; ordem?: number }) =>
      pipelineConfigApi.criarEtapa(funilId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'etapas', funilId] })
      toast.success('Etapa criada')
    },
    onError: () => toast.error('Erro ao criar etapa'),
  })
}

export function useAtualizarEtapa(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ etapaId, payload }: { etapaId: string; payload: { nome?: string; cor?: string; probabilidade?: number } }) =>
      pipelineConfigApi.atualizarEtapa(etapaId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'etapas', funilId] })
      toast.success('Etapa atualizada')
    },
    onError: () => toast.error('Erro ao atualizar etapa'),
  })
}

export function useExcluirEtapa(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (etapaId: string) => pipelineConfigApi.excluirEtapa(etapaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'etapas', funilId] })
      toast.success('Etapa excluída')
    },
    onError: () => toast.error('Erro ao excluir etapa'),
  })
}

export function useReordenarEtapas(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ordens: Array<{ id: string; ordem: number }>) =>
      pipelineConfigApi.reordenarEtapas(ordens),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'etapas', funilId] })
    },
    onError: () => toast.error('Erro ao reordenar'),
  })
}

// =====================================================
// Campos
// =====================================================

export function useCamposVinculados(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'campos', funilId],
    queryFn: () => pipelineConfigApi.listarCamposVinculados(funilId!),
    enabled: !!funilId,
  })
}

export function useCamposDisponiveis() {
  return useQuery({
    queryKey: ['pipeline-config', 'campos-disponiveis'],
    queryFn: () => pipelineConfigApi.listarCamposDisponiveis(),
  })
}

export function useVincularCampo(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campoId, config }: { campoId: string; config?: { obrigatorio?: boolean; visivel?: boolean; exibir_card?: boolean } }) =>
      pipelineConfigApi.vincularCampo(funilId, campoId, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'campos', funilId] })
      toast.success('Campo vinculado')
    },
    onError: () => toast.error('Erro ao vincular campo'),
  })
}

export function useDesvincularCampo(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => pipelineConfigApi.desvincularCampo(vinculoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'campos', funilId] })
      toast.success('Campo desvinculado')
    },
    onError: () => toast.error('Erro ao desvincular'),
  })
}

export function useAtualizarVinculoCampo(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vinculoId, payload }: { vinculoId: string; payload: { obrigatorio?: boolean; visivel?: boolean; exibir_card?: boolean } }) =>
      pipelineConfigApi.atualizarVinculoCampo(vinculoId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'campos', funilId] })
    },
    onError: () => toast.error('Erro ao atualizar campo'),
  })
}

// =====================================================
// Distribuição
// =====================================================

export function useDistribuicao(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'distribuicao', funilId],
    queryFn: () => pipelineConfigApi.buscarDistribuicao(funilId!),
    enabled: !!funilId,
  })
}

export function useSalvarDistribuicao(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof pipelineConfigApi.salvarDistribuicao>[1]) =>
      pipelineConfigApi.salvarDistribuicao(funilId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'distribuicao', funilId] })
      toast.success('Distribuição salva')
    },
    onError: () => toast.error('Erro ao salvar distribuição'),
  })
}

// =====================================================
// Atividades (Tarefas por Etapa)
// =====================================================

export function useAtividadesEtapa(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'atividades', funilId],
    queryFn: () => pipelineConfigApi.listarAtividadesEtapa(funilId!),
    enabled: !!funilId,
  })
}

export function useTarefasTemplatesDisponiveis() {
  return useQuery({
    queryKey: ['pipeline-config', 'tarefas-templates'],
    queryFn: () => pipelineConfigApi.listarTarefasTemplates(),
  })
}

export function useVincularTarefaEtapa(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ etapaFunilId, tarefaTemplateId }: { etapaFunilId: string; tarefaTemplateId: string }) =>
      pipelineConfigApi.vincularTarefaEtapa(etapaFunilId, tarefaTemplateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'atividades', funilId] })
      toast.success('Tarefa vinculada')
    },
    onError: () => toast.error('Erro ao vincular tarefa'),
  })
}

export function useDesvincularTarefaEtapa(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => pipelineConfigApi.desvincularTarefaEtapa(vinculoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'atividades', funilId] })
      toast.success('Tarefa desvinculada')
    },
    onError: () => toast.error('Erro ao desvincular tarefa'),
  })
}

// =====================================================
// Qualificação
// =====================================================

export function useRegrasVinculadas(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'qualificacao', funilId],
    queryFn: () => pipelineConfigApi.listarRegrasVinculadas(funilId!),
    enabled: !!funilId,
  })
}

export function useRegrasDisponiveis() {
  return useQuery({
    queryKey: ['pipeline-config', 'regras-disponiveis'],
    queryFn: () => pipelineConfigApi.listarRegrasDisponiveis(),
  })
}

export function useVincularRegra(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (regraId: string) => pipelineConfigApi.vincularRegra(funilId, regraId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'qualificacao', funilId] })
      toast.success('Regra vinculada')
    },
    onError: () => toast.error('Erro ao vincular regra'),
  })
}

export function useDesvincularRegra(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => pipelineConfigApi.desvincularRegra(vinculoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'qualificacao', funilId] })
      toast.success('Regra desvinculada')
    },
    onError: () => toast.error('Erro ao desvincular regra'),
  })
}

// =====================================================
// Motivos
// =====================================================

export function useMotivosVinculados(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'motivos', funilId],
    queryFn: () => pipelineConfigApi.listarMotivosVinculados(funilId!),
    enabled: !!funilId,
  })
}

export function useMotivosDisponiveis() {
  return useQuery({
    queryKey: ['pipeline-config', 'motivos-disponiveis'],
    queryFn: () => pipelineConfigApi.listarMotivosDisponiveis(),
  })
}

export function useVincularMotivo(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (motivoId: string) => pipelineConfigApi.vincularMotivo(funilId, motivoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'motivos', funilId] })
      toast.success('Motivo vinculado')
    },
    onError: () => toast.error('Erro ao vincular motivo'),
  })
}

export function useDesvincularMotivo(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => pipelineConfigApi.desvincularMotivo(vinculoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'motivos', funilId] })
      toast.success('Motivo desvinculado')
    },
    onError: () => toast.error('Erro ao desvincular motivo'),
  })
}

// =====================================================
// Pipeline update
// =====================================================

export function useAtualizarPipeline(funilId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { nome?: string; descricao?: string | null; cor?: string; exigir_motivo_resultado?: boolean; ativo?: boolean }) =>
      pipelineConfigApi.atualizarPipeline(funilId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funis'] })
      qc.invalidateQueries({ queryKey: ['funil', funilId] })
      toast.success('Pipeline atualizada')
    },
    onError: () => toast.error('Erro ao atualizar pipeline'),
  })
}

export function useMembrosPipeline(funilId: string | null) {
  return useQuery({
    queryKey: ['pipeline-config', 'membros', funilId],
    queryFn: () => pipelineConfigApi.listarMembros(funilId!),
    enabled: !!funilId,
  })
}
