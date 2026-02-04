import { useState, useEffect } from 'react'
import { X, Puzzle, Loader2, GripVertical } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type Modulo } from '../services/admin.api'
import { useModulosOrganizacao } from '../hooks/useOrganizacoes'

/**
 * AIDEV-NOTE: Modal para Gerenciar Módulos de uma Organização
 * Conforme PRD-14 - RF-003
 */

interface Props {
  orgId: string
  orgNome: string
  onClose: () => void
}

export function GerenciarModulosModal({ orgId, orgNome, onClose }: Props) {
  const queryClient = useQueryClient()
  const { data: modulosOrg, isLoading } = useModulosOrganizacao(orgId)
  const [modulosState, setModulosState] = useState<Array<{ id: string; ativo: boolean; ordem: number }>>([])

  useEffect(() => {
    if (modulosOrg) {
      setModulosState(
        modulosOrg.map((m: Modulo, index: number) => ({
          id: m.id,
          ativo: m.ativo ?? false,
          ordem: m.ordem ?? index,
        }))
      )
    }
  }, [modulosOrg])

  const updateMutation = useMutation({
    mutationFn: (modulos: Array<{ modulo_id: string; ativo: boolean; ordem?: number }>) =>
      adminApi.atualizarModulosOrganizacao(orgId, modulos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacao', orgId, 'modulos'] })
      onClose()
    },
  })

  const handleToggle = (moduloId: string) => {
    const modulo = modulosOrg?.find((m: Modulo) => m.id === moduloId)
    if (modulo?.obrigatorio) return // Não permite desativar módulos obrigatórios

    setModulosState((prev) =>
      prev.map((m) =>
        m.id === moduloId ? { ...m, ativo: !m.ativo } : m
      )
    )
  }

  const handleSave = () => {
    updateMutation.mutate(
      modulosState.map((m) => ({
        modulo_id: m.id,
        ativo: m.ativo,
        ordem: m.ordem,
      }))
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gerenciar Módulos</h2>
              <p className="text-sm text-muted-foreground">{orgNome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {modulosOrg?.map((modulo: Modulo) => {
                const state = modulosState.find((m) => m.id === modulo.id)
                const isActive = state?.ativo ?? modulo.ativo ?? false

                return (
                  <div
                    key={modulo.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-card border-border'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{modulo.nome}</span>
                        {modulo.obrigatorio && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{modulo.descricao}</p>
                    </div>

                    <button
                      onClick={() => handleToggle(modulo.id)}
                      disabled={modulo.obrigatorio}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-primary' : 'bg-muted'
                      } ${modulo.obrigatorio ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}

              {(!modulosOrg || modulosOrg.length === 0) && (
                <div className="text-center py-8">
                  <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum módulo disponível</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
}
