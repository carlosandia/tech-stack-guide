/**
 * AIDEV-NOTE: Bloco 3 - Timeline/Histórico (RF-14.4)
 * Timeline vertical agrupada por dia via audit_log
 * Exibe labels ricos com detalhes contextuais e nome do usuário
 */

import { Loader2, History, ArrowRight, FileText, MessageSquare, CheckCircle, Plus, Trash2, Mail, Calendar, XCircle, Award, User, Edit, Tag, TagIcon } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useHistorico } from '../../hooks/useOportunidadeDetalhes'
import { formatCurrency } from '@/lib/formatters'

interface DetalhesHistoricoProps {
  oportunidadeId: string
}

interface HistoricoEvento {
  id: string
  acao: string
  entidade: string
  detalhes: Record<string, unknown> | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  criado_em: string
  usuario_id: string | null
  usuario_nome: string | null
}

function getEventIcon(acao: string) {
  const iconClass = 'w-3.5 h-3.5'
  switch (acao) {
    case 'criacao':
      return <Plus className={iconClass} />
    case 'movimentacao':
      return <ArrowRight className={iconClass} />
    case 'alteracao_campo':
      return <Edit className={iconClass} />
    case 'fechamento':
      return <CheckCircle className={iconClass} />
    case 'exclusao':
      return <Trash2 className={iconClass} />
    case 'qualificacao':
      return <Award className={iconClass} />
    case 'anotacao_criada':
    case 'anotacao_editada':
      return <MessageSquare className={iconClass} />
    case 'anotacao_excluida':
      return <Trash2 className={iconClass} />
    case 'tarefa_criada':
      return <Plus className={iconClass} />
    case 'tarefa_concluida':
      return <CheckCircle className={iconClass} />
    case 'tarefa_excluida':
      return <Trash2 className={iconClass} />
    case 'tarefa_atualizada':
      return <Edit className={iconClass} />
    case 'documento_anexado':
      return <FileText className={iconClass} />
    case 'documento_removido':
      return <Trash2 className={iconClass} />
    case 'email_criado':
    case 'email_enviado':
      return <Mail className={iconClass} />
    case 'reuniao_agendada':
    case 'reuniao_reagendada':
      return <Calendar className={iconClass} />
    case 'reuniao_realizada':
      return <CheckCircle className={iconClass} />
    case 'reuniao_cancelada':
    case 'reuniao_noshow':
    case 'reuniao_excluida':
      return <XCircle className={iconClass} />
    case 'contato_atualizado':
      return <User className={iconClass} />
    case 'tag_adicionada':
      return <Tag className={iconClass} />
    case 'tag_removida':
      return <TagIcon className={iconClass} />
    default:
      return <History className={iconClass} />
  }
}

