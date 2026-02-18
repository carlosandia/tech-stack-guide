/**
 * AIDEV-NOTE: React Query hooks para Campos de Formulários
 * Conforme PRD-17 - Etapa F2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formulariosApi, type CampoFormulario } from '../services/formularios.api'

export function useCamposFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'campos'],
    queryFn: () => formulariosApi.listarCampos(formularioId!),
    enabled: !!formularioId,
  })
}

export function useCriarCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CampoFormulario>) =>
      formulariosApi.criarCampo(formularioId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      const previous = queryClient.getQueryData<CampoFormulario[]>(['formularios', formularioId, 'campos'])
      // AIDEV-NOTE: Optimistic add — gera ID temporário para UI instantânea
      const optimistic: CampoFormulario = {
        id: `temp-${Date.now()}`,
        formulario_id: formularioId,
        nome: payload.nome || '',
        label: payload.label || '',
        tipo: payload.tipo || 'texto',
        ordem: payload.ordem ?? (previous?.length || 0),
        obrigatorio: payload.obrigatorio ?? false,
        largura: payload.largura || 'full',
        placeholder: payload.placeholder || null,
        texto_ajuda: payload.texto_ajuda || null,
        valor_padrao: payload.valor_padrao || null,
        opcoes: payload.opcoes || null,
        validacoes: payload.validacoes || null,
        mapeamento_campo: payload.mapeamento_campo || null,
        condicional_ativo: false,
        condicional_campo_id: null,
        condicional_operador: null,
        condicional_valor: null,
        pai_campo_id: payload.pai_campo_id || null,
        coluna_indice: payload.coluna_indice ?? null,
        etapa_numero: payload.etapa_numero ?? null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        mostrar_para_leads_conhecidos: null,
        alternativa_para_campo_id: null,
        prefill_ativo: null,
        prefill_fonte: null,
        prefill_chave: null,
        prioridade_profiling: null,
        valor_pontuacao: null,
        regras_pontuacao: null,
      } as CampoFormulario
      const updated = [...(previous || []), optimistic].sort((a, b) => a.ordem - b.ordem)
      queryClient.setQueryData(['formularios', formularioId, 'campos'], updated)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['formularios', formularioId, 'campos'], context.previous)
      }
      toast.error('Erro ao adicionar campo')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
    },
    onSuccess: () => {
      toast.success('Campo adicionado')
    },
  })
}

export function useAtualizarCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campoId, payload }: { campoId: string; payload: Partial<CampoFormulario> }) =>
      formulariosApi.atualizarCampo(formularioId, campoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      toast.success('Campo atualizado')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar campo')
    },
  })
}

export function useExcluirCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campoId: string) =>
      formulariosApi.excluirCampo(formularioId, campoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      toast.success('Campo removido')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao remover campo')
    },
  })
}

export function useReordenarCampos(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campos: { id: string; ordem: number }[]) =>
      formulariosApi.reordenarCampos(formularioId, campos),
    onMutate: async (novaOrdem) => {
      await queryClient.cancelQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      const previous = queryClient.getQueryData<CampoFormulario[]>(['formularios', formularioId, 'campos'])
      if (previous) {
        const orderMap = new Map(novaOrdem.map(c => [c.id, c.ordem]))
        const updated = previous.map(c => orderMap.has(c.id) ? { ...c, ordem: orderMap.get(c.id)! } : c).sort((a, b) => a.ordem - b.ordem)
        queryClient.setQueryData(['formularios', formularioId, 'campos'], updated)
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['formularios', formularioId, 'campos'], context.previous)
      }
      toast.error('Erro ao reordenar campos')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
    },
  })
}
