/**
 * AIDEV-NOTE: Lista de emails estilo Gmail - toolbar com busca + lista de items single-line
 * Sem tabs de pasta (movidas para EmailSidebar)
 */

import { useState, useCallback, useEffect, forwardRef } from 'react'
import {
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  Mail,
  MailOpen,
  Archive,
  Star,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmailItem } from './EmailItem'
import { EmailFilters, type EmailFiltros } from './EmailFilters'
import type { EmailRecebido, AcaoLote } from '../types/email.types'

interface EmailListProps {
  emails: EmailRecebido[]
  total: number
  isLoading: boolean
  busca: string
  setBusca: (busca: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleFavorito: (id: string, favorito: boolean) => void
  onAcaoLote: (acao: AcaoLote, ids: string[]) => void
  onRefresh: () => void
  isSyncing?: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  filtros: EmailFiltros
  setFiltros: (filtros: EmailFiltros) => void
  onCompose?: () => void
}

export const EmailList = forwardRef<HTMLDivElement, EmailListProps>(function EmailList({
  emails,
  total,
  isLoading,
  busca,
  setBusca,
  selectedId,
  onSelect,
  onToggleFavorito,
  onAcaoLote,
  onRefresh,
  isSyncing,
  page,
  totalPages,
  onPageChange,
  filtros,
  setFiltros,
  onCompose,
}, _ref) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [buscaLocal, setBuscaLocal] = useState(busca)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setBusca(buscaLocal), 300)
    return () => clearTimeout(t)
  }, [buscaLocal, setBusca])

  useEffect(() => {
    setBuscaLocal(busca)
  }, [busca])

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
  const hasFilters = Object.keys(filtros).length > 0
  const perPage = 20
  const startItem = total > 0 ? (page - 1) * perPage + 1 : 0
  const endItem = Math.min(page * perPage, total)

  const iconBtnClass =
    'p-1.5 rounded-md hover:bg-accent/60 transition-colors text-muted-foreground hover:text-foreground'

  return (
    <div className="flex flex-col h-full border-r border-border/40">
      {/* Gmail-style search bar */}
      <div className="px-2 py-2 flex-shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar emails"
            value={buscaLocal}
            onChange={(e) => setBuscaLocal(e.target.value)}
            className="
              w-full h-10 pl-10 pr-10 rounded-lg
              bg-muted/50 border-0
              text-sm text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background
              transition-colors
            "
          />
          {buscaLocal && (
            <button
              onClick={() => { setBuscaLocal(''); setBusca('') }}
              className="absolute right-9 p-0.5 rounded-full hover:bg-accent text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'absolute right-2 p-1 rounded-md transition-colors',
              hasFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter chips (collapsible) */}
      {filtersOpen && (
        <EmailFilters filtros={filtros} onChange={setFiltros} />
      )}

      {/* Toolbar: checkbox + actions + pagination */}
      <div className="flex flex-wrap items-center gap-0.5 px-1 py-0.5 border-b border-border/40 flex-shrink-0">
        {/* Left side - checkbox and actions */}
        <div className="flex items-center gap-0.5">
          <button onClick={toggleAll} className={iconBtnClass} title="Selecionar todos">
            {hasChecked && checkedIds.size === emails.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {hasChecked ? (
            <>
              <div className="w-px h-4 bg-border/60 mx-0.5" />
              <button onClick={() => executarAcao('marcar_lido')} className={iconBtnClass} title="Marcar como lido">
                <MailOpen className="w-4 h-4" />
              </button>
              <button onClick={() => executarAcao('marcar_nao_lido')} className={iconBtnClass} title="Marcar como não lido">
                <Mail className="w-4 h-4" />
              </button>
              <button onClick={() => executarAcao('arquivar')} className={iconBtnClass} title="Arquivar">
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={() => executarAcao('favoritar')} className={iconBtnClass} title="Favoritar">
                <Star className="w-4 h-4" />
              </button>
              <button
                onClick={() => executarAcao('mover_lixeira')}
                className={cn(iconBtnClass, 'text-destructive hover:text-destructive')}
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">{checkedIds.size} sel.</span>
            </>
          ) : (
            <>
              <button onClick={onRefresh} className={iconBtnClass} disabled={isLoading || isSyncing} title="Sincronizar">
                <RefreshCw className={cn('w-4 h-4', (isLoading || isSyncing) && 'animate-spin')} />
              </button>
              {/* Botão Escrever - visível apenas no mobile (sidebar oculta) */}
              {onCompose && (
                <button
                  onClick={onCompose}
                  className="lg:hidden inline-flex items-center gap-1 ml-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  title="Escrever email"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Escrever</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right side - pagination */}
        <div className="flex-1" />
        {total > 0 && (
          <div className="flex items-center gap-0.5">
            <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">
              {startItem}–{endItem} de {total}
            </span>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={cn(iconBtnClass, 'disabled:opacity-30')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className={cn(iconBtnClass, 'disabled:opacity-30')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && emails.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Inbox className="w-16 h-16 mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum email</p>
            <p className="text-xs mt-1 opacity-60">Esta pasta está vazia</p>
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
    </div>
  )
})
EmailList.displayName = 'EmailList'