function getEventIconBg(acao: string): string {
  switch (acao) {
    case 'criacao':
      return 'bg-primary/15 text-primary'
    case 'movimentacao':
      return 'bg-info-muted text-info-foreground'
    case 'fechamento':
    case 'tarefa_concluida':
    case 'reuniao_realizada':
      return 'bg-success-muted text-success-foreground'
    case 'exclusao':
    case 'anotacao_excluida':
    case 'tarefa_excluida':
    case 'documento_removido':
    case 'reuniao_cancelada':
    case 'reuniao_noshow':
    case 'reuniao_excluida':
    case 'tag_removida':
      return 'bg-destructive/10 text-destructive'
    case 'qualificacao':
      return 'bg-warning-muted text-warning-foreground'
    case 'tag_adicionada':
      return 'bg-success-muted text-success-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getEventLabel(evento: HistoricoEvento): string {
  const d = evento.detalhes || {}

  switch (evento.acao) {
    case 'criacao':
      return 'Oportunidade criada'
    case 'movimentacao':
      if (d.etapa_nova_nome) return `Moveu para ${d.etapa_nova_nome}`
      return 'Moveu de etapa'
    case 'alteracao_campo': {
      const campo = d.campo as string
      switch (campo) {
        case 'valor':
          return `Valor alterado${d.para ? ` para ${formatCurrency(d.para as number)}` : ''}`
        case 'responsavel':
          return 'Responsável alterado'
        case 'previsao_fechamento':
          return 'Previsão de fechamento alterada'
        case 'titulo':
          return `Título alterado para "${d.para}"`
        default:
          return `Campo ${campo} alterado`
      }
    }
    case 'fechamento':
      return 'Oportunidade fechada'
    case 'exclusao':
      return 'Oportunidade excluída'
    case 'qualificacao':
      return `Qualificado como ${d.tipo || 'MQL'}`

    // Anotações
    case 'anotacao_criada': {
      const tipo = d.tipo as string
      if (tipo === 'audio') return 'Áudio gravado'
      if (tipo === 'texto_audio') return 'Anotação com áudio adicionada'
      return 'Anotação adicionada'
    }
    case 'anotacao_editada':
      return 'Anotação editada'
    case 'anotacao_excluida':
      return 'Anotação excluída'

    // Tarefas
    case 'tarefa_criada':
      return `Tarefa criada${d.titulo ? `: ${d.titulo}` : ''}`
    case 'tarefa_concluida':
      return `Tarefa concluída${d.titulo ? `: ${d.titulo}` : ''}`
    case 'tarefa_excluida':
      return `Tarefa excluída${d.titulo ? `: ${d.titulo}` : ''}`
    case 'tarefa_atualizada':
      return `Tarefa atualizada${d.titulo ? `: ${d.titulo}` : ''}`

    // Documentos
    case 'documento_anexado':
      return `Documento anexado${d.nome_arquivo ? `: ${d.nome_arquivo}` : ''}`
    case 'documento_removido':
      return `Documento removido${d.nome_arquivo ? `: ${d.nome_arquivo}` : ''}`

    // Emails
    case 'email_criado':
      return `E-mail criado${d.assunto ? `: ${d.assunto}` : ''}`
    case 'email_enviado':
      return `E-mail enviado${d.assunto ? `: ${d.assunto}` : ''}`

    // Reuniões
    case 'reuniao_agendada':
      return `Reunião agendada${d.titulo ? `: ${d.titulo}` : ''}`
    case 'reuniao_realizada':
      return `Reunião realizada${d.titulo ? `: ${d.titulo}` : ''}`
    case 'reuniao_cancelada':
      return `Reunião cancelada${d.titulo ? `: ${d.titulo}` : ''}`
    case 'reuniao_noshow':
      return `No-show${d.titulo ? `: ${d.titulo}` : ''}`
    case 'reuniao_reagendada':
      return `Reunião reagendada${d.titulo ? `: ${d.titulo}` : ''}`
    case 'reuniao_excluida':
      return `Reunião excluída${d.titulo ? `: ${d.titulo}` : ''}`

    // Contato
    case 'contato_atualizado': {
      const campos = d.campos_alterados as string[] | undefined
      if (campos?.length) {
        const labels: Record<string, string> = {
          nome: 'nome', sobrenome: 'sobrenome', email: 'e-mail', telefone: 'telefone',
          empresa: 'empresa', nome_fantasia: 'nome fantasia', razao_social: 'razão social', cargo: 'cargo',
        }
        const desc = campos.map(c => labels[c] || c).join(', ')
        return `Contato atualizado: ${desc}`
      }
      return 'Contato atualizado'
    }

    // Tags/Segmentos
    case 'tag_adicionada':
      return `Tag adicionada: ${d.segmento_nome || 'Desconhecido'}`
    case 'tag_removida':
      return `Tag removida: ${d.segmento_nome || 'Desconhecido'}`

    default:
      return evento.acao.replace(/_/g, ' ')
  }
}

function getEventSublabel(evento: HistoricoEvento): string | null {
  const d = evento.detalhes || {}

  if (evento.acao === 'movimentacao' && d.etapa_anterior_nome && d.etapa_nova_nome) {
    return `${d.etapa_anterior_nome} → ${d.etapa_nova_nome}`
  }

  if (evento.acao === 'alteracao_campo' && d.campo === 'valor' && d.de != null) {
    return `${formatCurrency(d.de as number)} → ${formatCurrency(d.para as number)}`
  }

  // Responsável: mostrar nomes (de → para)
  if (evento.acao === 'alteracao_campo' && d.campo === 'responsavel') {
    const deNome = d.de_nome as string | undefined
    const paraNome = d.para_nome as string | undefined
    if (deNome || paraNome) {
      return `${deNome || '(nenhum)'} → ${paraNome || '(nenhum)'}`
    }
  }

  // Previsão de fechamento: mostrar datas formatadas
  if (evento.acao === 'alteracao_campo' && d.campo === 'previsao_fechamento') {
    const formatDate = (v: unknown) => {
      if (!v) return '(nenhuma)'
      try { return format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR }) } catch { return String(v) }
    }
    return `${formatDate(d.de)} → ${formatDate(d.para)}`
  }

  return null
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM", { locale: ptBR })
}

function groupByDay(eventos: HistoricoEvento[]): Record<string, HistoricoEvento[]> {
  const groups: Record<string, HistoricoEvento[]> = {}
  for (const ev of eventos) {
    const dayKey = ev.criado_em.slice(0, 10)
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

  const groups = groupByDay(historico as HistoricoEvento[])
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
            {groups[day].map((evento) => {
              const sublabel = getEventSublabel(evento)
              return (
                <div key={evento.id} className="flex gap-2 py-1.5">
                  <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${getEventIconBg(evento.acao)}`}>
                    {getEventIcon(evento.acao)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-tight">
                      {getEventLabel(evento)}
                    </p>
                    {sublabel && (
                      <p className="text-[10px] text-muted-foreground/80 leading-tight mt-0.5">
                        {sublabel}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(evento.criado_em), 'HH:mm', { locale: ptBR })}
                      {evento.usuario_nome && (
                        <span> · {evento.usuario_nome}</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
