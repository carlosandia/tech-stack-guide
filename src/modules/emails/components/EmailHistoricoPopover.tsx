/**
 * AIDEV-NOTE: Popover de histórico de emails visualizados recentemente
 * Padrão manual (div absoluta + click outside) consistente com MoreMenu do EmailViewer
 */

import { useState, useRef, useEffect } from 'react'
import { History, Trash2, Mail } from 'lucide-react'
import type { HistoricoItem } from '../hooks/useEmailHistorico'

const INITIAL_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
]

function getInitialColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days}d`
  return `há ${Math.floor(days / 7)}sem`
}

interface Props {
  items: HistoricoItem[]
  onSelect: (id: string) => void
  onLimpar: () => void
}

export function EmailHistoricoPopover({ items, onSelect, onLimpar }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm font-medium transition-colors ${
          open
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
        title="Histórico"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">Histórico</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Últimos visualizados</span>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Mail className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">Nenhum email visualizado recentemente</span>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={`${item.id}-${item.timestamp}`}
                  onClick={() => {
                    onSelect(item.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getInitialColor(item.nome)} flex items-center justify-center text-white text-xs font-bold mt-0.5`}>
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium text-foreground truncate">{item.nome}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{item.assunto}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border px-3 py-2">
              <button
                onClick={() => {
                  onLimpar()
                  setOpen(false)
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Limpar histórico
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
