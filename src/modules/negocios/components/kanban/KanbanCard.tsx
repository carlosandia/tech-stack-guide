/**
 * AIDEV-NOTE: Card individual do Kanban
 * Conforme Design System 10.4 Card
 * bg-card border border-border rounded-lg shadow-sm
 * Hover: shadow-md com transition-all duration-200
 */

import { User, DollarSign, Clock } from 'lucide-react'
import type { Oportunidade } from '../../services/negocios.api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanCardProps {
  oportunidade: Oportunidade
  onDragStart: (e: React.DragEvent, oportunidade: Oportunidade) => void
}

function getContatoNome(op: Oportunidade): string {
  if (!op.contato) return '—'
  if (op.contato.tipo === 'empresa') {
    return op.contato.nome_fantasia || op.contato.razao_social || '—'
  }
  const parts = [op.contato.nome, op.contato.sobrenome].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '—'
}

function getQualificacaoLabel(op: Oportunidade): { label: string; className: string } | null {
  if (op.qualificado_sql) return { label: 'SQL', className: 'bg-primary/10 text-primary' }
  if (op.qualificado_mql) return { label: 'MQL', className: 'bg-warning-muted text-warning-foreground' }
  return { label: 'Lead', className: 'bg-muted text-muted-foreground' }
}

function formatValor(valor: number | null | undefined): string {
  if (!valor) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

export function KanbanCard({ oportunidade, onDragStart }: KanbanCardProps) {
  const contatoNome = getContatoNome(oportunidade)
  const qualificacao = getQualificacaoLabel(oportunidade)
  const tempoNaEtapa = formatDistanceToNow(new Date(oportunidade.atualizado_em), {
    locale: ptBR,
    addSuffix: false,
  })

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, oportunidade)}
      className="
        bg-card border border-border rounded-lg shadow-sm p-3
        hover:shadow-md cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none
      "
    >
      {/* Título */}
      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 mb-2">
        {oportunidade.titulo}
      </p>

      {/* Contato */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <User className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{contatoNome}</span>
      </div>

      {/* Valor + Qualificação */}
      <div className="flex items-center justify-between gap-2">
        {oportunidade.valor ? (
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <DollarSign className="w-3 h-3 text-success flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
            <span>{formatValor(oportunidade.valor)}</span>
          </div>
        ) : (
          <span />
        )}

        {qualificacao && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${qualificacao.className}`}>
            {qualificacao.label}
          </span>
        )}
      </div>

      {/* Footer: Responsável + Tempo */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        {oportunidade.responsavel ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[9px] font-medium text-muted-foreground">
                {oportunidade.responsavel.nome[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
              {oportunidade.responsavel.nome}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">Sem responsável</span>
        )}

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{tempoNaEtapa}</span>
        </div>
      </div>
    </div>
  )
}
