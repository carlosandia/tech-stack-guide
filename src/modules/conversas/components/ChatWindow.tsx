/**
 * AIDEV-NOTE: Janela de chat completa (header + mensagens + input)
 * Usa Supabase direto via conversas.api.ts
 */

import { useState, useMemo, useEffect } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { MensagensProntasPopover } from './MensagensProntasPopover'
import { useMensagens, useEnviarTexto } from '../hooks/useMensagens'
import { useAlterarStatusConversa, useMarcarComoLida } from '../hooks/useConversas'
import { conversasApi } from '../services/conversas.api'
import { toast } from 'sonner'
import type { Conversa } from '../services/conversas.api'

interface ChatWindowProps {
  conversa: Conversa
  onBack: () => void
  onOpenDrawer: () => void
}

export function ChatWindow({ conversa, onBack, onOpenDrawer }: ChatWindowProps) {
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)

  const {
    data: mensagensData,
    isLoading: mensagensLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMensagens(conversa.id)

  const enviarTexto = useEnviarTexto()
  const alterarStatus = useAlterarStatusConversa()
  const marcarLida = useMarcarComoLida()

  // Flatten paginated messages
  const mensagens = useMemo(() => {
    if (!mensagensData?.pages) return []
    return mensagensData.pages.flatMap((page) => page.mensagens)
  }, [mensagensData])

  // Auto-mark as read when opening conversation
  useEffect(() => {
    if (conversa.mensagens_nao_lidas > 0) {
      marcarLida.mutate(conversa.id)
    }
  }, [conversa.id]) // Only on conversation change

  const handleSendMessage = (texto: string) => {
    enviarTexto.mutate({
      conversaId: conversa.id,
      texto,
    })
  }

  const handleSendNote = async (conteudo: string) => {
    try {
      await conversasApi.criarNota(conversa.contato_id, conteudo)
      toast.success('Nota salva')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar nota')
    }
  }

  const handleQuickReplySelect = (conteudo: string) => {
    enviarTexto.mutate({
      conversaId: conversa.id,
      texto: conteudo,
    })
  }

  const handleAlterarStatus = (status: 'aberta' | 'pendente' | 'fechada') => {
    alterarStatus.mutate({ id: conversa.id, status })
  }

  const handleCriarOportunidade = () => {
    toast.info('Funcionalidade de criação de oportunidade será integrada em breve')
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <ChatHeader
        conversa={conversa}
        onBack={onBack}
        onOpenDrawer={onOpenDrawer}
        onAlterarStatus={handleAlterarStatus}
        onCriarOportunidade={handleCriarOportunidade}
      />

      <ChatMessages
        mensagens={mensagens}
        isLoading={mensagensLoading}
        hasMore={!!hasNextPage}
        onLoadMore={() => fetchNextPage()}
        isFetchingMore={isFetchingNextPage}
      />

      <div className="relative">
        <MensagensProntasPopover
          isOpen={quickRepliesOpen}
          onClose={() => setQuickRepliesOpen(false)}
          onSelect={handleQuickReplySelect}
        />
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendNote={handleSendNote}
          onOpenQuickReplies={() => setQuickRepliesOpen(true)}
          isSending={enviarTexto.isPending}
          disabled={conversa.status === 'fechada'}
        />
      </div>
    </div>
  )
}
