/**
 * AIDEV-NOTE: Página principal do módulo de Conversas (PRD-09)
 * Split-view estilo WhatsApp Web: lista à esquerda + chat à direita
 * Mobile: lista ou chat em tela cheia
 * Usa useInfiniteQuery para scroll infinito na lista
 */

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useConversas } from '../hooks/useConversas'
import { useConversasRealtime } from '../hooks/useConversasRealtime'
import { ConversasList } from '../components/ConversasList'
import { FiltrosConversas } from '../components/FiltrosConversas'
import { ConversaEmpty } from '../components/ConversaEmpty'
import { ChatWindow } from '../components/ChatWindow'
import { ContatoDrawer } from '../components/ContatoDrawer'
import { NovaConversaModal } from '../components/NovaConversaModal'
import { toast } from 'sonner'
import type { ListarConversasParams } from '../services/conversas.api'

export function ConversasPage() {
  const { setActions, setSubtitle, setCenterContent } = useAppToolbar()
  const [conversaAtivaId, setConversaAtivaId] = useState<string | null>(null)
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [novaConversaAberta, setNovaConversaAberta] = useState(false)
  const [filtros, setFiltros] = useState<ListarConversasParams>({})

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversas(filtros)
  useConversasRealtime(conversaAtivaId)

  // Flatten paginated data
  const conversas = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((p) => p.conversas)
  }, [data])

  const conversaAtiva = conversas.find((c) => c.id === conversaAtivaId) || null

  // Limpa toolbar do AppLayout
  useEffect(() => {
    setActions(null)
    setSubtitle(null)
    setCenterContent(null)
    return () => {
      setActions(null)
      setSubtitle(null)
      setCenterContent(null)
    }
  }, [setActions, setSubtitle, setCenterContent])

  const handleInsertQuickReply = (_conteudo: string) => {
    // Drawer quick reply - could be passed to ChatWindow to insert into textarea
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Painel esquerdo - Lista de conversas */}
      <div className={`
        flex flex-col border-r border-border/60 bg-white/80 backdrop-blur-md
        w-full lg:w-[320px] xl:w-[340px] flex-shrink-0
        ${conversaAtivaId ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header do painel */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
          <button
            onClick={() => setNovaConversaAberta(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </button>
        </div>

        <FiltrosConversas
          canal={filtros.canal}
          status={filtros.status}
          busca={filtros.busca}
          onCanalChange={(canal) => setFiltros((f) => ({ ...f, canal }))}
          onStatusChange={(status) => setFiltros((f) => ({ ...f, status }))}
          onBuscaChange={(busca) => setFiltros((f) => ({ ...f, busca }))}
        />

        <ConversasList
          conversas={conversas}
          conversaAtivaId={conversaAtivaId}
          onSelectConversa={setConversaAtivaId}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>

      {/* Painel direito - Chat ou estado vazio */}
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
            />
            <ContatoDrawer
              conversa={conversaAtiva}
              isOpen={drawerAberto}
              onClose={() => setDrawerAberto(false)}
              onInsertQuickReply={handleInsertQuickReply}
              onCriarOportunidade={() => {
                setDrawerAberto(false)
                // O botão +Opp no header do ChatWindow gerencia o modal de oportunidade
                toast.info('Use o botão + no header do chat para criar uma oportunidade')
              }}
            />
          </>
        ) : (
          <ConversaEmpty />
        )}
      </div>

      {/* Modal nova conversa */}
      <NovaConversaModal
        isOpen={novaConversaAberta}
        onClose={() => setNovaConversaAberta(false)}
        onConversaCriada={(id) => setConversaAtivaId(id)}
      />
    </div>
  )
}

export default ConversasPage
