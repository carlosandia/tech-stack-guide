/**
 * AIDEV-NOTE: Aba Campos da configuração de pipeline
 * Conforme PRD-07 RF-05 - Campos personalizados dos cards
 * Modal para adicionar/remover campos com toggle checkbox
 */

import { useState, useEffect, useRef, useId } from 'react'
import { Plus, Trash2, Eye, EyeOff, LayoutGrid, Search, User, Building2, Briefcase, X, Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useCamposVinculados, useCamposDisponiveis, useVincularCampo, useDesvincularCampo, useAtualizarVinculoCampo } from '../../hooks/usePipelineConfig'

interface Props {
  funilId: string
}

// AIDEV-NOTE: Ícone da entidade reutilizável
function EntidadeIcon({ entidade, className = 'w-4 h-4' }: { entidade?: string; className?: string }) {
  if (entidade === 'empresa') return <Building2 className={className} />
  if (entidade === 'oportunidade') return <Briefcase className={className} />
  return <User className={className} />
}

export function ConfigCampos({ funilId }: Props) {
  const { data: vinculados, isLoading } = useCamposVinculados(funilId)
  const { data: disponiveis } = useCamposDisponiveis()
  const vincular = useVincularCampo(funilId)
  const desvincular = useDesvincularCampo(funilId)
  const atualizar = useAtualizarVinculoCampo(funilId)

  const [showModal, setShowModal] = useState(false)

  const vinculadosIds = new Set((vinculados || []).map(v => v.campo_id))

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
          onClick={() => setShowModal(true)}
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
              <span className="flex-shrink-0 text-muted-foreground">
                <EntidadeIcon entidade={vinculo.campo?.entidade} />
              </span>

              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {vinculo.campo?.nome || 'Campo'}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {vinculo.campo?.tipo}
                </span>
              </div>

              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${badgeClass(vinculo.campo || {})}`}>
                {badgeLabel(vinculo.campo || {})}
              </span>

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

      {/* Modal de gerenciar campos */}
      {showModal && (
        <GerenciarCamposModal
          disponiveis={disponiveis || []}
          vinculadosIds={vinculadosIds}
          vinculados={vinculados || []}
          onVincular={(campoId) => vincular.mutate({ campoId })}
          onDesvincular={(vinculoId) => desvincular.mutate(vinculoId)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// =====================================================
// Modal de gerenciar campos
// =====================================================

interface GerenciarCamposModalProps {
  disponiveis: Array<{ id: string; nome: string; tipo: string; entidade: string; sistema?: boolean | null }>
  vinculadosIds: Set<string>
  vinculados: Array<{ id: string; campo_id: string }>
  onVincular: (campoId: string) => void
  onDesvincular: (vinculoId: string) => void
  onClose: () => void
}

function GerenciarCamposModal({ disponiveis, vinculadosIds, vinculados, onVincular, onDesvincular, onClose }: GerenciarCamposModalProps) {
  const [busca, setBusca] = useState('')
  const [filtroEntidade, setFiltroEntidade] = useState<string>('todos')
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // ESC to close + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [onClose])

  const camposFiltrados = disponiveis
    .filter(c => filtroEntidade === 'todos' || c.entidade === filtroEntidade)
    .filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()))

  const handleToggle = (campo: { id: string }) => {
    if (vinculadosIds.has(campo.id)) {
      const vinculo = vinculados.find(v => v.campo_id === campo.id)
      if (vinculo) onDesvincular(vinculo.id)
    } else {
      onVincular(campo.id)
    }
  }

  const entidadeLabel: Record<string, string> = {
    pessoa: 'Pessoa',
    empresa: 'Empresa',
    oportunidade: 'Oportunidade',
  }

  // Agrupar por entidade
  const grupos = camposFiltrados.reduce<Record<string, typeof camposFiltrados>>((acc, c) => {
    const key = c.entidade
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const ordemEntidade = ['pessoa', 'empresa', 'oportunidade']
  const gruposOrdenados = ordemEntidade.filter(e => grupos[e]?.length > 0)

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg flex flex-col w-[calc(100%-16px)] sm:w-[calc(100%-32px)] sm:max-w-lg max-h-[calc(100dvh-16px)] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-foreground">Gerenciar Campos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selecione os campos para vincular à pipeline
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-md transition-all duration-200"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Busca + filtros */}
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar campos..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
              <div className="flex gap-1">
                {['todos', 'pessoa', 'empresa', 'oportunidade'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroEntidade(f)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all duration-200 ${
                      filtroEntidade === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {f !== 'todos' && <EntidadeIcon entidade={f} className="w-3 h-3" />}
                    {f === 'todos' ? 'Todos' : entidadeLabel[f]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de campos */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            {camposFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum campo encontrado</p>
              </div>
            ) : (
              filtroEntidade === 'todos' ? (
                // Agrupado por entidade
                gruposOrdenados.map(entidade => (
                  <div key={entidade}>
                    <div className="px-5 py-2 bg-muted/50 border-b border-border sticky top-0">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <EntidadeIcon entidade={entidade} className="w-3 h-3" />
                        {entidadeLabel[entidade]}
                        <span className="font-normal">({grupos[entidade].length})</span>
                      </span>
                    </div>
                    {grupos[entidade].map(campo => (
                      <CampoRow
                        key={campo.id}
                        campo={campo}
                        isActive={vinculadosIds.has(campo.id)}
                        onToggle={() => handleToggle(campo)}
                      />
                    ))}
                  </div>
                ))
              ) : (
                // Lista plana
                camposFiltrados.map(campo => (
                  <CampoRow
                    key={campo.id}
                    campo={campo}
                    isActive={vinculadosIds.has(campo.id)}
                    onToggle={() => handleToggle(campo)}
                  />
                ))
              )
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-border bg-card rounded-b-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {vinculadosIds.size} campo{vinculadosIds.size !== 1 ? 's' : ''} vinculado{vinculadosIds.size !== 1 ? 's' : ''}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// =====================================================
// Linha individual de campo no modal
// =====================================================

function CampoRow({ campo, isActive, onToggle }: {
  campo: { id: string; nome: string; tipo: string; entidade: string; sistema?: boolean | null }
  isActive: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150 border-b border-border/50 last:border-b-0 ${
        isActive
          ? 'bg-primary/5 hover:bg-primary/10'
          : 'hover:bg-accent/50'
      }`}
    >
      {/* Checkbox visual */}
      <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
        isActive
          ? 'bg-primary border-primary'
          : 'border-input bg-background'
      }`}>
        {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
      </span>

      {/* Ícone da entidade */}
      <span className="flex-shrink-0 text-muted-foreground">
        <EntidadeIcon entidade={campo.entidade} />
      </span>

      {/* Nome */}
      <span className={`text-sm flex-1 ${isActive ? 'font-medium text-foreground' : 'text-foreground'}`}>
        {campo.nome}
      </span>

      {/* Tipo */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {campo.tipo}
      </span>

      {/* Badge sistema */}
      {campo.sistema && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground flex-shrink-0">
          Sistema
        </span>
      )}
    </button>
  )
}
