/**
 * AIDEV-NOTE: Card individual do Kanban — renderiza campos dinamicamente
 * baseado na configuração salva em /configuracoes/cards.
 * Badge de qualificação (Lead/MQL/SQL) na mesma linha do título.
 * Ações rápidas: WhatsApp abre modal de conversa, Email abre compose modal.
 */

import { useState, useEffect, forwardRef } from 'react'
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
  Tag,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { Oportunidade } from '../../services/negocios.api'
import { AgendaQuickPopover } from './AgendaQuickPopover'
import { TarefasPopover } from './TarefasPopover'
import { WhatsAppConversaModal } from './WhatsAppConversaModal'
import { ComposeEmailModal } from '@/modules/emails/components/ComposeEmailModal'
import { LigacaoModal } from '../modals/LigacaoModal'
import { useEnviarEmail, useSalvarRascunho } from '@/modules/emails/hooks/useEmails'
import { format } from 'date-fns'

// =====================================================
// Types
// =====================================================

export interface CardConfig {
  camposVisiveis: string[]
  acoesRapidas: string[]
}

export interface SlaConfig {
  sla_ativo: boolean
  sla_tempo_minutos: number
}

interface KanbanCardProps {
  oportunidade: Oportunidade
  onDragStart: (e: React.DragEvent, oportunidade: Oportunidade) => void
  onClick: (oportunidade: Oportunidade) => void
  onAgendar?: (oportunidade: Oportunidade) => void
  config?: CardConfig
  slaConfig?: SlaConfig
  etapaTipo?: string
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
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

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(function KanbanCard({ oportunidade, onDragStart, onClick, onAgendar, config, slaConfig, etapaTipo, isSelected, onToggleSelect }, _ref) {
  const { camposVisiveis, acoesRapidas } = config || DEFAULT_CONFIG
  const qualificacao = getQualificacaoLabel(oportunidade)
  const tarefasPendentes = (oportunidade as any)._tarefas_pendentes ?? 0
  const tarefasTotal = (oportunidade as any)._tarefas_total ?? 0
  const tarefasConcluidas = tarefasTotal - tarefasPendentes

  // Modal states
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailResetKey, setEmailResetKey] = useState(0)
  const [ligacaoOpen, setLigacaoOpen] = useState(false)

  const enviarEmail = useEnviarEmail()
  const salvarRascunho = useSalvarRascunho()

  // AIDEV-NOTE: Countdown reativo de SLA (RF-06) — só exibe na etapa de entrada
  const slaAtivo = slaConfig?.sla_ativo && slaConfig.sla_tempo_minutos > 0 && etapaTipo === 'entrada'
  const [agora, setAgora] = useState(Date.now())

  useEffect(() => {
    if (!slaAtivo) return
    const interval = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [slaAtivo])

  const tempoDecorridoSeg = Math.floor((agora - new Date(oportunidade.atualizado_em).getTime()) / 1000)
  const tempoTotalSeg = slaAtivo ? slaConfig!.sla_tempo_minutos * 60 : 0
  const tempoRestanteSeg = Math.max(0, tempoTotalSeg - tempoDecorridoSeg)
  const slaPorcentagem = slaAtivo ? tempoDecorridoSeg / tempoTotalSeg : 0
  const slaStatus = !slaAtivo ? 'normal' : slaPorcentagem >= 1 ? 'estourado' : slaPorcentagem >= 0.8 ? 'aviso' : 'normal'
  const slaColorClass = slaStatus === 'estourado' ? 'text-destructive' : slaStatus === 'aviso' ? 'text-yellow-500' : 'text-muted-foreground'

  const minRestantes = Math.floor(tempoRestanteSeg / 60)
  const segRestantes = tempoRestanteSeg % 60
  const countdownText = tempoRestanteSeg > 0
    ? `${String(minRestantes).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`
    : 'Estourado'

  // Tempo desde a criação — formato curto (3min, 1h, 2d)
  const tempoCriacao = (() => {
    const diffMs = Date.now() - new Date(oportunidade.criado_em).getTime()
    const diffSeg = Math.floor(diffMs / 1000)
    if (diffSeg < 60) return `há ${diffSeg}seg`
    const diffMin = Math.floor(diffSeg / 60)
    if (diffMin < 60) return `há ${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `há ${diffH}h`
    const diffD = Math.floor(diffH / 24)
    return `há ${diffD}d`
  })()

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
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {oportunidade.responsavel.avatar_url ? (
                  <img src={oportunidade.responsavel.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-medium text-primary">
                    {oportunidade.responsavel.nome[0]?.toUpperCase()}{oportunidade.responsavel.sobrenome?.[0]?.toUpperCase() || ''}
                  </span>
                )}
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
        return null

      case 'tags': {
        const segmentos = (oportunidade as any)._segmentos as Array<{ id: string; nome: string; cor: string }> | undefined
        if (!segmentos || segmentos.length === 0) return null
        return (
          <div key={key} className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {segmentos.map(seg => (
              <span
                key={seg.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${seg.cor}15`,
                  borderColor: `${seg.cor}40`,
                  color: seg.cor,
                }}
              >
                {seg.nome}
              </span>
            ))}
          </div>
        )
      }

      default:
        return null
    }
  }

  const camposRenderizados = camposVisiveis
    .filter(key => key !== 'tarefas_pendentes')
    .map(renderCampo)
    .filter(Boolean)

  const contatoNome = getContatoNome(oportunidade)

  const handleAcaoRapida = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    if (!oportunidade.contato) return

    switch (key) {
      case 'telefone':
        if (oportunidade.contato.telefone) {
          setLigacaoOpen(true)
        }
        break
      case 'whatsapp':
        if (oportunidade.contato.telefone) {
          setWhatsappOpen(true)
        }
        break
      case 'email':
        if (oportunidade.contato.email) {
          setEmailResetKey(k => k + 1)
          setEmailOpen(true)
        }
        break
      case 'agendar':
        if (onAgendar) onAgendar(oportunidade)
        break
    }
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, oportunidade)}
        onClick={(e) => {
          if (onToggleSelect && e.ctrlKey) {
            e.stopPropagation()
            onToggleSelect(oportunidade.id)
            return
          }
          onClick(oportunidade)
        }}
        className={`
          group/card bg-card rounded-lg shadow-sm
          hover:shadow-md cursor-grab active:cursor-grabbing
          transition-all duration-200 select-none overflow-hidden
          ${isSelected ? 'border border-primary ring-1 ring-primary/40' : 'border-0'}
        `}
      >
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-0 min-w-0 flex-1">
              {onToggleSelect && (
                <div
                  className={`flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out ${
                    isSelected
                      ? 'w-5 opacity-100 mr-1.5'
                      : 'w-0 opacity-0 group-hover/card:w-5 group-hover/card:opacity-100 group-hover/card:mr-1.5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      onToggleSelect(oportunidade.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                  />
                </div>
              )}
              {camposVisiveis.includes('titulo') && (
                <p className="text-sm font-medium text-foreground leading-tight truncate">
                  {oportunidade.titulo}
                </p>
              )}
              {camposVisiveis.includes('qualificacao') && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ml-1.5 ${qualificacao.className}`}>
                  {qualificacao.label}
                </span>
              )}
            </div>

            {camposVisiveis.includes('tarefas_pendentes') && (
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

          {camposRenderizados.length > 0 && (
            <div className="space-y-1.5">
              {camposRenderizados}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-muted/30">
          <div className={`flex items-center gap-1 text-[10px] ${slaColorClass} min-w-0`}>
            <Clock className={`w-2.5 h-2.5 flex-shrink-0 ${slaStatus === 'estourado' ? 'animate-pulse' : ''}`} />
            <span className="truncate">
              {slaAtivo ? `${countdownText} · ${tempoCriacao}` : tempoCriacao}
            </span>
          </div>

          {acoesRapidas.length > 0 && (
            <div className="flex items-center gap-0" onDragStart={(e) => e.stopPropagation()} draggable={false}>
              {acoesRapidas.map((key) => {
                const acao = ACOES_ICONS[key]
                if (!acao) return null
                const Icon = acao.icon

                // Ícone de agendar usa o AgendaQuickPopover
                if (key === 'agendar') {
                  return (
                    <AgendaQuickPopover
                      key={key}
                      oportunidadeId={oportunidade.id}
                      oportunidadeTitulo={oportunidade.titulo}
                    >
                      <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={acao.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    </AgendaQuickPopover>
                  )
                }

                return (
                  <button
                    key={key}
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleAcaoRapida(e, key)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
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

      {/* WhatsApp Conversa Modal */}
      {whatsappOpen && oportunidade.contato?.telefone && (
        <WhatsAppConversaModal
          isOpen={whatsappOpen}
          onClose={() => setWhatsappOpen(false)}
          contatoId={oportunidade.contato_id}
          contatoNome={contatoNome}
          telefone={oportunidade.contato.telefone}
        />
      )}

      {/* Email Compose Modal */}
      <ComposeEmailModal
        mode="novo"
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        onSend={(data) => {
          enviarEmail.mutate(data, {
            onSuccess: () => setEmailOpen(false),
          })
        }}
        onSaveDraft={(data) => {
          salvarRascunho.mutate(data, {
            onSuccess: () => setEmailOpen(false),
          })
        }}
        isSending={enviarEmail.isPending}
        isSavingDraft={salvarRascunho.isPending}
        defaults={{
          para_email: oportunidade.contato?.email || '',
        }}
        resetKey={emailResetKey}
      />

      {/* Ligação Modal */}
      {ligacaoOpen && oportunidade.contato?.telefone && (
        <LigacaoModal
          telefone={oportunidade.contato.telefone}
          contatoNome={contatoNome}
          oportunidadeId={oportunidade.id}
          onClose={() => setLigacaoOpen(false)}
        />
      )}
    </>
  )
})
KanbanCard.displayName = 'KanbanCard'
