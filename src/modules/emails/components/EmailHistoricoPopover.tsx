/**
 * AIDEV-NOTE: Popover de histórico de abertura de emails enviados
 * Mostra emails enviados que foram abertos pelo destinatário (dados do banco)
 */

import { useState, useRef, useEffect, forwardRef } from 'react'
import { MailOpen, Mail, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AberturaItem } from '../hooks/useEmailHistorico'

const INITIAL_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
]

function getInitialColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

interface Props {
  items: AberturaItem[]
  isLoading: boolean
  onSelect: (id: string) => void
}

export const EmailHistoricoPopover = forwardRef<HTMLDivElement, Props>(function EmailHistoricoPopover({ items, isLoading, onSelect }, _ref) {
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
        title="Histórico de Abertura"
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">Hist. Abertura</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Histórico de Abertura</span>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <span className="text-sm">Carregando...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Mail className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">Nenhum email aberto pelo destinatário</span>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.email_id)
                    setOpen(false)
                  }}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getInitialColor(item.para_email)} flex items-center justify-center text-white text-xs font-bold mt-0.5`}>
                    {item.para_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium text-foreground truncate">{item.para_email}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                        <MailOpen className="w-3 h-3" />
                        {item.total_aberturas}x
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.assunto}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Aberto em {format(new Date(item.primeira_abertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
})
EmailHistoricoPopover.displayName = 'EmailHistoricoPopover'
