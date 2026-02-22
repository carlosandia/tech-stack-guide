/**
 * AIDEV-NOTE: Popover de filtros avançados para o Kanban
 * Conforme PRD-07 RF-12
 * UI: Lista accordion com sub-seleção por categoria
 * Filtros aplicados em tempo real (sem botão Aplicar)
 *
 * Status derivado de etapa.tipo:
 *   - Aberto = etapas tipo 'entrada' | 'normal'
 *   - Ganho = etapa tipo 'ganho'
 *   - Perdido = etapa tipo 'perda'
 *
 * Qualificação derivada de:
 *   - Lead = !qualificado_mql && !qualificado_sql
 *   - MQL = qualificado_mql === true
 *   - SQL = qualificado_sql === true
 *
 * Origem vem de contatos.origem (não existe em oportunidades)
 */

import { useState, useEffect, useRef } from 'react'
import { Filter, ChevronRight, ChevronDown, Loader2, Save, Star, Trash2, BookmarkCheck } from 'lucide-react'
import { negociosApi } from '../../services/negocios.api'
import { useAuth } from '@/providers/AuthProvider'
import {
  listarFiltrosSalvos,
  salvarFiltro,
  excluirFiltro,
  definirFiltroPadrao,
  type FiltroSalvo,
} from '../../services/preferencias-filtros.api'
import { toast } from 'sonner'

// =====================================================
// Types
// =====================================================

export interface FiltrosKanban {
  status?: ('aberto' | 'ganho' | 'perdido')[]
  qualificacao?: ('lead' | 'mql' | 'sql')[]
  responsavelIds?: string[]
  valorMin?: number
  valorMax?: number
  dataCriacaoInicio?: string
  dataCriacaoFim?: string
  previsaoFechamentoInicio?: string
  previsaoFechamentoFim?: string
  origem?: string[]
  tarefasPendentes?: 'com' | 'sem'
}

interface FiltrosPopoverProps {
  filtros: FiltrosKanban
  onChange: (filtros: FiltrosKanban) => void
  isAdmin: boolean
}

type SecaoId = 'status' | 'qualificacao' | 'responsavel' | 'valor' | 'dataCriacao' | 'previsaoFechamento' | 'origem' | 'tarefas'

// =====================================================
// Helpers
// =====================================================

export function contarFiltrosAtivos(f: FiltrosKanban): number {
  let count = 0
  if (f.status?.length) count++
  if (f.qualificacao?.length) count++
  if (f.responsavelIds?.length) count++
  if (f.valorMin !== undefined || f.valorMax !== undefined) count++
  if (f.dataCriacaoInicio || f.dataCriacaoFim) count++
  if (f.previsaoFechamentoInicio || f.previsaoFechamentoFim) count++
  if (f.origem?.length) count++
  if (f.tarefasPendentes) count++
  return count
}

function contarSecao(f: FiltrosKanban, secao: SecaoId): number {
  switch (secao) {
    case 'status': return f.status?.length || 0
    case 'qualificacao': return f.qualificacao?.length || 0
    case 'responsavel': return f.responsavelIds?.length || 0
    case 'valor': return (f.valorMin !== undefined || f.valorMax !== undefined) ? 1 : 0
    case 'dataCriacao': return (f.dataCriacaoInicio || f.dataCriacaoFim) ? 1 : 0
    case 'previsaoFechamento': return (f.previsaoFechamentoInicio || f.previsaoFechamentoFim) ? 1 : 0
    case 'origem': return f.origem?.length || 0
    case 'tarefas': return f.tarefasPendentes ? 1 : 0
    default: return 0
  }
}

// =====================================================
// Sections config
// =====================================================

const SECOES: Array<{ id: SecaoId; label: string; adminOnly?: boolean }> = [
  { id: 'status', label: 'Status' },
  { id: 'qualificacao', label: 'Qualificação' },
  { id: 'responsavel', label: 'Responsável', adminOnly: true },
  { id: 'valor', label: 'Valor (R$)' },
  { id: 'dataCriacao', label: 'Data de Criação' },
  { id: 'previsaoFechamento', label: 'Previsão de Fechamento' },
  { id: 'origem', label: 'Origem' },
  { id: 'tarefas', label: 'Tarefas' },
]

// =====================================================
// Component
// =====================================================

