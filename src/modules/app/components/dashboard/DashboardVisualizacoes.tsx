/**
 * AIDEV-NOTE: Componente de visualizações salvas do dashboard.
 * Permite criar, aplicar, editar e excluir combinações de filtros com nome personalizado.
 * Mostra resumo das configurações ao criar/editar.
 */

import { useState } from 'react'
import { Bookmark, Trash2, Check, Plus, Pencil, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  useDashboardVisualizacoes,
  type VisualizacaoFiltros,
  type VisualizacaoDashboard,
} from '../../hooks/useDashboardVisualizacoes'
import type { DashboardDisplayConfig } from '../../hooks/useDashboardDisplay'

interface FunilOption {
  id: string
  nome: string
}

interface DashboardVisualizacoesProps {
  filtrosAtuais: VisualizacaoFiltros
  configExibicaoAtual: DashboardDisplayConfig
  onAplicar: (v: VisualizacaoDashboard) => void
  funis?: FunilOption[]
}

// AIDEV-NOTE: Labels legíveis para períodos
const PERIODO_LABELS: Record<string, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  personalizado: 'Personalizado',
}

const SECTION_LABELS: Record<string, string> = {
  metas: 'Metas',
  funil: 'Funil',
  reunioes: 'Reuniões',
  'kpis-principais': 'KPIs',
  canal: 'Canal',
  motivos: 'Motivos',
}

function getResumoConfig(
  filtros: VisualizacaoFiltros,
  config: Partial<DashboardDisplayConfig>,
  funis: FunilOption[]
) {
  const periodo = filtros.periodo
    ? PERIODO_LABELS[filtros.periodo] || filtros.periodo
    : 'Padrão'

  const periodoDetalhe =
    filtros.periodo === 'personalizado' && filtros.data_inicio && filtros.data_fim
      ? `${filtros.data_inicio} a ${filtros.data_fim}`
      : null

  const funilNome = filtros.funil_id
    ? funis.find((f) => f.id === filtros.funil_id)?.nome || 'Funil selecionado'
    : 'Todos os funis'

  const secoesAtivas = Object.entries(config)
    .filter(([key, val]) => val && SECTION_LABELS[key])
    .map(([key]) => SECTION_LABELS[key])

  return { periodo, periodoDetalhe, funilNome, secoesAtivas }
}

function ConfigResumo({
  filtros,
  config,
  funis,
}: {
  filtros: VisualizacaoFiltros
  config: Partial<DashboardDisplayConfig>
  funis: FunilOption[]
}) {
  const { periodo, periodoDetalhe, funilNome, secoesAtivas } = getResumoConfig(
    filtros,
    config,
    funis
  )

  return (
    <div className="space-y-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2.5 py-2 border border-border/50">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground">Período:</span>
        <span>{periodo}</span>
        {periodoDetalhe && <span className="text-[10px]">({periodoDetalhe})</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground">Funil:</span>
        <span>{funilNome}</span>
      </div>
      {secoesAtivas.length > 0 && (
        <div className="flex items-start gap-1.5">
          <span className="font-semibold text-foreground shrink-0">Seções:</span>
          <span className="leading-tight">{secoesAtivas.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

function getSubtexto(filtros: VisualizacaoFiltros, funis: FunilOption[]) {
  const p = filtros.periodo ? (PERIODO_LABELS[filtros.periodo]?.replace('Últimos ', '') || filtros.periodo) : ''
  const f = filtros.funil_id ? funis.find((x) => x.id === filtros.funil_id)?.nome : null
  return [p, f].filter(Boolean).join(' • ') || 'Configuração salva'
}

export default function DashboardVisualizacoes({
  filtrosAtuais,
  configExibicaoAtual,
  onAplicar,
  funis = [],
}: DashboardVisualizacoesProps) {
  const { visualizacoes, salvar, editar, excluir, isSaving, isEditing } =
    useDashboardVisualizacoes()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [open, setOpen] = useState(false)

  // Edição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [updateConfig, setUpdateConfig] = useState(false)

  const handleSalvar = () => {
    if (!nome.trim()) return
    salvar(
      {
        nome: nome.trim(),
        filtros: filtrosAtuais,
        config_exibicao: configExibicaoAtual,
      },
      {
        onSuccess: () => {
          setNome('')
          setShowForm(false)
        },
      }
    )
  }

  const handleAplicar = (v: VisualizacaoDashboard) => {
    if (editingId) return
    onAplicar(v)
    setOpen(false)
  }

  const handleStartEdit = (v: VisualizacaoDashboard) => {
    setEditingId(v.id)
    setEditNome(v.nome)
    setUpdateConfig(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditNome('')
    setUpdateConfig(false)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editNome.trim()) return
    const payload: { id: string; nome: string; filtros?: typeof filtrosAtuais; config_exibicao?: typeof configExibicaoAtual } = {
      id: editingId,
      nome: editNome.trim(),
    }
    if (updateConfig) {
      payload.filtros = filtrosAtuais
      payload.config_exibicao = configExibicaoAtual
    }
    editar(payload, {
      onSuccess: () => {
        setEditingId(null)
        setEditNome('')
        setUpdateConfig(false)
      },
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Visualizações salvas"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Visualizações</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">Visualizações Salvas</p>

          {/* Lista */}
          {visualizacoes.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Nenhuma visualização salva
            </p>
          )}

          <div className="max-h-56 overflow-y-auto space-y-1">
            {visualizacoes.map((v) =>
              editingId === v.id ? (
                /* Modo edição inline */
                <div key={v.id} className="space-y-2 p-2 rounded-md bg-muted/30 border border-border/50">
                  <Input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome da visualização"
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <ConfigResumo
                    filtros={updateConfig ? filtrosAtuais : v.filtros}
                    config={updateConfig ? configExibicaoAtual : v.config_exibicao}
                    funis={funis}
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={updateConfig}
                        onChange={(e) => setUpdateConfig(e.target.checked)}
                        className="rounded border-border accent-primary w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate">Usar config. atuais</span>
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={handleCancelEdit}
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="h-6 w-6 flex items-center justify-center rounded-md text-primary hover:text-primary-foreground hover:bg-primary transition-colors disabled:opacity-40"
                        onClick={handleSaveEdit}
                        disabled={isEditing || !editNome.trim()}
                        title="Salvar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Item normal */
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group cursor-pointer"
                  onClick={() => handleAplicar(v)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs text-foreground truncate">{v.nome}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate pl-5">
                      {getSubtexto(v.filtros, funis)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      className="p-1 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(v)
                      }}
                      title="Editar"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        excluir(v.id)
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Formulário de criação */}
          {showForm ? (
            <div className="space-y-2 p-2 rounded-md bg-muted/30 border border-border/50">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da visualização"
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
              />
              <ConfigResumo
                filtros={filtrosAtuais}
                config={configExibicaoAtual}
                funis={funis}
              />
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setShowForm(false)
                    setNome('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={handleSalvar}
                  disabled={isSaving || !nome.trim()}
                >
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-full py-1"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Salvar visualização atual
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
