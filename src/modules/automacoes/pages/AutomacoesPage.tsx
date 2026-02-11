/**
 * AIDEV-NOTE: Página principal de Automações (PRD-12)
 * Listagem com cards, toggle ativo/inativo, criação e edição
 * Conforme Design System e padrão ConfiguracoesLayout
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Zap, History } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '@/modules/configuracoes/contexts/ConfigToolbarContext'
import { useAutomacoes, useToggleAutomacao, useExcluirAutomacao } from '../hooks/useAutomacoes'
import { AutomacaoCard } from '../components/AutomacaoCard'
import { AutomacaoFormModal } from '../components/AutomacaoFormModal'
import { LogsTable } from '../components/LogsTable'
import type { Automacao } from '../schemas/automacoes.schema'

export function AutomacoesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalAberto, setModalAberto] = useState(false)
  const [automacaoEditando, setAutomacaoEditando] = useState<Automacao | null>(null)
  const [logsAutomacaoId, setLogsAutomacaoId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativas' | 'inativas'>('todas')

  const { data: automacoes, isLoading, error } = useAutomacoes()
  const toggleMutation = useToggleAutomacao()
  const excluirMutation = useExcluirAutomacao()

  useEffect(() => {
    setSubtitle('Automatize ações com base em eventos do CRM')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setAutomacaoEditando(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Automação</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (id: string) => {
    const a = automacoes?.find(x => x.id === id)
    if (a) {
      setAutomacaoEditando(a)
      setModalAberto(true)
    }
  }

  const handleToggle = (id: string, ativo: boolean) => {
    toggleMutation.mutate({ id, ativo })
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      excluirMutation.mutate(id)
    }
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
        <p className="text-sm text-destructive">Erro ao carregar automações</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Verifique sua conexão'}
        </p>
      </div>
    )
  }

  const lista = automacoes || []
  const filtrada = filtroStatus === 'todas'
    ? lista
    : filtroStatus === 'ativas'
      ? lista.filter(a => a.ativo)
      : lista.filter(a => !a.ativo)

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
        <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Motor de Automações</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie fluxos automatizados com <strong>Gatilho → Condição → Ação</strong>. Envie WhatsApp, e-mails,
            crie tarefas, altere responsáveis e muito mais — tudo automaticamente.
          </p>
        </div>
      </div>

      {/* Filtros */}
      {lista.length > 0 && (
        <div className="flex items-center gap-1.5">
          {(['todas', 'ativas', 'inativas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filtroStatus === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f === 'todas' ? `Todas (${lista.length})` :
               f === 'ativas' ? `Ativas (${lista.filter(a => a.ativo).length})` :
               `Inativas (${lista.filter(a => !a.ativo).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {filtrada.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {lista.length === 0 ? 'Nenhuma automação criada' : 'Nenhuma automação encontrada'}
          </p>
          {isAdmin && lista.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Automação&quot; para começar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtrada.map(automacao => (
            <div key={automacao.id} className="group relative">
              <AutomacaoCard
                automacao={automacao}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
              {/* Botão de logs */}
              <button
                onClick={() => setLogsAutomacaoId(automacao.id)}
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                title="Ver histórico"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      {modalAberto && (
        <AutomacaoFormModal
          automacao={automacaoEditando}
          onClose={() => { setModalAberto(false); setAutomacaoEditando(null) }}
        />
      )}

      {/* Modal de logs */}
      {logsAutomacaoId && (
        <LogsTable
          automacaoId={logsAutomacaoId}
          onClose={() => setLogsAutomacaoId(null)}
        />
      )}
    </div>
  )
}
