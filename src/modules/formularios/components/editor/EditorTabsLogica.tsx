/**
 * AIDEV-NOTE: Tab de Lógica Condicional do editor de formulários
 */

import { useState, useCallback } from 'react'
import { Plus, Zap, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRegrasCondicionais, useCriarRegra, useAtualizarRegra, useExcluirRegra } from '../../hooks/useFormularioRegras'
import { useCamposFormulario } from '../../hooks/useFormularioCampos'
import { RegraCondicionalItem } from '../logica/RegraCondicionalItem'
import { RegraCondicionalForm } from '../logica/RegraCondicionalForm'
import type { Formulario, RegraCondicional } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsLogica({ formulario }: Props) {
  const { data: regras = [], isLoading } = useRegrasCondicionais(formulario.id)
  const { data: campos = [] } = useCamposFormulario(formulario.id)
  const criarRegra = useCriarRegra(formulario.id)
  const atualizarRegra = useAtualizarRegra(formulario.id)
  const excluirRegra = useExcluirRegra(formulario.id)

  const [showForm, setShowForm] = useState(false)
  const [editingRegra, setEditingRegra] = useState<RegraCondicional | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSave = useCallback(
    (payload: Partial<RegraCondicional>) => {
      if (editingRegra) {
        atualizarRegra.mutate({ regraId: editingRegra.id, payload }, {
          onSuccess: () => { setEditingRegra(null); setShowForm(false) },
        })
      } else {
        criarRegra.mutate({ ...payload, ordem_regra: regras.length }, {
          onSuccess: () => setShowForm(false),
        })
      }
    },
    [editingRegra, atualizarRegra, criarRegra, regras.length]
  )

  const handleToggle = useCallback(
    (regraId: string, ativa: boolean) => {
      atualizarRegra.mutate({ regraId, payload: { ativa } })
    },
    [atualizarRegra]
  )

  const handleEdit = useCallback((regra: RegraCondicional) => {
    setEditingRegra(regra)
    setShowForm(true)
  }, [])

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditingRegra(null)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Lógica Condicional</h2>
        </div>
        {!showForm && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            Nova regra
          </Button>
        )}
      </div>

      <div className="border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Controle dinâmico do formulário</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Crie regras para mostrar, ocultar ou pular campos/etapas com base nas respostas do usuário.
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
              Ex: "Se Tipo = Empresa, mostrar CNPJ" · "Se cidade = SP, pular etapa de endereço"
            </p>
          </div>
        </div>
      </div>

      {campos.length === 0 && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">Adicione campos ao formulário antes de criar regras condicionais.</p>
        </div>
      )}

      {showForm && campos.length > 0 && (
        <RegraCondicionalForm
          campos={campos}
          regra={editingRegra}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {regras.length > 0 && (
        <div className="space-y-2">
          {regras.map((regra) => (
            <RegraCondicionalItem
              key={regra.id}
              regra={regra}
              campos={campos}
              expanded={expandedId === regra.id}
              onToggleExpand={() => setExpandedId(expandedId === regra.id ? null : regra.id)}
              onToggle={handleToggle}
              onDelete={(id) => excluirRegra.mutate(id)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {regras.length === 0 && !showForm && campos.length > 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Zap className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma regra condicional criada</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Nova regra" para começar</p>
        </div>
      )}
    </div>
  )
}
