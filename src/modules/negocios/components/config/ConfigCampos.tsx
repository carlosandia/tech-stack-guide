/**
 * AIDEV-NOTE: Aba Campos da configuração de pipeline
 * Conforme PRD-07 RF-05 - Campos personalizados dos cards
 */

import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, LayoutGrid, Search } from 'lucide-react'
import { useCamposVinculados, useCamposDisponiveis, useVincularCampo, useDesvincularCampo, useAtualizarVinculoCampo } from '../../hooks/usePipelineConfig'

interface Props {
  funilId: string
}

export function ConfigCampos({ funilId }: Props) {
  const { data: vinculados, isLoading } = useCamposVinculados(funilId)
  const { data: disponiveis } = useCamposDisponiveis()
  const vincular = useVincularCampo(funilId)
  const desvincular = useDesvincularCampo(funilId)
  const atualizar = useAtualizarVinculoCampo(funilId)

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroEntidade, setFiltroEntidade] = useState<string>('todos')

  const vinculadosIds = new Set((vinculados || []).map(v => v.campo_id))

  const camposFiltrados = (disponiveis || [])
    .filter(c => !vinculadosIds.has(c.id))
    .filter(c => filtroEntidade === 'todos' || c.entidade === filtroEntidade)
    .filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()))

  const badgeLabel = (campo: { sistema?: boolean | null; obrigatorio?: boolean | null }) => {
    if (campo.sistema) return 'Sistema'
    if (campo.obrigatorio) return 'Obrigatório'
    return 'Personalizado'
  }

  const badgeClass = (campo: { sistema?: boolean | null }) =>
    campo.sistema
      ? 'bg-muted text-muted-foreground'
      : 'bg-primary/10 text-primary'

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando campos...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Campos Personalizados</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie os campos que aparecem nos cards desta pipeline
          </p>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Campos vinculados */}
      <div className="space-y-1.5">
        {(vinculados || []).length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Nenhum campo vinculado. Clique em "Adicionar" para vincular campos.
            </p>
          </div>
        ) : (
          (vinculados || []).map(vinculo => (
            <div
              key={vinculo.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              {/* Ícone entidade */}
              <span className="text-base flex-shrink-0">
                {vinculo.campo?.entidade === 'empresa' ? '🏢' : '👤'}
              </span>

              {/* Nome */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {vinculo.campo?.nome || 'Campo'}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {vinculo.campo?.tipo}
                </span>
              </div>

              {/* Badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${badgeClass(vinculo.campo || {})}`}>
                {badgeLabel(vinculo.campo || {})}
              </span>

              {/* Toggle exibir no card */}
              <button
                onClick={() => atualizar.mutate({
                  vinculoId: vinculo.id,
                  payload: { exibir_card: !vinculo.exibir_card }
                })}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  vinculo.exibir_card
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                title={vinculo.exibir_card ? 'Visível no card' : 'Oculto no card'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>

              {/* Toggle visível */}
              <button
                onClick={() => atualizar.mutate({
                  vinculoId: vinculo.id,
                  payload: { visivel: !vinculo.visivel }
                })}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  vinculo.visivel !== false
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                title={vinculo.visivel !== false ? 'Visível' : 'Oculto'}
              >
                {vinculo.visivel !== false ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Remover */}
              {!vinculo.campo?.sistema && (
                <button
                  onClick={() => desvincular.mutate(vinculo.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-all duration-200"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Painel de adicionar */}
      {showAddPanel && (
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Campos Disponíveis</h4>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar campos..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex gap-1">
              {['todos', 'contato', 'empresa'].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroEntidade(f)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all duration-200 ${
                    filtroEntidade === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'contato' ? '👤 Contato' : '🏢 Empresa'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {camposFiltrados.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum campo disponível
              </p>
            ) : (
              camposFiltrados.map(campo => (
                <button
                  key={campo.id}
                  onClick={() => vincular.mutate({ campoId: campo.id })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-accent text-left transition-all duration-200"
                >
                  <span className="text-base">
                    {campo.entidade === 'empresa' ? '🏢' : '👤'}
                  </span>
                  <span className="text-sm text-foreground flex-1">{campo.nome}</span>
                  <span className="text-xs text-muted-foreground">{campo.tipo}</span>
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
