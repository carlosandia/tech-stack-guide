/**
 * AIDEV-NOTE: Logs de execução de webhook de formulário
 */

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useLogsWebhook } from '../../hooks/useFormularioWebhooks'

interface Props {
  webhookId: string
}

const STATUS_COLORS: Record<string, string> = {
  sucesso: 'text-green-600',
  erro: 'text-destructive',
  pendente: 'text-amber-600',
}

export function WebhookFormularioLogs({ webhookId }: Props) {
  const { data: logs = [], isLoading } = useLogsWebhook(webhookId)

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto my-4" />
  }

  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">Nenhum log de execução</p>
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Data</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-right">HTTP</TableHead>
            <TableHead className="text-xs text-right">Tempo</TableHead>
            <TableHead className="text-xs">Erro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                {log.disparado_em ? new Date(log.disparado_em).toLocaleString('pt-BR') : '—'}
              </TableCell>
              <TableCell>
                <span className={cn('text-[11px] font-medium', STATUS_COLORS[log.status || ''] || 'text-muted-foreground')}>
                  {log.status || '—'}
                </span>
              </TableCell>
              <TableCell className="text-[11px] text-right">
                {log.response_status_code ?? '—'}
              </TableCell>
              <TableCell className="text-[11px] text-right">
                {log.response_tempo_ms ? `${log.response_tempo_ms}ms` : '—'}
              </TableCell>
              <TableCell className="text-[11px] text-destructive max-w-[200px] truncate">
                {log.mensagem_erro || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
