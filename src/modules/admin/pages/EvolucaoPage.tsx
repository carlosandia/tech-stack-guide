/**
 * AIDEV-NOTE: Pagina Evolucao do Produto (PRD-15)
 * Super Admin - listagem de feedbacks com filtros, paginacao e detalhes
 * GAP 3: Filtro de Empresa adicionado
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToolbar } from '../contexts/ToolbarContext'
import { useFeedbacksAdmin } from '@/modules/feedback/hooks/useFeedback'
import { FeedbackDetalhesModal } from '../components/FeedbackDetalhesModal'
import type { FeedbackComDetalhes, TipoFeedback, StatusFeedback } from '@/modules/feedback/services/feedback.api'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Bug,
  HelpCircle,
  Loader2,
  Inbox,
} from 'lucide-react'

const TIPOS: { value: TipoFeedback; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'duvida', label: 'Dúvida' },
]

const STATUS_OPTIONS: { value: StatusFeedback; label: string }[] = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'resolvido', label: 'Resolvido' },
]

// --- Sub-componentes extraídos ---

function TipoBadge({ tipo }: { tipo: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    bug: { bg: 'bg-red-50', text: 'text-red-800', icon: Bug },
    sugestao: { bg: 'bg-violet-50', text: 'text-violet-800', icon: Lightbulb },
    duvida: { bg: 'bg-blue-50', text: 'text-blue-800', icon: HelpCircle },
  }
  const c = config[tipo] || config.duvida
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {tipo === 'sugestao' ? 'Sugestão' : tipo === 'duvida' ? 'Dúvida' : 'Bug'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isResolvido = status === 'resolvido'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      isResolvido ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
    }`}>
      {isResolvido ? 'Resolvido' : 'Aberto'}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// --- Hook para buscar organizações ---

function useOrganizacoesSelect() {
  return useQuery({
    queryKey: ['organizacoes-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizacoes_saas')
        .select('id, nome')
        .order('nome')
      if (error) throw error
      return data || []
    },
  })
}

// --- Página principal ---

function EvolucaoPage() {
  const { setActions, setSubtitle } = useToolbar()

  // Filtros
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState<TipoFeedback | ''>('')
  const [status, setStatus] = useState<StatusFeedback | ''>('')
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Detalhes
  const [selected, setSelected] = useState<FeedbackComDetalhes | null>(null)

  // Organizações para filtro (GAP 3)
  const { data: organizacoes } = useOrganizacoesSelect()

  // Debounce busca
  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 300)
    return () => clearTimeout(timer)
  }, [busca])

  // Reset page ao mudar filtros
  useEffect(() => { setPage(1) }, [empresa, tipo, status, buscaDebounced])

  const { data, isLoading } = useFeedbacksAdmin({
    empresa_id: empresa || undefined,
    tipo: tipo || undefined,
    status: status || undefined,
    busca: buscaDebounced || undefined,
    page,
    limit,
  })

  // Toolbar
  const renderToolbar = useCallback(() => {
    setSubtitle(data ? `${data.total} feedback${data.total !== 1 ? 's' : ''}` : '')
    setActions(null)
  }, [data, setSubtitle, setActions])

  useEffect(() => { renderToolbar() }, [renderToolbar])

  const feedbacks = data?.feedbacks || []
  const totalPages = data?.total_pages || 1

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro Empresa (GAP 3) */}
        <select
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas as empresas</option>
          {organizacoes?.map((org) => (
            <option key={org.id} value={org.id}>{org.nome}</option>
          ))}
        </select>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoFeedback | '')}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFeedback | '')}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar na descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">Nenhum feedback encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Empresa</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr
                    key={fb.id}
                    onClick={() => setSelected(fb)}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {fb.organizacao?.nome || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{fb.usuario?.nome || '—'}</p>
                        <p className="text-xs text-muted-foreground">{fb.usuario?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TipoBadge tipo={fb.tipo} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(fb.criado_em)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={fb.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginacao */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes (GAP 5: onResolved para invalidar lista) */}
      {selected && (
        <FeedbackDetalhesModal
          feedback={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onResolved={() => {
            // A lista será atualizada pelo invalidateQueries do hook
          }}
        />
      )}
    </div>
  )
}

export default EvolucaoPage
