/**
 * AIDEV-NOTE: Modal para selecionar destino de encaminhamento de mensagem
 * Usa lista de conversas ativas do CRM para selecionar destino
 */

import { useState, useMemo } from 'react'
import { Search, X, MessageSquare, User } from 'lucide-react'
import { useConversas } from '../hooks/useConversas'
import type { Mensagem } from '../services/conversas.api'

interface EncaminharModalProps {
  mensagem: Mensagem
  onForward: (conversaId: string, chatId: string) => void
  onClose: () => void
}

export function EncaminharModal({ mensagem, onForward, onClose }: EncaminharModalProps) {
  const [busca, setBusca] = useState('')
  const { data, isLoading } = useConversas({ limit: 50 })

  const conversas = useMemo(() => {
    const all = data?.pages?.flatMap(p => p.conversas) || []
    if (!busca.trim()) return all
    const termo = busca.toLowerCase()
    return all.filter(c => {
      const nome = c.contato?.nome || c.contato?.nome_fantasia || c.nome || c.chat_id || ''
      return nome.toLowerCase().includes(termo)
    })
  }, [data, busca])

  // Preview of the message being forwarded
  const getPreview = () => {
    switch (mensagem.tipo) {
      case 'text': return mensagem.body || 'Mensagem'
      case 'image': return '📷 Foto'
      case 'video': return '🎥 Vídeo'
      case 'audio': return '🎵 Áudio'
      case 'document': return `📄 ${mensagem.media_filename || 'Documento'}`
      case 'location': return '📍 Localização'
      case 'contact': return '👤 Contato'
      case 'poll': return `📊 ${mensagem.poll_question || 'Enquete'}`
      default: return 'Mensagem'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-popover border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Encaminhar mensagem</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
          <p className="text-xs text-muted-foreground truncate">{getPreview()}</p>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversas.map((c) => {
              const nome = c.contato?.nome || c.contato?.nome_fantasia || c.nome || c.chat_id
              return (
                <button
                  key={c.id}
                  onClick={() => onForward(c.id, c.chat_id)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b border-border/20 last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {c.foto_url ? (
                      <img src={c.foto_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.chat_id}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
