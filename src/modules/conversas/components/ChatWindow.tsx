/**
 * AIDEV-NOTE: Janela de chat completa (header + busca + mensagens + input)
 * Integra SelecionarPipelineModal + NovaOportunidadeModal para criação de oportunidade
 * Pré-preenche dados do contato da conversa na oportunidade
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { BuscaMensagensBar } from './BuscaMensagensBar'
import { MensagensProntasPopover } from './MensagensProntasPopover'
import { SelecionarPipelineModal } from './SelecionarPipelineModal'
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
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [oportunidadeModalOpen, setOportunidadeModalOpen] = useState(false)
  const [funilData, setFunilData] = useState<{ funilId: string; etapaId: string } | null>(null)

  // Search state
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscaIndex, setBuscaIndex] = useState(0)

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

  // Search results
  const resultadosBusca = useMemo(() => {
    if (!termoBusca.trim()) return []
    const termo = termoBusca.toLowerCase()
    return mensagens
      .map((m, idx) => ({ mensagem: m, index: idx }))
      .filter(({ mensagem }) => {
        const body = mensagem.body || ''
        return body.toLowerCase().includes(termo)
      })
  }, [mensagens, termoBusca])

  // Auto-mark as read when opening conversation
  useEffect(() => {
    if (conversa.mensagens_nao_lidas > 0) {
      marcarLida.mutate(conversa.id)
    }
  }, [conversa.id]) // Only on conversation change

  // Reset search on conversation change
  useEffect(() => {
    setBuscaAberta(false)
    setTermoBusca('')
    setBuscaIndex(0)
  }, [conversa.id])

  const handleSendMessage = (texto: string) => {
    enviarTexto.mutate({ conversaId: conversa.id, texto })
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
    enviarTexto.mutate({ conversaId: conversa.id, texto: conteudo })
  }

  const handleAlterarStatus = (status: 'aberta' | 'pendente' | 'fechada') => {
    alterarStatus.mutate({ id: conversa.id, status })
  }

  const handleFileSelected = useCallback(async (file: File, tipo: string) => {
    try {
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

  // Abrir seletor de pipeline
  const handleCriarOportunidade = useCallback(() => {
    setPipelineModalOpen(true)
  }, [])

  // Após selecionar pipeline, abrir modal de oportunidade
  const handlePipelineSelecionada = useCallback((funilId: string, etapaId: string) => {
    setFunilData({ funilId, etapaId })
    setPipelineModalOpen(false)
    setOportunidadeModalOpen(true)
  }, [])

  // Search handlers
  const handleSearch = (termo: string) => {
    setTermoBusca(termo)
    setBuscaIndex(0)
  }

  const handleSearchPrev = () => {
    if (resultadosBusca.length === 0) return
    setBuscaIndex((prev) => (prev - 1 + resultadosBusca.length) % resultadosBusca.length)
  }

  const handleSearchNext = () => {
    if (resultadosBusca.length === 0) return
    setBuscaIndex((prev) => (prev + 1) % resultadosBusca.length)
  }

  // Dados do contato para pré-preencher na oportunidade
  const contatoPreSelecionado = useMemo(() => {
    if (!conversa.contato) return undefined
    return {
      id: conversa.contato.id,
      tipo: 'pessoa' as const,
      nome: conversa.contato.nome,
      email: conversa.contato.email,
      telefone: conversa.contato.telefone,
    }
  }, [conversa.contato])

  // IDs de mensagens que correspondem à busca para highlight
  const mensagensDestacadas = useMemo(() => {
    if (!termoBusca.trim()) return new Set<string>()
    return new Set(resultadosBusca.map(r => r.mensagem.id))
  }, [resultadosBusca, termoBusca])

  // ID da mensagem atualmente focada na busca
  const mensagemFocadaId = resultadosBusca[buscaIndex]?.mensagem.id || null

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <ChatHeader
        conversa={conversa}
        onBack={onBack}
        onOpenDrawer={onOpenDrawer}
        onAlterarStatus={handleAlterarStatus}
        onCriarOportunidade={handleCriarOportunidade}
        onToggleBusca={() => setBuscaAberta((prev) => !prev)}
      />

      {buscaAberta && (
        <BuscaMensagensBar
          onClose={() => {
            setBuscaAberta(false)
            setTermoBusca('')
            setBuscaIndex(0)
          }}
          onSearch={handleSearch}
          totalResults={resultadosBusca.length}
          currentIndex={buscaIndex}
          onPrev={handleSearchPrev}
          onNext={handleSearchNext}
        />
      )}

      <ChatMessages
        mensagens={mensagens}
        isLoading={mensagensLoading}
        hasMore={!!hasNextPage}
        onLoadMore={() => fetchNextPage()}
        isFetchingMore={isFetchingNextPage}
        highlightIds={mensagensDestacadas}
        focusedId={mensagemFocadaId}
        conversaTipo={conversa.tipo}
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

      {/* Modal de Seleção de Pipeline */}
      {pipelineModalOpen && (
        <SelecionarPipelineModal
          onClose={() => setPipelineModalOpen(false)}
          onSelect={handlePipelineSelecionada}
        />
      )}

      {/* Modal de Nova Oportunidade */}
      {oportunidadeModalOpen && funilData && (
        <NovaOportunidadeModal
          funilId={funilData.funilId}
          etapaEntradaId={funilData.etapaId}
          contatoPreSelecionado={contatoPreSelecionado}
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