export function FiltrosPopover({ filtros, onChange, isAdmin }: FiltrosPopoverProps) {
  const [open, setOpen] = useState(false)
  const [expandida, setExpandida] = useState<SecaoId | null>(null)
  const [membros, setMembros] = useState<Array<{ id: string; nome: string; sobrenome?: string | null }>>([])
  const [carregando, setCarregando] = useState(false)

  // Filtros salvos state
  const { user, tenantId } = useAuth()
  const [filtrosSalvos, setFiltrosSalvos] = useState<FiltroSalvo[]>([])
  const [mostrarSalvos, setMostrarSalvos] = useState(false)
  const [nomeNovoFiltro, setNomeNovoFiltro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mostrarInputNome, setMostrarInputNome] = useState(false)

  const totalAtivos = contarFiltrosAtivos(filtros)

  // Carregar membros quando abrir (admin only)
  useEffect(() => {
    if (!open || !isAdmin || membros.length > 0) return
    setCarregando(true)
    negociosApi.listarMembros()
      .then(data => setMembros(data as any))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [open, isAdmin, membros.length])

  // Carregar filtros salvos quando abrir
  useEffect(() => {
    if (!open) return
    listarFiltrosSalvos().then(setFiltrosSalvos).catch(console.error)
  }, [open])

  const toggleSecao = (secao: SecaoId) => {
    setExpandida(prev => prev === secao ? null : secao)
  }

  const handleLimpar = () => {
    onChange({})
  }

  // Toggle multi-select helper
  const toggleMulti = (
    key: 'status' | 'qualificacao' | 'origem',
    value: string,
    current: string[] | undefined
  ) => {
    const arr = current || []
    const next = arr.includes(value)
      ? arr.filter(v => v !== value)
      : [...arr, value]
    onChange({ ...filtros, [key]: next.length > 0 ? next : undefined })
  }

  // Salvar filtro
  const handleSalvarFiltro = async () => {
    if (!nomeNovoFiltro.trim() || !user?.id || !tenantId) return
    setSalvando(true)
    try {
      await salvarFiltro(user.id, tenantId, nomeNovoFiltro.trim(), filtros)
      const updated = await listarFiltrosSalvos()
      setFiltrosSalvos(updated)
      setNomeNovoFiltro('')
      setMostrarInputNome(false)
      toast.success('Filtro salvo com sucesso')
    } catch {
      toast.error('Erro ao salvar filtro')
    } finally {
      setSalvando(false)
    }
  }

  // Carregar filtro salvo
  const handleCarregarFiltro = (filtro: FiltroSalvo) => {
    onChange(filtro.filtros)
    setMostrarSalvos(false)
  }

  // Excluir filtro salvo
  const handleExcluirFiltro = async (id: string) => {
    try {
      await excluirFiltro(id)
      setFiltrosSalvos(prev => prev.filter(f => f.id !== id))
      toast.success('Filtro excluído')
    } catch {
      toast.error('Erro ao excluir filtro')
    }
  }

  // Definir como padrão
  const handleDefinirPadrao = async (id: string) => {
    if (!user?.id || !tenantId) return
    try {
      await definirFiltroPadrao(id, tenantId, user.id)
      const updated = await listarFiltrosSalvos()
      setFiltrosSalvos(updated)
      toast.success('Filtro definido como padrão')
    } catch {
      toast.error('Erro ao definir padrão')
    }
  }

  // =====================================================
  // Render section content
  // =====================================================

  const renderConteudo = (secaoId: SecaoId) => {
    switch (secaoId) {
      case 'status':
        return (
          <div className="flex flex-wrap gap-2 pt-2">
            {([
              { value: 'aberto', label: 'Aberto', corAtiva: 'bg-blue-50 border-blue-300 text-blue-700' },
              { value: 'ganho', label: 'Ganho', corAtiva: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
              { value: 'perdido', label: 'Perdido', corAtiva: 'bg-red-50 border-red-300 text-red-700' },
            ] as const).map(item => {
              const selecionado = (filtros.status || []).includes(item.value)
              return (
                <button
                  key={item.value}
                  onClick={() => toggleMulti('status', item.value, filtros.status)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                    ${selecionado ? item.corAtiva : 'border-border text-muted-foreground hover:bg-accent'}
                  `}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        )

      case 'qualificacao':
        return (
          <div className="flex flex-wrap gap-2 pt-2">
            {(['lead', 'mql', 'sql'] as const).map(q => {
              const selecionado = (filtros.qualificacao || []).includes(q)
              return (
                <button
                  key={q}
                  onClick={() => toggleMulti('qualificacao', q, filtros.qualificacao)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                    ${selecionado
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  {q.toUpperCase()}
                </button>
              )
            })}
          </div>
        )

      case 'responsavel':
        return (
          <div className="pt-2 flex flex-wrap gap-2">
            {carregando ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              membros.map(m => {
                const selecionado = (filtros.responsavelIds || []).includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const arr = filtros.responsavelIds || []
                      const next = arr.includes(m.id)
                        ? arr.filter(v => v !== m.id)
                        : [...arr, m.id]
                      onChange({ ...filtros, responsavelIds: next.length > 0 ? next : undefined })
                    }}
                    className={`
                      px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                      ${selecionado
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-accent'
                      }
                    `}
                  >
                    {m.nome}{m.sobrenome ? ` ${m.sobrenome}` : ''}
                  </button>
                )
              })
            )}
          </div>
        )

      case 'valor':
        return (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="number"
              placeholder="Min"
              value={filtros.valorMin ?? ''}
              onChange={(e) => onChange({
                ...filtros,
                valorMin: e.target.value ? Number(e.target.value) : undefined,
              })}
              className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filtros.valorMax ?? ''}
              onChange={(e) => onChange({
                ...filtros,
                valorMax: e.target.value ? Number(e.target.value) : undefined,
              })}
              className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
            />
          </div>
        )

      case 'dataCriacao':
        return (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="date"
              value={filtros.dataCriacaoInicio || ''}
              onChange={(e) => onChange({ ...filtros, dataCriacaoInicio: e.target.value || undefined })}
              className="flex-1 h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={filtros.dataCriacaoFim || ''}
              onChange={(e) => onChange({ ...filtros, dataCriacaoFim: e.target.value || undefined })}
              className="flex-1 h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        )

      case 'previsaoFechamento':
        return (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="date"
              value={filtros.previsaoFechamentoInicio || ''}
              onChange={(e) => onChange({ ...filtros, previsaoFechamentoInicio: e.target.value || undefined })}
              className="flex-1 h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={filtros.previsaoFechamentoFim || ''}
              onChange={(e) => onChange({ ...filtros, previsaoFechamentoFim: e.target.value || undefined })}
              className="flex-1 h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        )

      case 'origem':
        return (
          <div className="flex flex-wrap gap-2 pt-2">
            {([
              { value: 'manual', label: 'Manual' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'website', label: 'Website' },
              { value: 'indicacao', label: 'Indicação' },
              { value: 'leadads', label: 'Lead Ads' },
            ]).map(item => {
              const selecionado = (filtros.origem || []).includes(item.value)
              return (
                <button
                  key={item.value}
                  onClick={() => toggleMulti('origem', item.value, filtros.origem)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                    ${selecionado
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        )

      case 'tarefas':
        return (
          <div className="flex flex-wrap gap-2 pt-2">
            {([
              { value: 'com' as const, label: 'Com pendentes' },
              { value: 'sem' as const, label: 'Sem pendentes' },
            ]).map(item => {
              const selecionado = filtros.tarefasPendentes === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => onChange({
                    ...filtros,
                    tarefasPendentes: selecionado ? undefined : item.value,
                  })}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                    ${selecionado
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  // =====================================================
  // Render
  // =====================================================

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`
          relative p-2 rounded-md text-muted-foreground transition-all duration-200
          ${totalAtivos > 0 ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
        `}
        title="Filtros"
      >
        <Filter className="w-4 h-4" />
        {totalAtivos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {totalAtivos}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay mobile escuro */}
          <div className="fixed inset-0 z-[59] bg-black/40 sm:bg-transparent" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)] max-w-[20rem] z-[60]
                          sm:absolute sm:left-auto sm:translate-x-0 sm:top-auto sm:right-0 sm:mt-1.5 sm:w-[20rem]
                          bg-card border border-border rounded-lg shadow-lg p-0 animate-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Filtros</span>
            {filtrosSalvos.length > 0 && (
              <button
                onClick={() => setMostrarSalvos(!mostrarSalvos)}
                className={`p-1 rounded-md transition-colors ${mostrarSalvos ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                title="Filtros salvos"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {totalAtivos > 0 && (
            <button
              onClick={handleLimpar}
              className="text-xs text-primary hover:underline"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Filtros salvos panel */}
        {mostrarSalvos && filtrosSalvos.length > 0 && (
          <div className="border-b border-border bg-muted/30">
            <div className="px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtros Salvos</span>
            </div>
            <div className="max-h-[160px] overflow-y-auto">
              {filtrosSalvos.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-accent/50 transition-colors group"
                >
                  <button
                    onClick={() => handleCarregarFiltro(f)}
                    className="flex-1 text-left text-sm text-foreground truncate flex items-center gap-1.5"
                  >
                    {f.padrao && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                    {f.nome}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!f.padrao && (
                      <button
                        onClick={() => handleDefinirPadrao(f.id)}
                        className="p-1 rounded text-muted-foreground hover:text-amber-500 transition-colors"
                        title="Definir como padrão"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleExcluirFiltro(f.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accordion sections */}
        <div className="max-h-[420px] overflow-y-auto">
          {SECOES
            .filter(s => !s.adminOnly || isAdmin)
            .map(secao => {
              const isExpanded = expandida === secao.id
              const count = contarSecao(filtros, secao.id)
              return (
                <div key={secao.id} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleSecao(secao.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium">{secao.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3">
                      {renderConteudo(secao.id)}
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {/* Footer: salvar filtro */}
        {totalAtivos > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            {mostrarInputNome ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do filtro..."
                  value={nomeNovoFiltro}
                  onChange={(e) => setNomeNovoFiltro(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarFiltro()}
                  className="flex-1 h-8 px-2.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={handleSalvarFiltro}
                  disabled={!nomeNovoFiltro.trim() || salvando}
                  className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {salvando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Salvar
                </button>
                <button
                  onClick={() => { setMostrarInputNome(false); setNomeNovoFiltro('') }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMostrarInputNome(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Save className="w-3 h-3" />
                Salvar filtro atual
              </button>
            )}
          </div>
        )}
          </div>
        </>
      )}
    </div>
  )
}
