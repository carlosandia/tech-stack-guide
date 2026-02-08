/**
 * AIDEV-NOTE: Janela de chat completa (header + mensagens + input)
 * Integra NovaOportunidadeModal para criação de oportunidade a partir da conversa
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { MensagensProntasPopover } from './MensagensProntasPopover'
import { useMensagens, useEnviarTexto } from '../hooks/useMensagens'
import { useAlterarStatusConversa, useMarcarComoLida } from '../hooks/useConversas'
import { conversasApi } from '../services/conversas.api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { NovaOportunidadeModal } from '@/modules/negocios/components/modals/NovaOportunidadeModal'
import type { Conversa } from '../services/conversas.api'

interface ChatWindowProps {
  conversa: Conversa
  onBack: () => void
  onOpenDrawer: () => void
}

export function ChatWindow({ conversa, onBack, onOpenDrawer }: ChatWindowProps) {
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)
  const [oportunidadeModalOpen, setOportunidadeModalOpen] = useState(false)
  const [funilData, setFunilData] = useState<{ funilId: string; etapaId: string } | null>(null)

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

  const handleFileSelected = useCallback(async (file: File, tipo: string) => {
    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop() || 'bin'
      const path = `conversas/${conversa.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file)

      if (uploadError) {
        toast.error('Erro ao fazer upload do arquivo')
        return
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      await conversasApi.enviarMedia(conversa.id, {
        tipo,
        media_url: urlData.publicUrl,
        caption: undefined,
        filename: file.name,
      })

      toast.success('Arquivo enviado')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar arquivo')
    }
  }, [conversa.id])

  const handleCriarOportunidade = useCallback(async () => {
    try {
      // Buscar primeiro funil ativo da organização
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Usuário não autenticado'); return }

      const { data: usr } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (!usr?.organizacao_id) { toast.error('Organização não encontrada'); return }

      const { data: funis } = await supabase
        .from('funis')
        .select('id')
        .eq('organizacao_id', usr.organizacao_id)
        .eq('ativo', true)
        .is('deletado_em', null)
        .order('criado_em', { ascending: true })
        .limit(1)

      if (!funis?.length) {
        toast.error('Nenhum funil configurado. Configure um funil em Negócios primeiro.')
        return
      }

      const funilId = funis[0].id

      // Buscar etapa de entrada do funil
      const { data: etapas } = await supabase
        .from('etapas_funil')
        .select('id')
        .eq('funil_id', funilId)
        .eq('ativo', true)
        .is('deletado_em', null)
        .order('ordem', { ascending: true })
        .limit(1)

      if (!etapas?.length) {
        toast.error('Nenhuma etapa configurada no funil.')
        return
      }

      setFunilData({ funilId, etapaId: etapas[0].id })
      setOportunidadeModalOpen(true)
    } catch (error: any) {
      toast.error('Erro ao carregar dados do funil')
    }
  }, [])

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
          onFileSelected={handleFileSelected}
          isSending={enviarTexto.isPending}
          disabled={conversa.status === 'fechada'}
        />
      </div>

      {/* Modal de Nova Oportunidade */}
      {oportunidadeModalOpen && funilData && (
        <NovaOportunidadeModal
          funilId={funilData.funilId}
          etapaEntradaId={funilData.etapaId}
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
