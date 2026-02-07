/**
 * AIDEV-NOTE: Bloco 3 - Timeline/Histórico (RF-14.4)
 * Timeline vertical agrupada por dia via audit_log
 */

import { Loader2, History, ArrowRight, FileText, MessageSquare, CheckCircle, Plus } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useHistorico } from '../../hooks/useOportunidadeDetalhes'

interface DetalhesHistoricoProps {
  oportunidadeId: string
}

function getEventIcon(acao: string) {
  switch (acao) {
    case 'criacao':
    case 'INSERT':
      return <Plus className="w-3 h-3" />
    case 'movimentacao':
    case 'UPDATE':
      return <ArrowRight className="w-3 h-3" />
    case 'anotacao':
      return <MessageSquare className="w-3 h-3" />
    case 'tarefa_concluida':
      return <CheckCircle className="w-3 h-3" />
    case 'documento':
      return <FileText className="w-3 h-3" />
    default:
      return <History className="w-3 h-3" />
  }
}

function getEventLabel(evento: { acao: string; entidade: string; detalhes: Record<string, unknown> | null }): string {
  const acao = evento.acao?.toLowerCase()
  const entidade = evento.entidade?.toLowerCase()

  if (acao === 'insert' && entidade === 'oportunidades') return 'Oportunidade criada'
  if (acao === 'update' && entidade === 'oportunidades') return 'Oportunidade atualizada'
  if (acao === 'insert' && entidade === 'anotacoes_oportunidades') return 'Anotação adicionada'
  if (acao === 'update' && entidade === 'anotacoes_oportunidades') return 'Anotação editada'
  if (acao === 'delete' && entidade === 'anotacoes_oportunidades') return 'Anotação excluída'
  if (entidade === 'documentos_oportunidades') return 'Documento anexado'
  if (entidade === 'emails_oportunidades') return 'E-mail enviado'
  if (entidade === 'reunioes_oportunidades') return 'Reunião registrada'

  return `${acao || 'Ação'} em ${entidade || 'entidade'}`
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM", { locale: ptBR })
}

function groupByDay(eventos: Array<{ criado_em: string; [k: string]: unknown }>): Record<string, typeof eventos> {
  const groups: Record<string, typeof eventos> = {}
  for (const ev of eventos) {
    const dayKey = ev.criado_em.slice(0, 10) // YYYY-MM-DD
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(ev)
  }
  return groups
}

export function DetalhesHistorico({ oportunidadeId }: DetalhesHistoricoProps) {
  const { data: historico, isLoading } = useHistorico(oportunidadeId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!historico?.length) {
    return (
      <div className="text-center py-8">
        <History className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Sem histórico registrado</p>
      </div>
    )
  }

  const groups = groupByDay(historico)
  const sortedDays = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Histórico
      </h3>

      {sortedDays.map(day => (
        <div key={day}>
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">
            {formatGroupDate(groups[day][0].criado_em)}
          </p>
          <div className="space-y-0">
            {groups[day].map((evento: any) => (
              <div key={evento.id} className="flex gap-2 py-1.5">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {getEventIcon(evento.acao)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-tight">
                    {getEventLabel(evento)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(evento.criado_em), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
