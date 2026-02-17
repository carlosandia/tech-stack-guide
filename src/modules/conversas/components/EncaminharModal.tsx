/**
 * AIDEV-NOTE: Modal para selecionar destino de encaminhamento de mensagem
 * Suporta multi-select com rate limiting anti-spam (WAHA Plus GOWS)
 * Limite: máx 5 destinos por encaminhamento, intervalo mínimo 3s entre envios
 */

import { useState, useMemo } from 'react'
import { Search, X, MessageSquare, User, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { useConversas } from '../hooks/useConversas'
import type { Mensagem } from '../services/conversas.api'

// AIDEV-NOTE: Limites anti-spam para WAHA Plus (não-oficial)
const LIMITES_ENCAMINHAMENTO = {
  MAX_DESTINOS: 5,
  INTERVALO_MS: 3000, // 3 segundos entre cada envio
}

interface EncaminharModalProps {
  mensagem: Mensagem
  onForward: (conversaId: string, chatId: string) => Promise<void> | void
  onClose: () => void
  onNavigateConversa?: (conversaId: string) => void
}

export function EncaminharModal({ mensagem, onForward, onClose, onNavigateConversa }: EncaminharModalProps) {
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState<{ id: string; chatId: string; nome: string }[]>([])
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
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

  const toggleSelecionado = (conversa: { id: string; chat_id: string; contato?: { nome?: string | null; nome_fantasia?: string | null } | null; nome?: string | null }) => {
    const nome = conversa.contato?.nome || conversa.contato?.nome_fantasia || conversa.nome || conversa.chat_id
    setSelecionados(prev => {
      const exists = prev.find(s => s.id === conversa.id)
      if (exists) return prev.filter(s => s.id !== conversa.id)
      if (prev.length >= LIMITES_ENCAMINHAMENTO.MAX_DESTINOS) return prev
      return [...prev, { id: conversa.id, chatId: conversa.chat_id, nome: nome || '' }]
    })
  }

  const handleEnviar = async () => {
    if (selecionados.length === 0 || enviando) return
    setEnviando(true)
    setProgresso(0)

    for (let i = 0; i < selecionados.length; i++) {
      try {
        await onForward(selecionados[i].id, selecionados[i].chatId)
      } catch {
        // erro já tratado pelo hook
      }
      setProgresso(i + 1)

      // Intervalo anti-spam entre envios (exceto o último)
      if (i < selecionados.length - 1) {
        await new Promise(r => setTimeout(r, LIMITES_ENCAMINHAMENTO.INTERVALO_MS))
      }
    }

    setEnviando(false)

    // Se encaminhou para apenas 1 destino, navegar para a conversa
    if (selecionados.length === 1 && onNavigateConversa) {
      onNavigateConversa(selecionados[0].id)
    }

    onClose()
  }

  const isSelecionado = (id: string) => selecionados.some(s => s.id === id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={!enviando ? onClose : undefined} />
      <div className="relative bg-popover border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Encaminhar mensagem</h3>
            {selecionados.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selecionados.length}/{LIMITES_ENCAMINHAMENTO.MAX_DESTINOS} selecionados
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={enviando} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
          <p className="text-xs text-muted-foreground truncate">{getPreview()}</p>
        </div>

        {/* Anti-spam warning */}
        <div className="px-4 py-1.5 bg-muted/40 border-b border-border/50 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Máx. {LIMITES_ENCAMINHAMENTO.MAX_DESTINOS} destinos • Intervalo de {LIMITES_ENCAMINHAMENTO.INTERVALO_MS / 1000}s entre envios
          </p>
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
              disabled={enviando}
            />
          </div>
        </div>

        {/* Selected chips */}
        {selecionados.length > 0 && (
          <div className="px-4 py-2 border-b border-border/50 flex flex-wrap gap-1.5">
            {selecionados.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                {s.nome}
                {!enviando && (
                  <button onClick={() => setSelecionados(prev => prev.filter(p => p.id !== s.id))} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Sending progress */}
        {enviando && (
          <div className="px-4 py-2 bg-muted/20 border-b border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-foreground">Encaminhando {progresso}/{selecionados.length}...</span>
            </div>
            <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(progresso / selecionados.length) * 100}%` }}
              />
            </div>
          </div>
        )}

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
              const selected = isSelecionado(c.id)
              const atMaximo = selecionados.length >= LIMITES_ENCAMINHAMENTO.MAX_DESTINOS && !selected
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSelecionado(c)}
                  disabled={enviando || atMaximo}
                  className={`flex items-center gap-3 w-full px-4 py-3 transition-colors text-left border-b border-border/20 last:border-0 ${
                    selected ? 'bg-primary/5' : 'hover:bg-accent/50'
                  } ${atMaximo ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
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

        {/* Footer */}
        {selecionados.length > 0 && !enviando && (
          <div className="px-4 py-3 border-t border-border flex justify-end">
            <button
              onClick={handleEnviar}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Encaminhar para {selecionados.length} {selecionados.length === 1 ? 'conversa' : 'conversas'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}