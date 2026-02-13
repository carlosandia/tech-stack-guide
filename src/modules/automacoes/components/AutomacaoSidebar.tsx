/**
 * AIDEV-NOTE: Painel lateral com lista de automações existentes
 * Inclui busca, toggle ativo/inativo, edição inline do nome, e botão excluir
 */

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Zap, Loader2, Trash2, X } from 'lucide-react'
import type { Automacao } from '../schemas/automacoes.schema'

interface AutomacaoSidebarProps {
  automacoes: Automacao[]
  isLoading: boolean
  selectedId?: string
  onSelect: (id: string) => void
  onNew: () => void
  onToggle: (id: string, ativo: boolean) => void
  onRename: (id: string, nome: string) => void
  onDelete: (id: string) => void
  isAdmin: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AutomacaoSidebar({
  automacoes,
  isLoading,
  selectedId,
  onSelect,
  onNew,
  onToggle,
  onRename,
  onDelete,
  isAdmin,
  mobileOpen,
  onMobileClose,
}: AutomacaoSidebarProps) {
  const [busca, setBusca] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtradas = automacoes.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleStartEdit = (e: React.MouseEvent, a: Automacao) => {
    e.stopPropagation()
    setEditingId(a.id)
    setEditValue(a.nome)
  }

  const handleFinishEdit = (id: string) => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== automacoes.find(a => a.id === id)?.nome) {
      onRename(id, trimmed)
    }
    setEditingId(null)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir esta automação?')) {
      onDelete(id)
    }
  }

  const handleItemSelect = (id: string) => {
    onSelect(id)
    onMobileClose?.()
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Automações</span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={onNew}
                className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Nova Automação"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Botão fechar no mobile */}
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-md hover:bg-accent transition-colors sm:hidden"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {automacoes.length === 0 ? 'Nenhuma automação' : 'Nenhum resultado'}
            </p>
          </div>
        ) : (
          filtradas.map(a => (
            // AIDEV-NOTE: Usar div em vez de button para evitar button aninhado (DOM nesting)
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => handleItemSelect(a.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleItemSelect(a.id) }}
              className={`
                w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-200 group cursor-pointer
                ${selectedId === a.id
                  ? 'bg-primary/5 border border-primary/40 text-primary'
                  : 'border border-transparent hover:bg-accent text-foreground'
                }
              `}
            >
              <div className="flex items-center justify-between">
                {editingId === a.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleFinishEdit(a.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleFinishEdit(a.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="font-medium truncate flex-1 bg-white border border-primary rounded px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <span
                    className="font-medium truncate flex-1 cursor-text hover:underline decoration-dotted underline-offset-2"
                    onClick={e => handleStartEdit(e, a)}
                    title="Clique para renomear"
                  >
                    {a.nome}
                  </span>
                )}
                <div className="flex items-center gap-1 ml-1">
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteClick(e, a.id)}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(a.id, !a.ativo) }}
                    className={`
                      w-8 h-4 rounded-full relative transition-colors flex-shrink-0
                      ${a.ativo ? 'bg-green-500' : 'bg-muted-foreground/30'}
                    `}
                    title={a.ativo ? 'Desativar' : 'Ativar'}
                  >
                    <div className={`
                      absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform
                      ${a.ativo ? 'left-4' : 'left-0.5'}
                    `} />
                  </button>
                </div>
              </div>
              {a.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.descricao}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${a.ativo ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {a.ativo ? 'Ativa' : 'Inativa'}
                </span>
                <span className="text-[10px] text-muted-foreground">{a.total_execucoes} exec.</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-60 flex-shrink-0 bg-white border-r border-border flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[300] sm:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-[301] flex flex-col sm:hidden shadow-xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
