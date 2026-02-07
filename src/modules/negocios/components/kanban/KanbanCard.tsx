/**
 * AIDEV-NOTE: Card individual do Kanban — renderiza campos dinamicamente
 * baseado na configuração salva em /configuracoes/cards.
 * Badge de qualificação (Lead/MQL/SQL) na mesma linha do título.
 */

import {
  User,
  DollarSign,
  Clock,
  Building2,
  Phone,
  Mail,
  UserCircle,
  CalendarDays,
  Calendar,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { Oportunidade } from '../../services/negocios.api'
import { TarefasPopover } from './TarefasPopover'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =====================================================
// Types
// =====================================================

export interface CardConfig {
  camposVisiveis: string[]
  acoesRapidas: string[]
}

interface KanbanCardProps {
  oportunidade: Oportunidade
  onDragStart: (e: React.DragEvent, oportunidade: Oportunidade) => void
  onClick: (oportunidade: Oportunidade) => void
  config?: CardConfig
}

// =====================================================
// Defaults (fallback quando config não carregou)
// =====================================================

const DEFAULT_CONFIG: CardConfig = {
  camposVisiveis: ['valor', 'contato', 'empresa', 'owner', 'previsao_fechamento', 'tarefas_pendentes', 'tags'],
  acoesRapidas: ['telefone', 'whatsapp', 'email', 'agendar'],
}

// =====================================================
// Helpers
// =====================================================

function getContatoNome(op: Oportunidade): string {
  if (!op.contato) return '—'
  if (op.contato.tipo === 'empresa') {
    return op.contato.nome_fantasia || op.contato.razao_social || '—'
  }
  const parts = [op.contato.nome, op.contato.sobrenome].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '—'
}

function getEmpresaNome(op: Oportunidade): string | null {
  if (!op.contato) return null
  if (op.contato.tipo === 'empresa') {
    return op.contato.nome_fantasia || op.contato.razao_social || null
  }
  // Para pessoa, empresa vinculada não está no contato enrichment atual
  return null
}

function getQualificacaoLabel(op: Oportunidade): { label: string; className: string } {
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

function formatData(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

// =====================================================
// Ações rápidas icons
// =====================================================

const ACOES_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  telefone: { icon: Phone, label: 'Ligar' },
  whatsapp: { icon: WhatsAppIcon, label: 'WhatsApp' },
  email: { icon: Mail, label: 'Email' },
  agendar: { icon: Calendar, label: 'Agendar' },
}

// =====================================================
// Component
// =====================================================

export function KanbanCard({ oportunidade, onDragStart, onClick, config }: KanbanCardProps) {
  const { camposVisiveis, acoesRapidas } = config || DEFAULT_CONFIG
  const qualificacao = getQualificacaoLabel(oportunidade)
  const tarefasPendentes = (oportunidade as any)._tarefas_pendentes ?? 0
  const tarefasTotal = (oportunidade as any)._tarefas_total ?? 0
  const tarefasConcluidas = tarefasTotal - tarefasPendentes

  const tempoNaEtapa = formatDistanceToNow(new Date(oportunidade.atualizado_em), {
    locale: ptBR,
    addSuffix: false,
  })

  // Renderiza um campo do card baseado na key
  const renderCampo = (key: string) => {
    switch (key) {
      case 'valor':
        if (!oportunidade.valor) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
            <span className="text-sm font-semibold text-foreground">{formatValor(oportunidade.valor)}</span>
          </div>
        )

      case 'contato': {
        const nome = getContatoNome(oportunidade)
        if (nome === '—') return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground truncate">{nome}</span>
          </div>
        )
      }

      case 'empresa': {
        const empresa = getEmpresaNome(oportunidade)
        if (!empresa) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground truncate">{empresa}</span>
          </div>
        )
      }

      case 'telefone':
        if (!oportunidade.contato?.telefone) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{oportunidade.contato.telefone}</span>
          </div>
        )

      case 'email':
        if (!oportunidade.contato?.email) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{oportunidade.contato.email}</span>
          </div>
        )

      case 'owner':
        if (!oportunidade.responsavel) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-medium text-primary">
                  {oportunidade.responsavel.nome[0]?.toUpperCase()}{oportunidade.responsavel.sobrenome?.[0]?.toUpperCase() || ''}
                </span>
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {oportunidade.responsavel.nome} {oportunidade.responsavel.sobrenome?.[0] ? `${oportunidade.responsavel.sobrenome[0]}.` : ''}
              </span>
            </div>
          </div>
        )

      case 'data_criacao':
        return (
          <div key={key} className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">{formatData(oportunidade.criado_em)}</span>
          </div>
        )

      case 'previsao_fechamento':
        if (!oportunidade.previsao_fechamento) return null
        return (
          <div key={key} className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">📅 {formatData(oportunidade.previsao_fechamento)}</span>
          </div>
        )

      case 'tarefas_pendentes':
        // Handled in header
        return null

      case 'tags':
        // TODO: render tags/segmentos when available on oportunidade
        return null

      default:
        return null
    }
  }

  // Filtrar campos que não retornam null (exceto tarefas_pendentes que vai no header)
  const camposRenderizados = camposVisiveis
    .filter(key => key !== 'tarefas_pendentes')
    .map(renderCampo)
    .filter(Boolean)

  const handleAcaoRapida = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    if (!oportunidade.contato) return

    switch (key) {
      case 'telefone':
        if (oportunidade.contato.telefone) {
          window.open(`tel:${oportunidade.contato.telefone}`, '_blank')
        }
        break
      case 'whatsapp':
        if (oportunidade.contato.telefone) {
          const phone = oportunidade.contato.telefone.replace(/\D/g, '')
          window.open(`https://wa.me/${phone}`, '_blank')
        }
        break
      case 'email':
        if (oportunidade.contato.email) {
          window.open(`mailto:${oportunidade.contato.email}`, '_blank')
        }
        break
      case 'agendar':
        // TODO: open scheduling modal
        break
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, oportunidade)}
      onClick={() => onClick(oportunidade)}
      className="
        bg-card border border-border rounded-lg shadow-sm
        hover:shadow-md cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none overflow-hidden
      "
    >
      <div className="px-3 pt-3 pb-2">
        {/* Título + Badge qualificação na mesma linha */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-tight truncate">
              {oportunidade.titulo}
            </p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${qualificacao.className}`}>
              {qualificacao.label}
            </span>
          </div>

          {/* Tarefas badge no header */}
          {camposVisiveis.includes('tarefas_pendentes') && tarefasTotal > 0 && (
            <div className="flex-shrink-0 ml-1.5">
              <TarefasPopover
                oportunidadeId={oportunidade.id}
                totalPendentes={tarefasPendentes}
                totalTarefas={tarefasTotal}
                totalConcluidas={tarefasConcluidas}
              />
            </div>
          )}
        </div>

        {/* Campos dinâmicos */}
        {camposRenderizados.length > 0 && (
          <div className="space-y-1.5">
            {camposRenderizados}
          </div>
        )}
      </div>

      {/* Footer: Tempo + Ações rápidas */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{tempoNaEtapa}</span>
        </div>

        {acoesRapidas.length > 0 && (
          <div className="flex items-center gap-0.5">
            {acoesRapidas.map((key) => {
              const acao = ACOES_ICONS[key]
              if (!acao) return null
              const Icon = acao.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => handleAcaoRapida(e, key)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/50 text-muted-foreground transition-colors"
                  title={acao.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
