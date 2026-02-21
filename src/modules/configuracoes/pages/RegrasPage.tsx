/**
 * AIDEV-NOTE: Página de Regras de Qualificação (MQL)
 * Conforme PRD-05 - Regras de Qualificação
 * Regras avaliadas em AND para marcar contato como MQL
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Pencil, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useRegras, useAtualizarRegra } from '../hooks/useRegras'
import { useTodosCampos } from '../hooks/useCampos'
import { RegraFormModal } from '../components/regras/RegraFormModal'
import { operadorOptions } from '../schemas/regras.schema'
import type { RegraQualificacao } from '../services/configuracoes.api'

export function RegrasPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalAberto, setModalAberto] = useState(false)
  const [regraEditando, setRegraEditando] = useState<RegraQualificacao | null>(null)

  const { data, isLoading, error } = useRegras()
  const atualizarRegra = useAtualizarRegra()
  const { mapaCampos } = useTodosCampos()

  useEffect(() => {
    setSubtitle('Quando TODAS as regras forem verdadeiras, o contato será marcado como MQL')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setRegraEditando(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Regra</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (regra: RegraQualificacao) => {
    if (!isAdmin) return
    setRegraEditando(regra)
    setModalAberto(true)
  }

  const handleToggleAtivo = async (regra: RegraQualificacao) => {
    if (!isAdmin) return
    try {
      await atualizarRegra.mutateAsync({
        id: regra.id,
        payload: { ativo: !regra.ativo },
      })
    } catch { /* tratado pelo React Query */ }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">Erro ao carregar regras</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Verifique sua conexão'}
        </p>
      </div>
    )
  }

  const regras = data?.regras || []

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Lógica de qualificação</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Todas as regras ativas são avaliadas em <strong>AND</strong>. O contato só será qualificado como MQL quando
            todas forem verdadeiras simultaneamente.
          </p>
        </div>
      </div>

      {regras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma regra de qualificação criada</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Regra&quot; para começar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {regras.map(regra => {
            const operador = operadorOptions.find(o => o.value === regra.operador)

            return (
              <div
                key={regra.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
                  !regra.ativo ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Toggle ativo */}
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleAtivo(regra)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-all duration-200"
                      title={regra.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {regra.ativo ? (
                        <ToggleRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">{regra.nome}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {regra.campo_id && mapaCampos.has(regra.campo_id) && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {mapaCampos.get(regra.campo_id)!.entidadeLabel} › {mapaCampos.get(regra.campo_id)!.nome}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {operador?.label || regra.operador}
                      </span>
                      {regra.valor && (
                        <span className="text-xs text-muted-foreground font-medium">
                          &quot;{regra.valor}&quot;
                        </span>
                      )}
                      {regra.valores && regra.valores.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          [{regra.valores.join(', ')}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleEdit(regra)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar regra"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <RegraFormModal
          regra={regraEditando}
          onClose={() => { setModalAberto(false); setRegraEditando(null) }}
        />
      )}
    </div>
  )
}

export default RegrasPage
