/**
 * AIDEV-NOTE: Página de gestão de Origens (canais de aquisição)
 * CRUD simples seguindo padrão MotivosPage
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Globe, Pencil, Lock, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useOrigens, useCriarOrigem, useAtualizarOrigem, useExcluirOrigem } from '../hooks/useOrigens'
import type { Origem } from '../services/origens.api'

export function OrigensPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Origem | null>(null)
  const [nome, setNome] = useState('')

  const { data: origens, isLoading, error } = useOrigens()
  const criarOrigem = useCriarOrigem()
  const atualizarOrigem = useAtualizarOrigem()
  const excluirOrigem = useExcluirOrigem()

  useEffect(() => {
    setSubtitle('Gerencie os canais de aquisição disponíveis para contatos e oportunidades')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setEditando(null); setNome(''); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Origem</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleSave = async () => {
    if (!nome.trim()) return
    if (editando) {
      atualizarOrigem.mutate(
        { id: editando.id, payload: { nome: nome.trim() } },
        { onSuccess: () => setModalOpen(false) }
      )
    } else {
      criarOrigem.mutate(
        { nome: nome.trim() },
        { onSuccess: () => setModalOpen(false) }
      )
    }
  }

  const handleToggleAtivo = (origem: Origem) => {
    atualizarOrigem.mutate({ id: origem.id, payload: { ativo: !origem.ativo } })
  }

  const handleDelete = (origem: Origem) => {
    if (confirm(`Excluir a origem "${origem.nome}"?`)) {
      excluirOrigem.mutate(origem.id)
    }
  }

  const padrao = (origens || []).filter(o => o.padrao_sistema)
  const custom = (origens || []).filter(o => !o.padrao_sistema)

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar origens</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Padrão */}
          {padrao.map(origem => (
            <div
              key={origem.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg bg-muted/30 border border-border/50 ${!origem.ativo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{origem.nome}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                  {origem.slug}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Padrão
                </span>
                {isAdmin && (
                  <button
                    onClick={() => { setEditando(origem); setNome(origem.nome); setModalOpen(true) }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {padrao.length > 0 && custom.length > 0 && (
            <div className="border-t border-border my-3" />
          )}

          {/* Custom */}
          {custom.map(origem => (
            <div
              key={origem.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${!origem.ativo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{origem.nome}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                  {origem.slug}
                </span>
                {!origem.ativo && (
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAtivo(origem)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title={origem.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {origem.ativo ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditando(origem); setNome(origem.nome); setModalOpen(true) }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(origem)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {origens?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Globe className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma origem cadastrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal simples de criação/edição */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] max-w-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {editando ? 'Editar Origem' : 'Nova Origem'}
              </h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Google Ads"
                  autoFocus
                  className="w-full h-10 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 h-9 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!nome.trim() || criarOrigem.isPending || atualizarOrigem.isPending}
                  className="px-4 h-9 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                >
                  {criarOrigem.isPending || atualizarOrigem.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OrigensPage
