/**
 * AIDEV-NOTE: Popover inline para vincular pessoas a uma empresa
 * Usa React Portal para renderizar fora do container com overflow
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, User, Plus, X } from 'lucide-react'
import { useContatos, useAtualizarContato } from '../hooks/useContatos'

interface InlinePessoaPopoverProps {
  empresaId: string
  pessoasVinculadas?: Array<{ id: string; nome: string; sobrenome?: string }>
  children: React.ReactNode
}

export function InlinePessoaPopover({ empresaId, pessoasVinculadas = [], children }: InlinePessoaPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const atualizar = useAtualizarContato()

  const { data: pessoasData } = useContatos({ tipo: 'pessoa', limit: 100, busca: search || undefined })
  const todasPessoas = pessoasData?.contatos || []

  const pessoasDisponiveis = todasPessoas.filter(p =>
    !p.empresa_id || p.empresa_id === empresaId
  )

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }

    function handleScroll() { updatePosition() }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  const handleVincular = (pessoaId: string) => {
    atualizar.mutate({ id: pessoaId, payload: { empresa_id: empresaId } })
  }

  const handleDesvincular = (pessoaId: string) => {
    atualizar.mutate({ id: pessoaId, payload: { empresa_id: null } })
  }

  const vinculadosIds = new Set(pessoasVinculadas.map(p => p.id))

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
      >
        {children}
      </div>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed w-72 bg-background rounded-md shadow-lg border border-border py-1"
          style={{ top: pos.top, left: pos.left, zIndex: 600 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Vinculadas */}
          {pessoasVinculadas.length > 0 && (
            <div className="px-3 py-1.5 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pessoas vinculadas</p>
              {pessoasVinculadas.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-foreground truncate">{p.nome} {p.sobrenome || ''}</span>
                  <button
                    onClick={() => handleDesvincular(p.id)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    title="Desvincular"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Buscar para vincular */}
          <div className="px-2 pb-1 pt-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar pessoa para vincular..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[180px] overflow-y-auto">
            {pessoasDisponiveis.filter(p => !vinculadosIds.has(p.id)).map(p => (
              <button
                key={p.id}
                onClick={() => handleVincular(p.id)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <User className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground">{p.nome} {p.sobrenome || ''}</span>
                <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              </button>
            ))}

            {pessoasDisponiveis.filter(p => !vinculadosIds.has(p.id)).length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {search ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já estão vinculadas'}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
