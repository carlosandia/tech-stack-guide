/**
 * AIDEV-NOTE: Janela de chat completa (header + busca + mensagens + input)
 * Integra SelecionarPipelineModal + NovaOportunidadeModal para criação de oportunidade
 * Integra AudioRecorder, CameraCapture, ContatoSelectorModal, EnqueteModal, EncaminharModal
 * Conecta ações de silenciar, limpar, apagar, fixar, reagir e encaminhar
 */

import { useState, useMemo, useEffect, useCallback, useRef, forwardRef } from 'react'
import { compressImage, validateFileSize } from '@/shared/utils/compressMedia'
import { compressVideo } from '@/shared/utils/compressVideo'
import { compressAudio } from '@/shared/utils/compressAudio'
import { calculateFileHash } from '@/shared/utils/fileHash'
import { MediaQueue, type QueuedMedia } from './MediaQueue'
import { useAuth } from '@/providers/AuthProvider'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput, type ChatInputHandle } from './ChatInput'
import { BuscaMensagensBar } from './BuscaMensagensBar'
import { MensagensProntasPopover } from './MensagensProntasPopover'
import { SelecionarPipelineModal } from './SelecionarPipelineModal'
import { CameraCapture } from './CameraCapture'
import { ContatoSelectorModal } from './ContatoSelectorModal'
import { EnqueteModal } from './EnqueteModal'
// AIDEV-NOTE: EncaminharModal removido - GOWS não suporta forward
// AIDEV-NOTE: PinnedMessageBanner removido por solicitação do usuário
import { useMensagens, useAckRealtime, useEnviarTexto, useEnviarMedia, useEnviarContato, useEnviarEnquete } from '../hooks/useMensagens'
import {
  useAlterarStatusConversa, useMarcarComoLida, useSilenciarConversa,
  useLimparConversa, useApagarConversa, useApagarMensagem,
  useReagirMensagem,
} from '../hooks/useConversas'
import { conversasApi } from '../services/conversas.api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { NovaOportunidadeModal } from '@/modules/negocios/components/modals/NovaOportunidadeModal'
import type { Conversa, ConversaContato, Mensagem } from '../services/conversas.api'

// AIDEV-NOTE: Mapeamento de extensão para MIME type correto - evita que DOCX chegue como PDF no WhatsApp
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    pdf: 'application/pdf',
    csv: 'text/csv',
    txt: 'text/plain',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
  }
  return map[ext || ''] || ''
}

function getCorrectMimeType(file: File): string {
  // Prefer file.type if it's specific (not empty or generic)
  if (file.type && file.type !== 'application/octet-stream') return file.type
  // Fallback: infer from extension
  return getMimeTypeFromExtension(file.name) || 'application/octet-stream'
}

// AIDEV-NOTE: Ícone por tipo de arquivo para UI de progresso múltiplo
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return '🖼️'
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return '🎥'
  if (['mp3', 'ogg', 'wav', 'aac', 'flac'].includes(ext)) return '🎵'
  if (['pdf'].includes(ext)) return '📕'
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📎'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'
  return '📁'
}

interface UploadItem {
  id: string
  filename: string
  progress: number
  icon: string
  fading?: boolean
}

interface ChatWindowProps {
  conversa: Conversa
  onBack: () => void
  onOpenDrawer: () => void
  onConversaApagada?: () => void
  onNavigateConversa?: (conversaId: string) => void
  onStartConversation?: (telefone: string) => void
}

