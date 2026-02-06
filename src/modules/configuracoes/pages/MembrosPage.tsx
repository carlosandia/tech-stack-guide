/**
 * AIDEV-NOTE: Página de Membros da Equipe
 * Conforme PRD-05 - Gestão de Equipe (Admin Only)
 * Listagem de usuários do tenant com convite, edição e status
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, UserPlus, Pencil, Search, MoreHorizontal, Mail, UserX, UserCheck } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useUsuarios, useAlterarStatusUsuario, useReenviarConvite } from '../hooks/useEquipe'
import { MembroFormModal } from '../components/equipe/MembroFormModal'
import { statusUsuarioOptions } from '../schemas/equipe.schema'
import type { UsuarioTenant } from '../services/configuracoes.api'

export function MembrosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioTenant | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  const params: Record<string, string> = {}
  if (busca) params.busca = busca
  if (filtroStatus !== 'todos') params.status = filtroStatus

  const { data, isLoading, error } = useUsuarios(Object.keys(params).length > 0 ? params : undefined)
  const alterarStatus = useAlterarStatusUsuario()
  const reenviarConvite = useReenviarConvite()

  useEffect(() => {
    setSubtitle('Gerencie os membros e convites da sua equipe')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setUsuarioEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Convidar</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (usuario: UsuarioTenant) => {
    if (!isAdmin) return
    setUsuarioEditando(usuario)
    setModalOpen(true)
  }

  const handleAlterarStatus = async (id: string, status: string) => {
    setMenuAberto(null)
    try {
      await alterarStatus.mutateAsync({ id, payload: { status } })
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  const handleReenviarConvite = async (id: string) => {
    setMenuAberto(null)
    try {
      await reenviarConvite.mutateAsync(id)
    } catch (err) {
      console.error('Erro ao reenviar convite:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const opt = statusUsuarioOptions.find(s => s.value === status)
    if (!opt) return null
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: `${opt.color}15`, color: opt.color }}
      >
        {opt.label}
      </span>
    )
  }

  const usuarios = data?.usuarios || []

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 border-b border-border">
          {[{ value: 'todos', label: 'Todos' }, ...statusUsuarioOptions].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFiltroStatus(opt.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                filtroStatus === opt.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="h-8 pl-9 pr-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 w-48"
            placeholder="Buscar por nome ou email..."
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
          <p className="text-sm text-destructive">Erro ao carregar membros</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Verifique sua conexão'}
          </p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Convidar&quot; para adicionar membros
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {usuarios.map(usuario => (
            <div
              key={usuario.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary text-sm font-semibold">
                  {usuario.nome?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {usuario.nome} {usuario.sobrenome || ''}
                    </span>
                    {getStatusBadge(usuario.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{usuario.email}</span>
                    {usuario.papel_nome && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{usuario.papel_nome}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0 relative">
                  <button
                    onClick={() => handleEdit(usuario)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMenuAberto(menuAberto === usuario.id ? null : usuario.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Mais ações"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {/* Dropdown de ações */}
                  {menuAberto === usuario.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-md z-10 py-1">
                      {usuario.status === 'pendente' && (
                        <button
                          onClick={() => handleReenviarConvite(usuario.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Reenviar Convite
                        </button>
                      )}
                      {usuario.status !== 'ativo' && usuario.status !== 'pendente' && (
                        <button
                          onClick={() => handleAlterarStatus(usuario.id, 'ativo')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          Ativar
                        </button>
                      )}
                      {usuario.status === 'ativo' && (
                        <>
                          <button
                            onClick={() => handleAlterarStatus(usuario.id, 'inativo')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                            Desativar
                          </button>
                          <button
                            onClick={() => handleAlterarStatus(usuario.id, 'suspenso')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                            Suspender
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.total_paginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="text-xs text-muted-foreground">
            Página {data.page} de {data.total_paginas} · {data.total} membros
          </span>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <MembroFormModal
          usuario={usuarioEditando}
          onClose={() => { setModalOpen(false); setUsuarioEditando(null) }}
        />
      )}
    </div>
  )
}
