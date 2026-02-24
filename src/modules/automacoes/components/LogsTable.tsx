/**
 * AIDEV-NOTE: Tabela de logs de execução de automação (PRD-12)
 * Conforme Design System - Table
 */

import { Loader2, CheckCircle, XCircle, Clock, SkipForward } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useLogsAutomacao } from '../hooks/useAutomacoes'
import { TRIGGER_TIPOS } from '../schemas/automacoes.schema'

interface LogsTableProps {
  automacaoId: string
  onClose: () => void
}

const STATUS_MAP: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  sucesso: { icon: CheckCircle, label: 'Sucesso', color: 'text-green-600' },
  erro: { icon: XCircle, label: 'Erro', color: 'text-destructive' },
  executando: { icon: Clock, label: 'Executando', color: 'text-amber-500' },
  pulado: { icon: SkipForward, label: 'Pulado', color: 'text-muted-foreground' },
}

export function LogsTable({ automacaoId, onClose }: LogsTableProps) {
  const { data: logs, isLoading } = useLogsAutomacao(automacaoId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-popover rounded-lg shadow-xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Histórico de Execuções</h2>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhuma execução registrada
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map(log => {
                const statusInfo = STATUS_MAP[log.status] || STATUS_MAP.executando
                const StatusIcon = statusInfo.icon
                const triggerInfo = TRIGGER_TIPOS.find(t => t.tipo === log.trigger_tipo)

                return (
                  <div key={log.id} className="px-6 py-3 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                        <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {triggerInfo?.label || log.trigger_tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {log.duracao_ms && <span>{log.duracao_ms}ms</span>}
                        <span>{format(new Date(log.criado_em), "dd/MM HH:mm:ss", { locale: ptBR })}</span>
                      </div>
                    </div>
                    {log.erro_mensagem && (
                      // AIDEV-NOTE: Seg — usar <pre> para evitar rendering de HTML em mensagens de erro
                      <pre className="text-xs text-destructive mt-1 pl-6 whitespace-pre-wrap break-words font-sans">
                        {log.erro_mensagem}
                      </pre>
                    )}
                    {log.acoes_executadas && log.acoes_executadas.length > 0 && (
                      <div className="mt-1 pl-6 flex flex-wrap gap-1">
                        {(log.acoes_executadas as Array<{ tipo?: string; status?: string }>).map((a, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                            a.status === 'sucesso' ? 'bg-green-100 text-green-700' :
                            a.status === 'erro' ? 'bg-red-100 text-red-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {a.tipo || `Ação ${i + 1}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
