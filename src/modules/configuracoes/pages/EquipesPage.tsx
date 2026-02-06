/**
 * AIDEV-NOTE: Página de Equipes
 * Conforme PRD-05 - Gestão de Equipes (Admin Only)
 * CRUD de equipes com membros
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Users, Pencil, Search, Crown, UserMinus, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import {
  useEquipes,
  useAdicionarMembro,
  useRemoverMembro,
  useAlterarPapelMembro,
  useUsuarios,
} from '../hooks/useEquipe'
import { EquipeFormModal } from '../components/equipe/EquipeFormModal'
import type { EquipeComMembros } from '../services/configuracoes.api'

export function EquipesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [equipeEditando, setEquipeEditando] = useState<EquipeComMembros | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [addMembroEquipe, setAddMembroEquipe] = useState<string | null>(null)
  const [membroSelecionado, setMembroSelecionado] = useState('')

  const params = busca ? { busca } : undefined
  const { data, isLoading, error } = useEquipes(params)
  const { data: usuariosData } = useUsuarios()
  const adicionarMembro = useAdicionarMembro()
  const removerMembro = useRemoverMembro()
  const alterarPapel = useAlterarPapelMembro()

  useEffect(() => {
    setSubtitle('Organize sua equipe em grupos de trabalho')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setEquipeEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Equipe</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (equipe: EquipeComMembros) => {
    if (!isAdmin) return
    setEquipeEditando(equipe)
    setModalOpen(true)
  }

  const handleAdicionarMembro = async (equipeId: string) => {
    if (!membroSelecionado) return
    try {
      await adicionarMembro.mutateAsync({
        equipeId,
        payload: { usuario_id: membroSelecionado },
      })
      setMembroSelecionado('')
      setAddMembroEquipe(null)
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
    }
  }

  const handleRemoverMembro = async (equipeId: string, usuarioId: string) => {
    if (!confirm('Remover este membro da equipe?')) return
    try {
      await removerMembro.mutateAsync({ equipeId, usuarioId })
    } catch (err) {
      console.error('Erro ao remover membro:', err)
    }
  }

  const handleAlterarPapel = async (equipeId: string, usuarioId: string, papel: 'lider' | 'membro') => {
    try {
      await alterarPapel.mutateAsync({ equipeId, usuarioId, papel })
    } catch (err) {
      console.error('Erro ao alterar papel:', err)
    }
  }

  const equipes = data?.equipes || []
  const todosUsuarios = usuariosData?.usuarios || []

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center justify-end">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="h-8 pl-9 pr-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 w-48"
            placeholder="Buscar equipe..."
          />
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar equipes</p>
        </div>
      ) : equipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma equipe criada</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Equipe&quot; para começar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {equipes.map(equipe => {
            const isExpanded = expandida === equipe.id
            const membros = equipe.membros || []

            return (
              <div key={equipe.id} className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-all duration-200 cursor-pointer"
                  onClick={() => setExpandida(isExpanded ? null : equipe.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: equipe.cor ? `${equipe.cor}20` : undefined }}
                    >
                      {equipe.cor ? (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: equipe.cor }} />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{equipe.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {equipe.total_membros || membros.length} membro{(equipe.total_membros || membros.length) !== 1 ? 's' : ''}
                        </span>
                        {!equipe.ativa && (
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativa</span>
                        )}
                      </div>
                      {equipe.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{equipe.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); handleEdit(equipe) }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                        title="Editar equipe"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Membros expandidos */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30">
                    {membros.length === 0 ? (
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-muted-foreground">Nenhum membro nesta equipe</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {membros.map(membro => (
                          <div key={membro.id} className="flex items-center justify-between px-4 py-2.5 pl-14">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary text-xs font-semibold">
                                {membro.nome?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="text-sm text-foreground truncate">
                                {membro.nome} {membro.sobrenome || ''}
                              </span>
                              {membro.papel === 'lider' && (
                                <Crown className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                              )}
                              <span className="text-xs text-muted-foreground">{membro.email}</span>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleAlterarPapel(
                                    equipe.id,
                                    membro.usuario_id,
                                    membro.papel === 'lider' ? 'membro' : 'lider'
                                  )}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                                  title={membro.papel === 'lider' ? 'Remover líder' : 'Tornar líder'}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoverMembro(equipe.id, membro.usuario_id)}
                                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-all duration-200"
                                  title="Remover da equipe"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar membro */}
                    {isAdmin && (
                      <div className="px-4 py-3 border-t border-border/50">
                        {addMembroEquipe === equipe.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={membroSelecionado}
                              onChange={e => setMembroSelecionado(e.target.value)}
                              className="flex-1 h-8 px-2 rounded-md border border-input bg-background text-foreground text-sm"
                            >
                              <option value="">Selecione um usuário</option>
                              {todosUsuarios
                                .filter(u => !membros.some(m => m.usuario_id === u.id))
                                .map(u => (
                                  <option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''} ({u.email})</option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAdicionarMembro(equipe.id)}
                              disabled={!membroSelecionado || adicionarMembro.isPending}
                              className="px-3 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                            >
                              Adicionar
                            </button>
                            <button
                              onClick={() => { setAddMembroEquipe(null); setMembroSelecionado('') }}
                              className="px-2 h-8 rounded-md border border-input text-xs text-foreground hover:bg-accent transition-all duration-200"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddMembroEquipe(equipe.id)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Adicionar membro
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <EquipeFormModal
          equipe={equipeEditando}
          onClose={() => { setModalOpen(false); setEquipeEditando(null) }}
        />
      )}
    </div>
  )
}
