/**
 * AIDEV-NOTE: Placeholder para mídia de grupo não persistida (on-demand)
 * Exibe ícone + tipo de mídia com botão "Visualizar" que busca via WAHA API.
 * Estados: idle, loading, error (mídia expirada), loaded (mídia carregada)
 */

import { useState, useCallback } from 'react'
import { Image, Video, FileText, Sticker, Eye, Loader2, AlertCircle } from 'lucide-react'
import type { Mensagem } from '../services/conversas.api'
import { conversasApi } from '../services/conversas.api'
import { MediaViewer } from './MediaViewer'

interface GroupMediaPlaceholderProps {
  mensagem: Mensagem
  conversaId: string
  chatId: string
}

type PlaceholderState = 'idle' | 'loading' | 'loaded' | 'error'

// AIDEV-NOTE: Mapeia tipo de mídia para ícone e label em PT-BR
function getMediaInfo(tipo: string, _mimetype?: string | null): { icon: React.ReactNode; label: string } {
  switch (tipo) {
    case 'image':
      return { icon: <Image className="w-8 h-8 text-muted-foreground/60" />, label: 'Imagem' }
    case 'video':
      return { icon: <Video className="w-8 h-8 text-muted-foreground/60" />, label: 'Vídeo' }
    case 'document':
      return { icon: <FileText className="w-8 h-8 text-muted-foreground/60" />, label: 'Documento' }
    case 'sticker':
      return { icon: <Sticker className="w-8 h-8 text-muted-foreground/60" />, label: 'Sticker' }
    default:
      return { icon: <FileText className="w-8 h-8 text-muted-foreground/60" />, label: 'Mídia' }
  }
}

function getMotivoPtBr(motivo?: string): string {
  switch (motivo) {
    case 'sessao_desconectada':
      return 'Sessão WhatsApp desconectada'
    case 'midia_expirada':
      return 'Mídia não disponível'
    case 'nao_suportado':
      return 'Não suportado pelo engine'
    case 'sessao_nao_encontrada':
      return 'Sessão não encontrada'
    default:
      return 'Mídia não disponível'
  }
}

export function GroupMediaPlaceholder({ mensagem, conversaId, chatId }: GroupMediaPlaceholderProps) {
  const [state, setState] = useState<PlaceholderState>('idle')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [_mediaMimetype, setMediaMimetype] = useState<string | null>(null)
  const [errorMotivo, setErrorMotivo] = useState<string>('')
  const [showViewer, setShowViewer] = useState(false)

  const { icon, label } = getMediaInfo(mensagem.tipo, mensagem.media_mimetype)

  const handleFetch = useCallback(async () => {
    setState('loading')
    try {
      const result = await conversasApi.fetchGroupMediaOnDemand(conversaId, mensagem.message_id, chatId)
      
      if (result.disponivel && result.media_url) {
        setMediaUrl(result.media_url)
        setMediaMimetype(result.mimetype || mensagem.media_mimetype || null)
        setState('loaded')
        
        // Para imagens e vídeos, abrir visualizador
        if (mensagem.tipo === 'image' || mensagem.tipo === 'video' || mensagem.tipo === 'sticker') {
          setShowViewer(true)
        }
        // Para documentos, abrir em nova aba
        if (mensagem.tipo === 'document') {
          window.open(result.media_url, '_blank')
        }
      } else {
        setErrorMotivo(getMotivoPtBr(result.motivo))
        setState('error')
      }
    } catch {
      setErrorMotivo('Erro ao buscar mídia')
      setState('error')
    }
  }, [conversaId, mensagem.message_id, mensagem.tipo, mensagem.media_mimetype, chatId])

  // Estado: mídia carregada (imagem)
  if (state === 'loaded' && mediaUrl && (mensagem.tipo === 'image' || mensagem.tipo === 'sticker')) {
    return (
      <>
        <img
          src={mediaUrl}
          alt={label}
          className="rounded-md max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowViewer(true)}
        />
        {mensagem.caption && (
          <p className="text-sm whitespace-pre-wrap break-words mt-1">{mensagem.caption}</p>
        )}
        {showViewer && (
          <MediaViewer
            url={mediaUrl}
            tipo="image"
            onClose={() => setShowViewer(false)}
          />
        )}
      </>
    )
  }

  // Estado: mídia carregada (vídeo)
  if (state === 'loaded' && mediaUrl && mensagem.tipo === 'video') {
    return (
      <>
        <video
          src={mediaUrl}
          controls
          className="rounded-md max-w-[280px] max-h-[300px]"
        />
        {mensagem.caption && (
          <p className="text-sm whitespace-pre-wrap break-words mt-1">{mensagem.caption}</p>
        )}
        {showViewer && (
          <MediaViewer
            url={mediaUrl}
            tipo="video"
            onClose={() => setShowViewer(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 border border-border/30 min-w-[200px] max-w-[280px]">
      {/* Ícone + label */}
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground font-medium">{label} de grupo</span>
      </div>

      {/* Metadados */}
      {mensagem.media_filename && (
        <p className="text-[11px] text-muted-foreground/70 truncate max-w-full">{mensagem.media_filename}</p>
      )}
      {mensagem.media_size && (
        <p className="text-[11px] text-muted-foreground/50">{(mensagem.media_size / 1024).toFixed(0)} KB</p>
      )}

      {/* Botão de ação baseado no estado */}
      {state === 'idle' && (
        <button
          onClick={handleFetch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Visualizar
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Buscando...
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-muted-foreground/70 text-[11px]">
            <AlertCircle className="w-3 h-3" />
            {errorMotivo}
          </div>
          <button
            onClick={handleFetch}
            className="text-[11px] text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {state === 'loaded' && mediaUrl && mensagem.tipo === 'document' && (
        <button
          onClick={() => window.open(mediaUrl, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Abrir documento
        </button>
      )}

      {/* Caption se houver */}
      {mensagem.caption && (
        <p className="text-sm whitespace-pre-wrap break-words text-foreground">{mensagem.caption}</p>
      )}
    </div>
  )
}
