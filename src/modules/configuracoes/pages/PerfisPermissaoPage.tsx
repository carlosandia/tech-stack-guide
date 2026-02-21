/**
 * AIDEV-NOTE: Página de Perfis de Permissão
 * Conforme PRD-05 - Gestão de Equipe (Admin Only)
 * CRUD de perfis com matriz de permissões
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Shield, Pencil, Lock, Check } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { usePerfis } from '../hooks/useEquipe'
import { PerfilFormModal } from '../components/equipe/PerfilFormModal'
import { modulosDisponiveis, acoesDisponiveis } from '../schemas/equipe.schema'
import type { PerfilPermissao } from '../services/configuracoes.api'

export function PerfisPermissaoPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalOpen, setModalOpen] = useState(false)
  const [perfilEditando, setPerfilEditando] = useState<PerfilPermissao | null>(null)

  const { data, isLoading, error } = usePerfis()

  useEffect(() => {
    setSubtitle('Defina perfis de acesso e permissões por módulo')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setPerfilEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Perfil</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (perfil: PerfilPermissao) => {
    setPerfilEditando(perfil)
    setModalOpen(true)
  }

  const perfis = data?.perfis || []

  const acaoLabels: Record<string, string> = {
    visualizar: 'Ver',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    gerenciar: 'Gerenciar',
  }

  return (
    <div className="space-y-6">
      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar perfis</p>
        </div>
      ) : perfis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum perfil de permissão criado</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Novo Perfil&quot; para começar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {perfis.map(perfil => {
            const permissoesMap: Record<string, string[]> = {}
            if (perfil.permissoes) {
              perfil.permissoes.forEach(p => { permissoesMap[p.modulo] = [...p.acoes] })
            }

            return (
              <div key={perfil.id} className="border border-border rounded-lg overflow-hidden">
                {/* Header do perfil */}
                <div className="flex items-center justify-between px-4 py-3 bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      perfil.is_admin ? 'bg-warning-muted' : 'bg-primary/10'
                    }`}>
                      {perfil.is_sistema ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Shield className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{perfil.nome}</span>
                        {perfil.is_admin && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning-muted text-warning-foreground font-medium">
                            Admin
                          </span>
                        )}
                        {perfil.is_sistema && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Sistema
                          </span>
                        )}
                      </div>
                      {perfil.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{perfil.descricao}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(perfil)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title={perfil.is_sistema ? 'Visualizar' : 'Editar'}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* Matriz resumida */}
                <div className="border-t border-border bg-muted/20">
                  <div className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-4 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50">
                    <span>Módulo</span>
                    {acoesDisponiveis.map(a => (
                      <span key={a} className="text-center">{acaoLabels[a]}</span>
                    ))}
                  </div>
                  {modulosDisponiveis.map(mod => {
                    const modPerms = perfil.is_admin
                      ? [...acoesDisponiveis]
                      : permissoesMap[mod.value] || []
                    return (
                      <div
                        key={mod.value}
                        className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-4 py-1.5 border-b border-border/30 last:border-b-0"
                      >
                        <span className="text-xs text-foreground">{mod.label}</span>
                        {acoesDisponiveis.map(acao => (
                          <div key={acao} className="flex items-center justify-center">
                            {modPerms.includes(acao) ? (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <span className="w-3.5 h-3.5 text-border">–</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <PerfilFormModal
          perfil={perfilEditando}
          onClose={() => { setModalOpen(false); setPerfilEditando(null) }}
        />
      )}
    </div>
  )
}

export default PerfisPermissaoPage
