/**
 * AIDEV-NOTE: Popover de Mensagens Prontas (Quick Replies)
 * Acionado por "/" no textarea ou pelo ícone de raio
 */

import { useState, useEffect, useRef } from 'react'
import { X, Search, Zap, Loader2 } from 'lucide-react'
import { useMensagensProntas } from '../hooks/useMensagensProntas'

interface MensagensProntasPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (conteudo: string) => void
}

export function MensagensProntasPopover({ isOpen, onClose, onSelect }: MensagensProntasPopoverProps) {
  const [busca, setBusca] = useState('')
  const { data, isLoading } = useMensagensProntas(busca || undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setBusca('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const prontas = data?.mensagens_prontas || []
  const pessoais = prontas.filter((m) => m.tipo === 'pessoal')
  const globais = prontas.filter((m) => m.tipo === 'global')

  return (
    <>
      <div className="fixed inset-0 z-[300]" onClick={onClose} />
      <div className="absolute bottom-full left-0 right-0 mb-1 z-[301] bg-white/95 backdrop-blur-md border border-border rounded-lg shadow-lg max-h-[300px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Mensagens Prontas
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por atalho ou título..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : !prontas.length ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma mensagem pronta encontrada
            </div>
          ) : (
            <>
              {pessoais.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase bg-muted/30">
                    Minhas Mensagens
                  </p>
                  {pessoais.map((mp) => (
                    <button
                      key={mp.id}
                      onClick={() => {
                        onSelect(mp.conteudo)
                        onClose()
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                        <span className="text-xs text-foreground font-medium">{mp.titulo}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {mp.conteudo.slice(0, 80)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {globais.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase bg-muted/30">
                    Mensagens da Equipe
                  </p>
                  {globais.map((mp) => (
                    <button
                      key={mp.id}
                      onClick={() => {
                        onSelect(mp.conteudo)
                        onClose()
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                        <span className="text-xs text-foreground font-medium">{mp.titulo}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {mp.conteudo.slice(0, 80)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
