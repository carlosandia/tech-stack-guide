/**
 * AIDEV-NOTE: Janela de chat completa (header + busca + mensagens + input)
 * Integra SelecionarPipelineModal + NovaOportunidadeModal para criação de oportunidade
 * Integra AudioRecorder, CameraCapture, ContatoSelectorModal, EnqueteModal
 * Conecta ações de silenciar, limpar e apagar conversa
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { BuscaMensagensBar } from './BuscaMensagensBar'
import { MensagensProntasPopover } from './MensagensProntasPopover'
import { SelecionarPipelineModal } from './SelecionarPipelineModal'
import { CameraCapture } from './CameraCapture'
import { ContatoSelectorModal } from './ContatoSelectorModal'
import { EnqueteModal } from './EnqueteModal'
import { useMensagens, useEnviarTexto, useEnviarContato, useEnviarEnquete } from '../hooks/useMensagens'
import { useAlterarStatusConversa, useMarcarComoLida, useSilenciarConversa, useLimparConversa, useApagarConversa, useApagarMensagem } from '../hooks/useConversas'
import { conversasApi } from '../services/conversas.api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { NovaOportunidadeModal } from '@/modules/negocios/components/modals/NovaOportunidadeModal'
import type { Conversa, ConversaContato, Mensagem } from '../services/conversas.api'

interface ChatWindowProps {
  conversa: Conversa
  onBack: () => void
  onOpenDrawer: () => void
  onConversaApagada?: () => void
}

export function ChatWindow({ conversa, onBack, onOpenDrawer, onConversaApagada }: ChatWindowProps) {
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [oportunidadeModalOpen, setOportunidadeModalOpen] = useState(false)
  const [funilData, setFunilData] = useState<{ funilId: string; etapaId: string } | null>(null)

  // Search state
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscaIndex, setBuscaIndex] = useState(0)

  // New feature states
  const [cameraOpen, setCameraOpen] = useState(false)
  const [contatoModalOpen, setContatoModalOpen] = useState(false)
  const [enqueteModalOpen, setEnqueteModalOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Mensagem | null>(null)

  const {
    data: mensagensData,
    isLoading: mensagensLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMensagens(conversa.id)

  const enviarTexto = useEnviarTexto()
  const enviarContato = useEnviarContato()
  const enviarEnquete = useEnviarEnquete()
  const alterarStatus = useAlterarStatusConversa()
  const marcarLida = useMarcarComoLida()
  const silenciarConversa = useSilenciarConversa()
  const limparConversa = useLimparConversa()
  const apagarConversa = useApagarConversa()
  const apagarMensagem = useApagarMensagem()

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
    enviarTexto.mutate({
      conversaId: conversa.id,
      texto,
      replyTo: replyingTo?.message_id,
    })
    setReplyingTo(null)
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

  const handleAudioSend = useCallback(async (blob: Blob, _duration: number) => {
    try {
      const isOgg = blob.type.includes('ogg')
      const ext = isOgg ? 'ogg' : 'webm'
      const contentType = isOgg ? 'audio/ogg' : 'audio/webm'
      const path = `conversas/${conversa.id}/audio_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, blob, { contentType })

      if (uploadError) {
        toast.error('Erro ao fazer upload do áudio')
        return
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      await conversasApi.enviarMedia(conversa.id, {
        tipo: 'audio',
        media_url: urlData.publicUrl,
      })

      toast.success('Áudio enviado')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar áudio')
    }
  }, [conversa.id])

  const handleCameraCapture = useCallback(async (blob: Blob) => {
    setCameraOpen(false)
    try {
      const path = `conversas/${conversa.id}/foto_${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, blob, { contentType: 'image/jpeg' })

      if (uploadError) {
        toast.error('Erro ao fazer upload da foto')
        return
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      await conversasApi.enviarMedia(conversa.id, {
        tipo: 'image',
        media_url: urlData.publicUrl,
      })

      toast.success('Foto enviada')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar foto')
    }
  }, [conversa.id])

  const handleContatoSelect = useCallback((contato: ConversaContato, vcard: string) => {
    setContatoModalOpen(false)
    const nome = contato.nome || contato.nome_fantasia || 'Contato'
    enviarContato.mutate({ conversaId: conversa.id, contatoNome: nome, vcard })
  }, [conversa.id, enviarContato])

  const handleEnqueteSend = useCallback((data: { pergunta: string; opcoes: string[]; multiplas: boolean }) => {
    setEnqueteModalOpen(false)
    enviarEnquete.mutate({
      conversaId: conversa.id,
      pergunta: data.pergunta,
      opcoes: data.opcoes,
      multiplas: data.multiplas,
    })
  }, [conversa.id, enviarEnquete])

  const handleCriarOportunidade = useCallback(() => {
    setPipelineModalOpen(true)
  }, [])

  const handlePipelineSelecionada = useCallback((funilId: string, etapaId: string) => {
    setFunilData({ funilId, etapaId })
    setPipelineModalOpen(false)
    setOportunidadeModalOpen(true)
  }, [])

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

  const mensagensDestacadas = useMemo(() => {
    if (!termoBusca.trim()) return new Set<string>()
    return new Set(resultadosBusca.map(r => r.mensagem.id))
  }, [resultadosBusca, termoBusca])

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
        onSilenciar={(silenciar) => silenciarConversa.mutate({ conversaId: conversa.id, silenciar })}
        onLimparConversa={() => limparConversa.mutate(conversa.id)}
        onApagarConversa={() => {
          apagarConversa.mutate(conversa.id, { onSuccess: () => onConversaApagada?.() })
        }}
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
        conversaId={conversa.id}
        onDeleteMessage={(mensagemId, messageWahaId, paraTodos) => {
          apagarMensagem.mutate({ conversaId: conversa.id, mensagemId, messageWahaId, paraTodos })
        }}
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
          onAudioSend={handleAudioSend}
          onOpenCamera={() => setCameraOpen(true)}
          onOpenContato={() => setContatoModalOpen(true)}
          onOpenEnquete={() => setEnqueteModalOpen(true)}
          isSending={enviarTexto.isPending}
          disabled={conversa.status === 'fechada'}
        />
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {contatoModalOpen && (
        <ContatoSelectorModal
          onSelect={handleContatoSelect}
          onClose={() => setContatoModalOpen(false)}
        />
      )}

      {enqueteModalOpen && (
        <EnqueteModal
          onSend={handleEnqueteSend}
          onClose={() => setEnqueteModalOpen(false)}
        />
      )}

      {pipelineModalOpen && (
        <SelecionarPipelineModal
          onClose={() => setPipelineModalOpen(false)}
          onSelect={handlePipelineSelecionada}
        />
      )}

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
