/**
 * AIDEV-NOTE: Lista de emails com sidebar de pastas e filtros
 * Painel esquerdo do layout split-view
 */

import { useState, useCallback } from 'react'
import {
  Inbox,
  Send,
  FileEdit,
  Archive,
  Trash2,
  Search,
  RefreshCw,
  CheckSquare,
  Mail,
  MailOpen,
  Star,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmailItem } from './EmailItem'
import type { EmailRecebido, PastaEmail, AcaoLote } from '../types/email.types'

interface EmailListProps {
  emails: EmailRecebido[]
  total: number
  isLoading: boolean
  pasta: PastaEmail
  setPasta: (pasta: PastaEmail) => void
  busca: string
  setBusca: (busca: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleFavorito: (id: string, favorito: boolean) => void
  onAcaoLote: (acao: AcaoLote, ids: string[]) => void
  onRefresh: () => void
  naoLidosInbox: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const pastas = [
  { id: 'inbox' as PastaEmail, label: 'Caixa de Entrada', icon: Inbox },
  { id: 'sent' as PastaEmail, label: 'Enviados', icon: Send },
  { id: 'drafts' as PastaEmail, label: 'Rascunhos', icon: FileEdit },
  { id: 'archived' as PastaEmail, label: 'Arquivados', icon: Archive },
  { id: 'trash' as PastaEmail, label: 'Lixeira', icon: Trash2 },
]

export function EmailList({
  emails,
  total,
  isLoading,
  pasta,
  setPasta,
  busca,
  setBusca,
  selectedId,
  onSelect,
  onToggleFavorito,
  onAcaoLote,
  onRefresh,
  naoLidosInbox,
  page,
  totalPages,
  onPageChange,
}: EmailListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [buscaAberta, setBuscaAberta] = useState(!!busca)

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (checkedIds.size === emails.length) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(emails.map((e) => e.id)))
    }
  }, [checkedIds.size, emails])

  const executarAcao = useCallback(
    (acao: AcaoLote) => {
      if (checkedIds.size === 0) return
      onAcaoLote(acao, Array.from(checkedIds))
      setCheckedIds(new Set())
    },
    [checkedIds, onAcaoLote]
  )

  const hasChecked = checkedIds.size > 0

  const iconBtnClass = 'p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground'

  return (
    <div className="flex flex-col h-full border-r border-border/60">
      {/* Pastas */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/60 overflow-x-auto">
        {pastas.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPasta(p.id)
              setCheckedIds(new Set())
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              pasta === p.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <p.icon className="w-3.5 h-3.5" />
            {p.label}
            {p.id === 'inbox' && naoLidosInbox > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {naoLidosInbox > 99 ? '99+' : naoLidosInbox}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar: Busca + Ações */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/60">
        {hasChecked ? (
          // Modo seleção
          <>
            <button onClick={toggleAll} className={cn(iconBtnClass, 'text-xs flex items-center gap-1')}>
              <CheckSquare className="w-3.5 h-3.5" />
              {checkedIds.size}/{emails.length}
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button onClick={() => executarAcao('marcar_lido')} className={iconBtnClass} title="Marcar como lido">
              <MailOpen className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => executarAcao('marcar_nao_lido')} className={iconBtnClass} title="Marcar como não lido">
              <Mail className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => executarAcao('arquivar')} className={iconBtnClass} title="Arquivar">
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => executarAcao('favoritar')} className={iconBtnClass} title="Favoritar">
              <Star className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => executarAcao('mover_lixeira')} className={cn(iconBtnClass, 'text-destructive hover:text-destructive')} title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button onClick={() => setCheckedIds(new Set())} className={iconBtnClass}>
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          // Modo normal
          <>
            {buscaAberta ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  placeholder="Buscar emails..."
                  value={busca}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                  className="flex-1 h-7 px-2 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setBuscaAberta(false)
                    setBusca('')
                  }}
                  className={iconBtnClass}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={toggleAll} className={iconBtnClass}>
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setBuscaAberta(true)} className={iconBtnClass}>
                  <Search className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1" />
                <button onClick={onRefresh} className={iconBtnClass} disabled={isLoading}>
                  <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Lista de emails */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && emails.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Inbox className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhum email encontrado</p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              isSelected={selectedId === email.id}
              isChecked={checkedIds.has(email.id)}
              onSelect={onSelect}
              onToggleCheck={toggleCheck}
              onToggleFavorito={onToggleFavorito}
            />
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/60 text-xs text-muted-foreground">
          <span>{total} emails</span>
          <div className="flex items-center gap-1">
            <button
              className="h-6 px-2 rounded text-xs hover:bg-accent disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              ←
            </button>
            <span>
              {page}/{totalPages}
            </span>
            <button
              className="h-6 px-2 rounded text-xs hover:bg-accent disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
