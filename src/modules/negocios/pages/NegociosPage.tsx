/**
 * AIDEV-NOTE: Página principal do módulo de Negócios (Kanban)
 * Conforme PRD-07 - Módulo de Negócios
 * Layout: Toolbar (via context) + KanbanBoard com scroll
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useFunis, useCriarFunil, useArquivarFunil, useDesarquivarFunil, useExcluirFunil } from '../hooks/useFunis'
import { useKanban } from '../hooks/useKanban'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { KanbanEmptyState } from '../components/kanban/KanbanEmptyState'
import { NegociosToolbar } from '../components/toolbar/NegociosToolbar'
import { NovaPipelineModal } from '../components/modals/NovaPipelineModal'
import { NovaOportunidadeModal } from '../components/modals/NovaOportunidadeModal'
import { FecharOportunidadeModal } from '../components/modals/FecharOportunidadeModal'
import type { Funil, Oportunidade } from '../services/negocios.api'
import { negociosApi } from '../services/negocios.api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const STORAGE_KEY = 'negocios_funil_ativo'

export default function NegociosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const queryClient = useQueryClient()

  // State
  const [funilAtivoId, setFunilAtivoId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })
  const [busca, setBusca] = useState('')
  const [showNovaPipeline, setShowNovaPipeline] = useState(false)
  const [showNovaOportunidade, setShowNovaOportunidade] = useState(false)
  const [fecharOp, setFecharOp] = useState<{
    oportunidade: Oportunidade
    etapaId: string
    tipo: 'ganho' | 'perda'
  } | null>(null)

  // Queries
  const { data: funis, isLoading: funisLoading } = useFunis()
  const criarFunil = useCriarFunil()
  const arquivarFunil = useArquivarFunil()
  const desarquivarFunil = useDesarquivarFunil()
  const excluirFunil = useExcluirFunil()

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (funis && funis.length > 0 && !funilAtivoId) {
      const ativas = funis.filter(f => f.ativo !== false && !f.arquivado)
      if (ativas.length > 0) {
        setFunilAtivoId(ativas[0].id)
        localStorage.setItem(STORAGE_KEY, ativas[0].id)
      }
    }
  }, [funis, funilAtivoId])

  // Kanban data
  const { data: kanbanData, isLoading: kanbanLoading } = useKanban(
    funilAtivoId,
    { busca: busca.length >= 3 ? busca : undefined }
  )

  const funilAtivo = funis?.find(f => f.id === funilAtivoId) || null

  // Encontrar a etapa de entrada
  const etapaEntradaId = kanbanData?.etapas?.find(e => e.tipo === 'entrada')?.id
    || kanbanData?.etapas?.[0]?.id
    || ''

  const handleSelectFunil = useCallback((funil: Funil) => {
    setFunilAtivoId(funil.id)
    localStorage.setItem(STORAGE_KEY, funil.id)
    setBusca('')
  }, [])

  const handleCriarPipeline = useCallback(async (data: { nome: string; descricao?: string; cor?: string; membrosIds?: string[] }) => {
    try {
      const { membrosIds, ...funilData } = data
      const novoFunil = await criarFunil.mutateAsync(funilData)

      // Adicionar membros se selecionados
      if (membrosIds && membrosIds.length > 0) {
        try {
          await negociosApi.adicionarMembrosFunil(novoFunil.id, membrosIds)
        } catch (err) {
          console.error('Erro ao adicionar membros:', err)
        }
      }

      setFunilAtivoId(novoFunil.id)
      localStorage.setItem(STORAGE_KEY, novoFunil.id)
      setShowNovaPipeline(false)
      toast.success('Pipeline criado com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar pipeline')
    }
  }, [criarFunil])

  const handleArquivar = useCallback(async (funilId: string) => {
    try {
      await arquivarFunil.mutateAsync(funilId)
      // Se a pipeline arquivada era a ativa, selecionar outra
      if (funilId === funilAtivoId) {
        const ativas = (funis || []).filter(f => f.id !== funilId && f.ativo !== false && !f.arquivado)
        if (ativas.length > 0) {
          setFunilAtivoId(ativas[0].id)
          localStorage.setItem(STORAGE_KEY, ativas[0].id)
        } else {
          setFunilAtivoId(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      toast.success('Pipeline arquivada')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao arquivar')
    }
  }, [arquivarFunil, funilAtivoId, funis])

  const handleDesarquivar = useCallback(async (funilId: string) => {
    try {
      await desarquivarFunil.mutateAsync(funilId)
      toast.success('Pipeline desarquivada')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desarquivar')
    }
  }, [desarquivarFunil])

  const handleExcluir = useCallback(async (funilId: string) => {
    try {
      await excluirFunil.mutateAsync(funilId)
      if (funilId === funilAtivoId) {
        const restantes = (funis || []).filter(f => f.id !== funilId && !f.deletado_em)
        if (restantes.length > 0) {
          setFunilAtivoId(restantes[0].id)
          localStorage.setItem(STORAGE_KEY, restantes[0].id)
        } else {
          setFunilAtivoId(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      toast.success('Pipeline excluída')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }, [excluirFunil, funilAtivoId, funis])

  const handleDropGanhoPerda = useCallback((oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => {
    setFecharOp({ oportunidade, etapaId, tipo })
  }, [])

  const handleNovaOportunidade = useCallback(() => {
    if (!funilAtivoId || !etapaEntradaId) {
      toast.error('Selecione uma pipeline primeiro')
      return
    }
    setShowNovaOportunidade(true)
  }, [funilAtivoId, etapaEntradaId])

  // Loading state
  if (funisLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const funisAtivas = (funis || []).filter(f => f.ativo !== false && !f.arquivado)
  const semPipelines = funisAtivas.length === 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar injeta via context */}
      <NegociosToolbar
        funis={funis || []}
        funilAtivo={funilAtivo}
        onSelectFunil={handleSelectFunil}
        onNovaPipeline={() => setShowNovaPipeline(true)}
        onNovaOportunidade={handleNovaOportunidade}
        onArquivar={handleArquivar}
        onDesarquivar={handleDesarquivar}
        onExcluir={handleExcluir}
        busca={busca}
        onBuscaChange={setBusca}
        isAdmin={isAdmin}
      />

      {/* Content */}
      {semPipelines ? (
        <KanbanEmptyState onCriarPipeline={() => setShowNovaPipeline(true)} />
      ) : kanbanData ? (
        <KanbanBoard
          data={kanbanData}
          isLoading={kanbanLoading}
          onDropGanhoPerda={handleDropGanhoPerda}
        />
      ) : kanbanLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {/* Modals */}
      {showNovaPipeline && (
        <NovaPipelineModal
          onClose={() => setShowNovaPipeline(false)}
          onSubmit={handleCriarPipeline}
          loading={criarFunil.isPending}
        />
      )}

      {showNovaOportunidade && funilAtivoId && etapaEntradaId && (
        <NovaOportunidadeModal
          funilId={funilAtivoId}
          etapaEntradaId={etapaEntradaId}
          onClose={() => setShowNovaOportunidade(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
            toast.success('Oportunidade criada com sucesso!')
          }}
        />
      )}

      {fecharOp && funilAtivoId && (
        <FecharOportunidadeModal
          oportunidade={fecharOp.oportunidade}
          etapaDestinoId={fecharOp.etapaId}
          tipo={fecharOp.tipo}
          funilId={funilAtivoId}
          onClose={() => setFecharOp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
            toast.success(fecharOp.tipo === 'ganho' ? 'Oportunidade ganha! 🎉' : 'Oportunidade marcada como perdida')
            setFecharOp(null)
          }}
        />
      )}
    </div>
  )
}
