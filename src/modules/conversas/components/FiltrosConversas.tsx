/**
 * AIDEV-NOTE: Filtros de conversas (busca, canal, status)
 * Canal: tabs inline | Status: select estilizado (compacto, uma linha)
 * Ícone Instagram incluído
 * Usa Portal para dropdown de status evitar clipping por overflow-hidden
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown, Archive } from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { InstagramIcon } from '@/shared/components/InstagramIcon'

interface FiltrosConversasProps {
  canal?: 'whatsapp' | 'instagram'
  status?: 'aberta' | 'pendente' | 'fechada'
  busca?: string
  arquivadas?: boolean
  onCanalChange: (canal?: 'whatsapp' | 'instagram') => void
  onStatusChange: (status?: 'aberta' | 'pendente' | 'fechada') => void
  onBuscaChange: (busca?: string) => void
  onArquivadasChange?: (arquivadas: boolean) => void
}

const canais = [
  { value: undefined, label: 'Todas' },
  { value: 'whatsapp' as const, label: 'WhatsApp', icon: <WhatsAppIcon size={14} className="text-[#25D366]" /> },
  { value: 'instagram' as const, label: 'Instagram', icon: <InstagramIcon size={14} className="text-[#E4405F]" /> },
]

const statuses = [
  { value: undefined, label: 'Todas' },
  { value: 'aberta' as const, label: 'Abertas' },
  { value: 'pendente' as const, label: 'Pendentes' },
  { value: 'fechada' as const, label: 'Fechadas' },
]

export function FiltrosConversas({
  canal,
  status,
  busca,
  arquivadas,
  onCanalChange,
  onStatusChange,
  onBuscaChange,
  onArquivadasChange,
}: FiltrosConversasProps) {
  const [buscaLocal, setBuscaLocal] = useState(busca || '')
  const [statusOpen, setStatusOpen] = useState(false)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  // Debounce busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onBuscaChange(buscaLocal || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaLocal])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (statusOpen && statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
  }, [statusOpen])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        statusBtnRef.current && !statusBtnRef.current.contains(e.target as Node)
      ) {
        setStatusOpen(false)
      }
    }
    if (statusOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [statusOpen])

  const statusLabel = statuses.find(s => s.value === status)?.label || 'Todas'

  return (
    <div className="flex-shrink-0 px-3 py-1.5 space-y-1 border-b border-border/50">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={buscaLocal}
          onChange={(e) => setBuscaLocal(e.target.value)}
          placeholder="Buscar conversas..."
          className="w-full pl-8 pr-8 py-1.5 text-sm bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        {buscaLocal && (
          <button
            onClick={() => setBuscaLocal('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Canal tabs + Status select + Arquivadas — uma única linha, compacta */}
      <div className="flex items-center gap-0.5 overflow-visible flex-wrap">
        {canais.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              onCanalChange(c.value)
              if (arquivadas) onArquivadasChange?.(false)
            }}
            className={`
              flex items-center gap-1 px-2 py-1 text-[11px] rounded-md font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
              ${!arquivadas && canal === c.value
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }
            `}
          >
            {c.icon}
            {c.label}
          </button>
        ))}

        <div className="w-px h-3.5 bg-border mx-0.5 flex-shrink-0" />

        {/* Status — custom select dropdown via Portal */}
        <div className="relative flex-shrink-0">
          <button
            ref={statusBtnRef}
            onClick={() => setStatusOpen(!statusOpen)}
            className={`
              flex items-center gap-0.5 px-2 py-1 text-[11px] rounded-md font-medium transition-all duration-200 whitespace-nowrap
              ${!arquivadas && status
                ? 'bg-primary/10 text-primary'
                : !arquivadas
                  ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }
            `}
          >
            {statusLabel}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} />
          </button>

          {statusOpen && dropdownPos && createPortal(
            <div
              ref={dropdownRef}
              className="fixed bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[110px]"
              style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
            >
              {statuses.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    onStatusChange(s.value)
                    if (arquivadas) onArquivadasChange?.(false)
                    setStatusOpen(false)
                  }}
                  className={`
                    block w-full text-left px-3 py-1.5 text-[11px] transition-colors duration-150
                    ${!arquivadas && status === s.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                    }
                  `}
                >
                  {s.label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        <div className="w-px h-3.5 bg-border mx-0.5 flex-shrink-0" />

        {/* Arquivadas toggle */}
        <button
          onClick={() => onArquivadasChange?.(!arquivadas)}
          className={`
            flex items-center gap-1 px-2 py-1 text-[11px] rounded-md font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
            ${arquivadas
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }
          `}
        >
          <Archive className="w-3 h-3" />
          Arquivadas
        </button>
      </div>
    </div>
  )
}
