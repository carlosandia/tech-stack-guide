/**
 * AIDEV-NOTE: Popover inline para atribuir responsável
 * Usa React Portal para renderizar fora do container com overflow
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, User } from 'lucide-react'
import { useUsuarios } from '@/modules/configuracoes/hooks/useEquipe'
import { useAtualizarContato } from '../hooks/useContatos'

interface InlineResponsavelPopoverProps {
  contatoId: string
  ownerId?: string | null
  children: React.ReactNode
}

export function InlineResponsavelPopover({ contatoId, ownerId, children }: InlineResponsavelPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const atualizar = useAtualizarContato()

  const { data: usuariosData } = useUsuarios({ status: 'ativo' })
  const usuarios = (usuariosData?.usuarios || []) as Array<{ id: string; nome: string; sobrenome?: string | null }>

  const filteredUsuarios = search
    ? usuarios.filter(u =>
        `${u.nome} ${u.sobrenome || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : usuarios

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

  const handleSelect = (userId: string | null) => {
    atualizar.mutate({ id: contatoId, payload: { owner_id: userId } })
    setOpen(false)
    setSearch('')
  }

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
          className="fixed w-56 bg-background rounded-md shadow-lg border border-border py-1"
          style={{ top: pos.top, left: pos.left, zIndex: 600 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-2 pb-1 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar membro..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {ownerId && (
              <button
                onClick={() => handleSelect(null)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remover responsável
              </button>
            )}

            {filteredUsuarios.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelect(u.id)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left ${
                  ownerId === u.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{u.nome} {u.sobrenome || ''}</span>
              </button>
            ))}

            {filteredUsuarios.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum membro encontrado</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
