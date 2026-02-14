/**
 * AIDEV-NOTE: Hook para preferências de colunas persistidas no banco
 * Prioridade: banco > localStorage > default
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { buscarPreferenciaColunas, salvarPreferenciaColunas } from '../services/preferenciasColunasContatos'
import type { ColumnConfig } from '../components/ContatoColumnsToggle'
import type { TipoContato } from '../services/contatos.api'
import { toast } from 'sonner'

export function usePreferenciaColunas(tipo: TipoContato) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['preferencias_colunas', tipo, user?.id],
    queryFn: () => buscarPreferenciaColunas(tipo),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: (colunas: ColumnConfig[]) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return salvarPreferenciaColunas(user.id, tipo, colunas)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias_colunas', tipo] })
      toast.success('Configuração de colunas salva com sucesso')
    },
    onError: () => {
      toast.error('Erro ao salvar configuração de colunas')
    },
  })

  return {
    colunaSalva: query.data ?? null,
    isLoading: query.isLoading,
    salvar: mutation.mutate,
    isSaving: mutation.isPending,
  }
}
