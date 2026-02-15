/**
 * AIDEV-NOTE: Item individual da lista de tarefas (PRD-10)
 * Exibe: checkbox, ícone tipo, título (clicável → abre oportunidade), badge atrasada,
 * subtítulo com oportunidade/pipeline/etapa, data, prioridade, responsável,
 * badge automática, botão Concluir explícito (PRD-10 RF-004/RF-005)
 */

import { forwardRef } from 'react'
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Zap,
  User,
  CheckCircle,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TarefaComDetalhes, TipoTarefa, PrioridadeTarefa } from '../services/tarefas.api'

const TIPO_ICONS: Record<TipoTarefa, React.ElementType> = {
  ligacao: Phone,
  email: Mail,
  reuniao: Calendar,
  whatsapp: WhatsAppIcon,
  visita: MapPin,
  outro: ClipboardList,
}

const TIPO_COLORS: Record<TipoTarefa, string> = {
  ligacao: 'text-primary bg-primary/10',
  email: 'text-[hsl(var(--warning-foreground))] bg-[hsl(var(--warning-muted))]',
  reuniao: 'text-[#4F46E5] bg-[#E0E7FF]',
  whatsapp: 'text-[#25D366] bg-[#25D366]/10',
  visita: 'text-[hsl(var(--success))] bg-[hsl(var(--success-muted))]',
  outro: 'text-muted-foreground bg-muted',
}

const PRIORIDADE_BADGES: Record<PrioridadeTarefa, { label: string; className: string }> = {
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  media: { label: 'Média', className: 'bg-primary/10 text-primary' },
  alta: { label: 'Alta', className: 'bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning-foreground))]' },
  urgente: { label: 'Urgente', className: 'bg-destructive/10 text-destructive' },
}

interface TarefaItemProps {
  tarefa: TarefaComDetalhes
  onConcluir: (tarefa: TarefaComDetalhes) => void
  onClickOportunidade: (oportunidadeId: string) => void
}

function formatarDataVencimento(data: string | null): { texto: string; atrasada: boolean; className: string } {
  if (!data) return { texto: 'Sem prazo', atrasada: false, className: 'text-muted-foreground' }

  const date = parseISO(data)
  const atrasada = isPast(date) && !isToday(date)

  let texto: string
  if (isToday(date)) {
    texto = 'Hoje'
  } else if (isTomorrow(date)) {
    texto = 'Amanhã'
  } else {
    texto = format(date, "dd/MM/yyyy", { locale: ptBR })
  }

  const className = atrasada ? 'text-destructive font-medium' : isToday(date) ? 'text-[hsl(var(--warning-foreground))] font-medium' : 'text-muted-foreground'

  return { texto, atrasada, className }
}

export const TarefaItem = forwardRef<HTMLDivElement, TarefaItemProps>(function TarefaItem({ tarefa, onConcluir, onClickOportunidade }: TarefaItemProps, _ref) {
  const Icon = TIPO_ICONS[tarefa.tipo] || ClipboardList
  const tipoColor = TIPO_COLORS[tarefa.tipo] || TIPO_COLORS.outro
  const isConcluida = tarefa.status === 'concluida'
  const isCancelada = tarefa.status === 'cancelada'
  const isDisabled = isConcluida || isCancelada

  const dataInfo = formatarDataVencimento(tarefa.data_vencimento)
  const isAtrasada = !isConcluida && !isCancelada && tarefa.status === 'pendente' && dataInfo.atrasada

  const oportunidade = tarefa.oportunidades
  const opLabel = oportunidade
    ? oportunidade.titulo || 'Sem título'
    : null

  const pipelineLabel = tarefa.funil_nome
  const etapaLabel = tarefa.etapa_origem_nome || tarefa.etapa_nome

  return (
    <div
      className={`
        group flex items-start gap-3 px-3 sm:px-4 py-3
        border-b border-border last:border-b-0
        transition-all duration-200
        ${isDisabled ? 'opacity-60' : 'hover:bg-muted/50'}
      `}
    >
      {/* Checkbox */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onConcluir(tarefa)}
        className={`
          mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${isConcluida
            ? 'bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white'
            : isCancelada
              ? 'bg-muted border-border'
              : 'border-border hover:border-primary hover:bg-primary/5'
          }
        `}
        title={isConcluida ? 'Concluída' : isCancelada ? 'Cancelada' : 'Concluir tarefa'}
      >
        {isConcluida && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Ícone do tipo */}
      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${tipoColor}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Título clicável - abre modal da oportunidade (PRD-10 RF-004) */}
          {oportunidade?.id && !isDisabled ? (
            <button
              type="button"
              onClick={() => onClickOportunidade(oportunidade.id)}
              className={`text-sm font-medium text-left hover:underline ${isConcluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}
            >
              {tarefa.titulo}
            </button>
          ) : (
            <span
              className={`text-sm font-medium ${isConcluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}
            >
              {tarefa.titulo}
            </span>
          )}

          {/* Badge atrasada + data inline */}
          {isAtrasada && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
              <AlertTriangle className="w-3 h-3" />
              ATRASADA · {dataInfo.texto}
            </span>
          )}

          {/* Badge prioridade */}
          {tarefa.prioridade && (
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${PRIORIDADE_BADGES[tarefa.prioridade].className}`}>
              {PRIORIDADE_BADGES[tarefa.prioridade].label}
            </span>
          )}

          {/* Badge automática/manual */}
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            tarefa.tarefa_template_id
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            {tarefa.tarefa_template_id ? <><Zap className="w-2.5 h-2.5" /> Auto</> : 'Manual'}
          </span>
        </div>

        {/* Subtítulo: Oportunidade | Pipeline | Etapa */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {opLabel && (
            <button
              type="button"
              onClick={() => oportunidade?.id && onClickOportunidade(oportunidade.id)}
              className="text-xs text-primary hover:underline truncate max-w-[200px]"
            >
              {opLabel}
            </button>
          )}
          {pipelineLabel && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{pipelineLabel}</span>
            </>
          )}
          {etapaLabel && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{etapaLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Direita: data + responsável + botão Concluir */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {!isAtrasada && (
          <span className={`text-xs ${dataInfo.className}`}>
            {dataInfo.texto}
          </span>
        )}
        {tarefa.owner && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{tarefa.owner.nome}</span>
          </span>
        )}
        {/* Botão Concluir explícito (PRD-10 RF-005) */}
        {!isDisabled && (
          <button
            type="button"
            onClick={() => onConcluir(tarefa)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-all duration-200"
          >
            <CheckCircle className="w-3 h-3" />
            Concluir
          </button>
        )}
      </div>
    </div>
  )
})
TarefaItem.displayName = 'TarefaItem'
