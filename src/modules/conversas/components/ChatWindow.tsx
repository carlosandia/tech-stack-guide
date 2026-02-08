/**
 * AIDEV-NOTE: Janela de chat completa (header + mensagens + input)
 */

import { useState, useMemo, useCallback } from 'react'
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
  const [quickReplyText, setQuickReplyText] = useState('')

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

  // Mark as read when opening
  const handleMarkRead = useCallback(() => {
    if (conversa.mensagens_nao_lidas > 0) {
      marcarLida.mutate(conversa.id)
    }
  }, [conversa.id, conversa.mensagens_nao_lidas])

  // Auto-mark as read
  useState(() => {
    handleMarkRead()
  })

  const handleSendMessage = (texto: string) => {
    // If quickReplyText was set, use it instead
    const msgText = quickReplyText || texto
    setQuickReplyText('')

    enviarTexto.mutate({
      conversaId: conversa.id,
      texto: msgText,
    })
  }

  const handleSendNote = async (conteudo: string) => {
    try {
      await conversasApi.criarNota(conversa.contato_id, conteudo)
      toast.success('Nota salva')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao salvar nota')
    }
  }

  const handleQuickReplySelect = (conteudo: string) => {
    setQuickReplyText(conteudo)
    // Auto-send the quick reply
    enviarTexto.mutate({
      conversaId: conversa.id,
      texto: conteudo,
    })
  }

  const handleAlterarStatus = (status: 'aberta' | 'pendente' | 'fechada') => {
    alterarStatus.mutate({ id: conversa.id, status })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <ChatHeader
        conversa={conversa}
        onBack={onBack}
        onOpenDrawer={onOpenDrawer}
        onAlterarStatus={handleAlterarStatus}
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