export const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(function ChatWindow({ conversa, onBack, onOpenDrawer, onConversaApagada, onNavigateConversa: _onNavigateConversa, onStartConversation }, _ref) {
  const { user } = useAuth()
  const myAvatarUrl = user?.avatar_url || null
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [oportunidadeModalOpen, setOportunidadeModalOpen] = useState(false)
  const [funilData, setFunilData] = useState<{ funilId: string; etapaId: string } | null>(null)

  // Search state
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscaIndex, setBuscaIndex] = useState(0)

  // Feature states
  const [cameraOpen, setCameraOpen] = useState(false)
  const [contatoModalOpen, setContatoModalOpen] = useState(false)
  const [enqueteModalOpen, setEnqueteModalOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Mensagem | null>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  // AIDEV-NOTE: encaminharMsg removido - GOWS não suporta forward

  const {
    data: mensagensData,
    isLoading: mensagensLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMensagens(conversa.id)

  useAckRealtime(conversa.id)

  const enviarTexto = useEnviarTexto()
  const enviarContato = useEnviarContato()
  const enviarEnquete = useEnviarEnquete()
  const alterarStatus = useAlterarStatusConversa()
  const marcarLida = useMarcarComoLida()
  const silenciarConversa = useSilenciarConversa()
  const limparConversa = useLimparConversa()
  const apagarConversa = useApagarConversa()
  const apagarMensagem = useApagarMensagem()
  const reagirMensagem = useReagirMensagem()
  const enviarMedia = useEnviarMedia()
  // AIDEV-NOTE: fixarMensagem/desafixarMensagem removidos por solicitação do usuário

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
  }, [conversa.id])

  // Reset search on conversation change + auto-focus no input
  useEffect(() => {
    setBuscaAberta(false)
    setTermoBusca('')
    setBuscaIndex(0)
    // Limpar fila de mídia ao trocar de conversa
    setMediaQueue(prev => {
      prev.forEach(item => { if (item.thumbnail) URL.revokeObjectURL(item.thumbnail) })
      return []
    })
    // AIDEV-NOTE: Auto-focus no textarea ao selecionar conversa
    setTimeout(() => chatInputRef.current?.focusTextarea(), 100)
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
    enviarTexto.mutate({ conversaId: conversa.id, texto: conteudo, isTemplate: true })
  }

  const handleAlterarStatus = (status: 'aberta' | 'pendente' | 'fechada') => {
    alterarStatus.mutate({ id: conversa.id, status })
  }

  // Upload progress state - supports multiple simultaneous uploads
  const [uploads, setUploads] = useState<UploadItem[]>([])

  // AIDEV-NOTE: Fila de mídia — arquivos ficam aqui após upload, aguardando envio manual pelo usuário
  const [mediaQueue, setMediaQueue] = useState<QueuedMedia[]>([])
  const [sendingQueue, setSendingQueue] = useState(false)

  const handleFileSelected = useCallback(async (file: File, tipo: string) => {
    // AIDEV-NOTE: 1. Validar limite de tamanho antes de qualquer processamento
    const sizeError = validateFileSize(file, tipo)
    if (sizeError) {
      toast.error(sizeError)
      return
    }

    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const icon = getFileIcon(file.name)

    const updateProgress = (progress: number) => {
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress } : u))
    }

    try {
      setUploads(prev => [...prev, { id: uploadId, filename: file.name, progress: 5, icon }])

      // AIDEV-NOTE: 2. Comprimir conforme o tipo
      let processed: File | Blob
      if (tipo === 'image') {
        processed = await compressImage(file, file.name)
      } else if (tipo === 'video') {
        processed = await compressVideo(file)
      } else if (tipo === 'audio') {
        processed = await compressAudio(file)
      } else {
        processed = file
      }

      updateProgress(20)

      const finalFile = processed instanceof File ? processed : new File([processed], file.name)
      const correctMime = getCorrectMimeType(finalFile)

      // AIDEV-NOTE: 3. Deduplicação por SHA-256
      const hash = await calculateFileHash(finalFile)
      const ext = finalFile.name.split('.').pop() || 'bin'
      const dedupPath = `${conversa.organizacao_id}/${conversa.id}/${hash}.${ext}`

      updateProgress(30)

      // AIDEV-NOTE: Deduplicação com match exato — .search() do Storage faz substring, não exact
      // Buscamos até 1000 arquivos e filtramos client-side para garantir nome idêntico ao SHA-256
      const { data: existingFiles } = await supabase.storage
        .from('chat-media')
        .list(`${conversa.organizacao_id}/${conversa.id}`, { limit: 1000 })
      const fileAlreadyExists = existingFiles?.some(f => f.name === `${hash}.${ext}`) ?? false

      let publicUrl: string

      if (fileAlreadyExists) {
        // Reutilizar URL existente — evita re-upload
        const { data: urlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(dedupPath)
        publicUrl = urlData.publicUrl
        updateProgress(100)
      } else {
        // Upload normal — cacheControl 1 ano: path inclui SHA-256 (imutável)
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(dedupPath, finalFile, { contentType: correctMime, cacheControl: '31536000' })

        if (uploadError) {
          setUploads(prev => prev.filter(u => u.id !== uploadId))
          toast.error(`Erro ao enviar ${file.name}`)
          return
        }

        updateProgress(70)

        const { data: urlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(dedupPath)
        publicUrl = urlData.publicUrl

        updateProgress(90)

        // AIDEV-NOTE: 4. Compressão async de PDF via Edge Function
        const isPdf = correctMime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        if (isPdf) {
          supabase.functions.invoke('compress-pdf', {
            body: { storage_path: dedupPath, bucket: 'chat-media' },
          }).catch(err => console.warn('[compress-pdf] chat-media failed:', err))
        }
      }

      updateProgress(100)

      // Gerar thumbnail para imagens
      let thumbnail: string | undefined
      if (tipo === 'image') {
        thumbnail = URL.createObjectURL(finalFile)
      }

      // AIDEV-NOTE: Adicionar à fila em vez de enviar imediatamente
      setMediaQueue(prev => [...prev, {
        id: uploadId,
        filename: file.name,
        tipo,
        media_url: publicUrl,
        mimetype: correctMime,
        thumbnail,
      }])

      // Fade out progress bar
      setTimeout(() => {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, fading: true } : u))
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== uploadId))
        }, 300)
      }, 400)
    } catch (error: any) {
      setUploads(prev => prev.filter(u => u.id !== uploadId))
      toast.error(error?.message || `Erro ao enviar ${file.name}`)
    }
  }, [conversa.id, conversa.organizacao_id])

  const handleRemoveFromQueue = useCallback((id: string) => {
    setMediaQueue(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.thumbnail) URL.revokeObjectURL(item.thumbnail)
      return prev.filter(i => i.id !== id)
    })
  }, [])

  const handleSendQueue = useCallback(async () => {
    if (mediaQueue.length === 0 || sendingQueue) return
    setSendingQueue(true)

    try {
      // AIDEV-NOTE: Enviar itens em ordem sequencial via hook (invalida cache automaticamente)
      for (const item of mediaQueue) {
        await enviarMedia.mutateAsync({
          conversaId: conversa.id,
          dados: {
            tipo: item.tipo,
            media_url: item.media_url,
            caption: undefined,
            filename: item.filename,
            mimetype: item.mimetype,
          },
        })
      }

      // Limpar thumbnails
      mediaQueue.forEach(item => {
        if (item.thumbnail) URL.revokeObjectURL(item.thumbnail)
      })
      setMediaQueue([])
      toast.success(`${mediaQueue.length === 1 ? 'Arquivo enviado' : `${mediaQueue.length} arquivos enviados`}`)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar arquivos da fila')
    } finally {
      setSendingQueue(false)
    }
  }, [mediaQueue, sendingQueue, conversa.id])

  const [audioSending, setAudioSending] = useState(false)

  const handleAudioSend = useCallback(async (blob: Blob, _duration: number) => {
    setAudioSending(true)
    try {
      // AIDEV-NOTE: Áudio deve ser enviado como OGG/Opus para compatibilidade com WhatsApp
      const isOgg = blob.type.includes('ogg')
      const ext = isOgg ? 'ogg' : 'webm'
      const contentType = isOgg ? 'audio/ogg; codecs=opus' : 'audio/webm; codecs=opus'
      // AIDEV-NOTE: O path DEVE começar com organizacao_id para passar na RLS do bucket chat-media
      const path = `${conversa.organizacao_id}/${conversa.id}/audio_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, blob, { contentType, cacheControl: '86400' })

      if (uploadError) {
        toast.error('Erro ao fazer upload do áudio')
        return
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      await enviarMedia.mutateAsync({
        conversaId: conversa.id,
        dados: {
          tipo: 'audio',
          media_url: urlData.publicUrl,
          mimetype: contentType,
        },
      })

      toast.success('Áudio enviado')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar áudio')
    } finally {
      setAudioSending(false)
    }
  }, [conversa.id])

  const handleCameraCapture = useCallback(async (blob: Blob) => {
    setCameraOpen(false)
    try {
      const compressed = await compressImage(blob, 'foto.jpg')
      // AIDEV-NOTE: O path DEVE começar com organizacao_id para passar na RLS do bucket chat-media
      const path = `${conversa.organizacao_id}/${conversa.id}/foto_${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, compressed, { contentType: 'image/jpeg', cacheControl: '86400' })

      if (uploadError) {
        toast.error('Erro ao fazer upload da foto')
        return
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      // AIDEV-NOTE: Foto da câmera também vai pra fila
      const thumbnail = URL.createObjectURL(compressed instanceof File ? compressed : new Blob([compressed]))
      setMediaQueue(prev => [...prev, {
        id: `cam_${Date.now()}`,
        filename: 'foto.jpg',
        tipo: 'image',
        media_url: urlData.publicUrl,
        mimetype: 'image/jpeg',
        thumbnail,
      }])
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar foto')
    }
  }, [conversa.id, conversa.organizacao_id])

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

  // New action handlers
  const handleReactMessage = useCallback((mensagem: Mensagem, emoji: string) => {
    reagirMensagem.mutate({ conversaId: conversa.id, messageWahaId: mensagem.message_id, emoji })
  }, [conversa.id, reagirMensagem])

  // AIDEV-NOTE: handleForwardMessage e handleForwardConfirm removidos - GOWS não suporta forward

  // AIDEV-NOTE: handlePinMessage e handleUnpinMessage removidos por solicitação do usuário

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

  // AIDEV-NOTE: Busca dados da empresa vinculada ao contato para pré-preencher modal
  const [empresaContato, setEmpresaContato] = useState<{ id: string; razao_social?: string; nome_fantasia?: string } | null>(null)

  useEffect(() => {
    if (!conversa.contato?.id) return
    supabase
      .from('contatos')
      .select('empresa_id')
      .eq('id', conversa.contato.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.empresa_id) {
          supabase
            .from('contatos')
            .select('id, razao_social, nome_fantasia')
            .eq('id', data.empresa_id)
            .maybeSingle()
            .then(({ data: emp }) => {
              if (emp) setEmpresaContato({ id: emp.id, razao_social: emp.razao_social ?? undefined, nome_fantasia: emp.nome_fantasia ?? undefined })
            })
        } else {
          setEmpresaContato(null)
        }
      })
  }, [conversa.contato?.id])

  const contatoPreSelecionado = useMemo(() => {
    if (!conversa.contato) return undefined
    return {
      id: conversa.contato.id,
      tipo: 'pessoa' as const,
      nome: conversa.contato.nome,
      email: conversa.contato.email,
      telefone: conversa.contato.telefone,
      empresa: empresaContato,
    }
  }, [conversa.contato, empresaContato])

  const mensagensDestacadas = useMemo(() => {
    if (!termoBusca.trim()) return new Set<string>()
    return new Set(resultadosBusca.map(r => r.mensagem.id))
  }, [resultadosBusca, termoBusca])

  const mensagemFocadaId = resultadosBusca[buscaIndex]?.mensagem.id || null

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full bg-background">
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

      {/* AIDEV-NOTE: PinnedMessageBanner removido por solicitação do usuário */}

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
        fotoUrl={conversa.contato?.foto_url || conversa.foto_url}
        myAvatarUrl={myAvatarUrl}
        onDeleteMessage={(mensagemId, messageWahaId, paraTodos) => {
          apagarMensagem.mutate({ conversaId: conversa.id, mensagemId, messageWahaId, paraTodos })
        }}
        onReplyMessage={(msg) => {
          setReplyingTo(msg)
          setTimeout(() => chatInputRef.current?.focusTextarea(), 50)
        }}
        onReactMessage={handleReactMessage}
        onForwardMessage={undefined}
        onPinMessage={undefined}
        onStartConversation={onStartConversation}
      />

      <div className="relative mt-auto">
        {uploads.length > 0 && (
          <div className="mx-3 mb-2 space-y-1.5 max-h-[180px] overflow-y-auto">
            {uploads.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/60 border border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-200 transition-opacity ${item.fading ? 'opacity-0' : 'opacity-100'}`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.filename}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums flex-shrink-0">
                  {item.progress}%
                </span>
              </div>
            ))}
          </div>
        )}
        <MediaQueue
          items={mediaQueue}
          onRemove={handleRemoveFromQueue}
          onSendAll={handleSendQueue}
          isSending={sendingQueue}
        />
        <MensagensProntasPopover
          isOpen={quickRepliesOpen}
          onClose={() => setQuickRepliesOpen(false)}
          onSelect={handleQuickReplySelect}
        />
        <ChatInput
          ref={chatInputRef}
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
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          audioSending={audioSending}
          conversaId={conversa.id}
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

      {/* AIDEV-NOTE: EncaminharModal removido - GOWS não suporta forward */}

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
})
ChatWindow.displayName = 'ChatWindow'
