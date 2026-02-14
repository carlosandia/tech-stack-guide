/**
 * AIDEV-NOTE: Página principal do módulo de Conversas (PRD-09)
 * Split-view estilo WhatsApp Web: lista à esquerda + chat à direita
 * Conecta ações de contexto: arquivar, fixar, marcar não lida, apagar
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, BarChart3 } from 'lucide-react'
import { SelecionarPipelineModal } from '../components/SelecionarPipelineModal'
import { NovaOportunidadeModal } from '@/modules/negocios/components/modals/NovaOportunidadeModal'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useConversas, useArquivarConversa, useDesarquivarConversa, useFixarConversa, useMarcarNaoLida, useApagarConversa } from '../hooks/useConversas'
import { useConversasRealtime } from '../hooks/useConversasRealtime'
import { useLabels, useSincronizarLabels } from '../hooks/useWhatsAppLabels'
import { ConversasList } from '../components/ConversasList'
import { FiltrosConversas } from '../components/FiltrosConversas'
import { ConversaEmpty } from '../components/ConversaEmpty'
import { ChatWindow } from '../components/ChatWindow'
import { ContatoDrawer } from '../components/ContatoDrawer'
import { NovaConversaModal } from '../components/NovaConversaModal'
import { ConversasMetricasPanel } from '../components/ConversasMetricasPanel'
import { toast } from 'sonner'
import type { ListarConversasParams } from '../services/conversas.api'

export function ConversasPage() {
  const { setActions, setSubtitle, setCenterContent } = useAppToolbar()
  const [conversaAtivaId, setConversaAtivaId] = useState<string | null>(null)
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [novaConversaAberta, setNovaConversaAberta] = useState(false)
  const [filtros, setFiltros] = useState<ListarConversasParams>({})
  const [confirmApagar, setConfirmApagar] = useState<string | null>(null)
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [oportunidadeModalOpen, setOportunidadeModalOpen] = useState(false)
  const [funilData, setFunilData] = useState<{ funilId: string; etapaId: string } | null>(null)
  const [metricasVisiveis, setMetricasVisiveis] = useState<boolean>(() => {
    try {
      return localStorage.getItem('conversas_metricas_visiveis') === 'true'
    } catch {
      return false
    }
  })

  const toggleMetricas = useCallback(() => {
    setMetricasVisiveis(prev => {
      const next = !prev
      try { localStorage.setItem('conversas_metricas_visiveis', String(next)) } catch {}
      return next
    })
  }, [])

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversas(filtros)
  useConversasRealtime(conversaAtivaId)

  // AIDEV-NOTE: Auto-sync labels do WhatsApp na montagem da página
  useLabels() // keep query active for realtime invalidation
  const sincronizarLabels = useSincronizarLabels()
  const labelsSyncRef = useRef(false)

  const arquivarConversa = useArquivarConversa()
  const desarquivarConversa = useDesarquivarConversa()
  const fixarConversa = useFixarConversa()
  const marcarNaoLida = useMarcarNaoLida()
  const apagarConversa = useApagarConversa()

  // Flatten paginated data
  const conversas = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((p) => p.conversas)
  }, [data])

  // AIDEV-NOTE: Auto-sync labels do WhatsApp sempre ao carregar a página
  useEffect(() => {
    if (!labelsSyncRef.current && conversas.length > 0) {
      const whatsappConversa = conversas.find(c => c.canal === 'whatsapp' && c.sessao_whatsapp_id)
      if (whatsappConversa) {
        labelsSyncRef.current = true
        import('@/lib/supabase').then(({ supabase }) => {
          supabase
            .from('sessoes_whatsapp')
            .select('session_name')
            .eq('id', whatsappConversa.sessao_whatsapp_id!)
            .maybeSingle()
            .then(({ data: sessao }) => {
              if (sessao?.session_name) {
                sincronizarLabels.mutate(sessao.session_name)
              }
            })
        })
      }
    }
  }, [conversas])

  const conversaAtiva = conversas.find((c) => c.id === conversaAtivaId) || null

  // Toolbar actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleMetricas}
          className={`
            flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200
            ${metricasVisiveis
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }
          `}
          title="Métricas de atendimento"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Métricas</span>
        </button>
        <button
          onClick={() => setNovaConversaAberta(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nova Conversa</span>
        </button>
      </div>
    )
    setSubtitle(null)
    setCenterContent(null)
    return () => {
      setActions(null)
      setSubtitle(null)
      setCenterContent(null)
    }
  }, [setActions, setSubtitle, setCenterContent, setNovaConversaAberta, metricasVisiveis, toggleMetricas])

  // List action handlers
  const handleArquivar = useCallback((id: string) => {
    // Verificar se a conversa está arquivada para decidir a ação
    const conversa = conversas.find(c => c.id === id)
    if (conversa?.arquivada) {
      desarquivarConversa.mutate(id, {
        onSuccess: () => { if (conversaAtivaId === id) setConversaAtivaId(null) }
      })
    } else {
      arquivarConversa.mutate(id, {
        onSuccess: () => { if (conversaAtivaId === id) setConversaAtivaId(null) }
      })
    }
  }, [arquivarConversa, desarquivarConversa, conversaAtivaId, conversas])

  const handleFixar = useCallback((id: string, fixar: boolean) => {
    fixarConversa.mutate({ conversaId: id, fixar })
  }, [fixarConversa])

  const handleMarcarNaoLida = useCallback((id: string) => {
    marcarNaoLida.mutate(id)
  }, [marcarNaoLida])

  const handleApagarFromList = useCallback((id: string) => {
    setConfirmApagar(id)
  }, [])

  const confirmApagarConversa = useCallback(() => {
    if (!confirmApagar) return
    apagarConversa.mutate(confirmApagar, {
      onSuccess: () => { if (conversaAtivaId === confirmApagar) setConversaAtivaId(null) }
    })
    setConfirmApagar(null)
  }, [confirmApagar, apagarConversa, conversaAtivaId])

  const handleInsertQuickReply = (_conteudo: string) => {}

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {metricasVisiveis && <ConversasMetricasPanel />}

      <div className="flex-1 flex overflow-hidden">
        <div className={`
          flex flex-col border-r border-border/60 bg-white/80 backdrop-blur-md
          w-full lg:w-[320px] xl:w-[340px] flex-shrink-0
          ${conversaAtivaId ? 'hidden lg:flex' : 'flex'}
        `}>
          <FiltrosConversas
            canal={filtros.canal}
            status={filtros.status}
            busca={filtros.busca}
            arquivadas={filtros.arquivadas}
            onCanalChange={(canal) => setFiltros((f) => ({ ...f, canal }))}
            onStatusChange={(status) => setFiltros((f) => ({ ...f, status }))}
            onBuscaChange={(busca) => setFiltros((f) => ({ ...f, busca }))}
            onArquivadasChange={(arquivadas) => setFiltros((f) => ({ ...f, arquivadas }))}
          />

          <ConversasList
            conversas={conversas}
            conversaAtivaId={conversaAtivaId}
            onSelectConversa={setConversaAtivaId}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            onArquivar={handleArquivar}
            onFixar={handleFixar}
            onMarcarNaoLida={handleMarcarNaoLida}
            onApagar={handleApagarFromList}
          />
        </div>

        <div className={`
          flex-1 flex min-w-0
          ${conversaAtivaId ? 'flex' : 'hidden lg:flex'}
        `}>
          {conversaAtiva ? (
            <>
              <ChatWindow
                conversa={conversaAtiva}
                onBack={() => setConversaAtivaId(null)}
                onOpenDrawer={() => setDrawerAberto(true)}
                onConversaApagada={() => setConversaAtivaId(null)}
              />
              <ContatoDrawer
                conversa={conversaAtiva}
                isOpen={drawerAberto}
                onClose={() => setDrawerAberto(false)}
                onInsertQuickReply={handleInsertQuickReply}
                onCriarOportunidade={() => {
                  setDrawerAberto(false)
                  setPipelineModalOpen(true)
                }}
              />
            </>
          ) : (
            <ConversaEmpty />
          )}
        </div>

        <NovaConversaModal
          isOpen={novaConversaAberta}
          onClose={() => setNovaConversaAberta(false)}
          onConversaCriada={(id) => setConversaAtivaId(id)}
        />
      </div>

      {/* Confirm delete dialog from list */}
      {confirmApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmApagar(null)}>
          <div className="bg-popover border border-border rounded-lg shadow-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground mb-2">Apagar conversa?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A conversa será removida do CRM e do WhatsApp. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmApagar(null)} className="px-4 py-2 text-sm text-foreground bg-muted hover:bg-accent rounded-md transition-colors">
                Cancelar
              </button>
              <button onClick={confirmApagarConversa} className="px-4 py-2 text-sm text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors">
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {pipelineModalOpen && (
        <SelecionarPipelineModal
          onClose={() => setPipelineModalOpen(false)}
          onSelect={(funilId, etapaId) => {
            setFunilData({ funilId, etapaId })
            setPipelineModalOpen(false)
            setOportunidadeModalOpen(true)
          }}
        />
      )}

      {oportunidadeModalOpen && funilData && conversaAtiva?.contato && (
        <NovaOportunidadeModal
          funilId={funilData.funilId}
          etapaEntradaId={funilData.etapaId}
          contatoPreSelecionado={{
            id: conversaAtiva.contato.id,
            tipo: 'pessoa' as const,
            nome: conversaAtiva.contato.nome,
            email: conversaAtiva.contato.email,
            telefone: conversaAtiva.contato.telefone,
          }}
          onClose={() => {
            setOportunidadeModalOpen(false)
            setFunilData(null)
          }}
          onSuccess={() => {
            toast.success('Oportunidade criada com sucesso')
            setOportunidadeModalOpen(false)
            setFunilData(null)
          }}
        />
      )}
    </div>
  )
}

export default ConversasPage
