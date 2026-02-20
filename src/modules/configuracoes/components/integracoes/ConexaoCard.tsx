/**
 * AIDEV-NOTE: Card de conexão OAuth por plataforma
 * Conforme PRD-08 - Conexões com Plataformas Externas
 * Exibe dados específicos por plataforma quando conectado
 * WhatsApp: inclui config de pipeline para pré-oportunidades
 */

import { useState } from 'react'
import {
  Instagram,
  BarChart3,
  Calendar,
  Mail,
  RefreshCw,
  Unlink,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Phone,
  AtSign,
  User,
  Briefcase,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { Integracao, PlataformaIntegracao } from '../../services/configuracoes.api'

interface ConexaoCardProps {
  plataforma: PlataformaIntegracao
  integracao?: Integracao
  onConectar: (plataforma: PlataformaIntegracao) => void
  onDesconectar: (plataforma: PlataformaIntegracao, id: string) => void
  onSincronizar: (id: string) => void
  onConfigurar?: (plataforma: PlataformaIntegracao) => void
  isLoading?: boolean
}

const plataformaConfig: Record<PlataformaIntegracao, {
  nome: string
  descricao: string
  icon: React.ElementType
  cor: string
  bgCor: string
}> = {
  whatsapp: {
    nome: 'WhatsApp',
    descricao: 'Envio e recebimento de mensagens (não oficial)',
    icon: WhatsAppIcon,
    cor: 'text-green-600',
    bgCor: 'bg-green-50',
  },
  instagram: {
    nome: 'Instagram Direct',
    descricao: 'Mensagens do Instagram Direct para conversas no CRM',
    icon: Instagram,
    cor: 'text-pink-600',
    bgCor: 'bg-pink-50',
  },
  meta_ads: {
    nome: 'Meta Ads',
    descricao: 'Captura automática de leads do Facebook e Instagram Ads',
    icon: BarChart3,
    cor: 'text-blue-600',
    bgCor: 'bg-blue-50',
  },
  google: {
    nome: 'Google Calendar',
    descricao: 'Sincronização de agendamentos e reuniões',
    icon: Calendar,
    cor: 'text-red-500',
    bgCor: 'bg-red-50',
  },
  email: {
    nome: 'Email',
    descricao: 'Envio de emails diretamente pelo CRM',
    icon: Mail,
    cor: 'text-amber-600',
    bgCor: 'bg-amber-50',
  },
  api4com: {
    nome: 'API4COM - Telefonia VoIP',
    descricao: 'Ligações telefônicas direto do CRM via WebRTC/SIP',
    icon: Phone,
    cor: 'text-violet-600',
    bgCor: 'bg-violet-50',
  },
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'conectado') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Conectado
      </span>
    )
  }
  if (status === 'erro') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
        <XCircle className="w-3.5 h-3.5" />
        Erro
      </span>
    )
  }
  if (status === 'expirando') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning-foreground))]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Expirando
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
      <XCircle className="w-3.5 h-3.5" />
      Desconectado
    </span>
  )
}

/** Renderiza detalhes específicos por plataforma */
function PlataformaDetails({ integracao }: { integracao: Integracao }) {
  const { plataforma } = integracao

  if (plataforma === 'whatsapp') {
    return (
      <div className="space-y-1">
        {integracao.waha_phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.waha_phone}</p>
          </div>
        )}
        {integracao.waha_session_name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.waha_session_name}</p>
          </div>
        )}
      </div>
    )
  }

  if (plataforma === 'instagram') {
    return (
      <div className="space-y-1">
        {integracao.instagram_username && (
          <div className="flex items-center gap-1.5">
            <AtSign className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">@{integracao.instagram_username}</p>
          </div>
        )}
        {integracao.instagram_name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.instagram_name}</p>
          </div>
        )}
        {integracao.token_expires_at && (
          <p className="text-xs text-muted-foreground">
            Token expira: {formatDate(integracao.token_expires_at)}
          </p>
        )}
      </div>
    )
  }

  if (plataforma === 'google') {
    return (
      <div className="space-y-1">
        {integracao.google_user_email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.google_user_email}</p>
          </div>
        )}
        {integracao.calendar_name && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.calendar_name}</p>
          </div>
        )}
      </div>
    )
  }

  if (plataforma === 'email') {
    return (
      <div className="space-y-1">
        {integracao.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.email}</p>
          </div>
        )}
        {integracao.tipo_email && (
          <p className="text-xs text-muted-foreground">
            Tipo: <span className="font-medium text-foreground">
              {['gmail_oauth', 'gmail'].includes(integracao.tipo_email || '') ? 'Gmail OAuth' : 'SMTP Manual'}
            </span>
          </p>
        )}
      </div>
    )
  }

  if (plataforma === 'meta_ads') {
    return (
      <div className="space-y-1">
        {integracao.meta_user_name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">Usuário: {integracao.meta_user_name}</p>
          </div>
        )}
        {integracao.meta_page_name && (
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">Página: {integracao.meta_page_name}</p>
          </div>
        )}
        {integracao.meta_business_name && (
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">Portfólio: {integracao.meta_business_name}</p>
          </div>
        )}
      </div>
    )
  }

  if (plataforma === 'api4com') {
    return (
      <div className="space-y-1">
        {integracao.conta_externa_nome && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-foreground">{integracao.conta_externa_nome}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}

export function ConexaoCard({
  plataforma,
  integracao,
  onConectar,
  onDesconectar,
  onSincronizar,
  onConfigurar,
  isLoading,
}: ConexaoCardProps) {
  const [confirmDesconectar, setConfirmDesconectar] = useState(false)
  const config = plataformaConfig[plataforma]
  const Icon = config.icon
  const conectado = integracao?.status === 'conectado'

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Ícone da plataforma */}
        <div className={`w-12 h-12 rounded-xl ${config.bgCor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${config.cor}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-sm font-semibold text-foreground">{config.nome}</h3>
            <StatusBadge status={integracao?.status || 'desconectado'} />
          </div>

          <p className="text-xs text-muted-foreground mb-3">{config.descricao}</p>

          {/* Detalhes específicos por plataforma quando conectado (info mínima) */}
          {conectado && integracao && (
            <div className="space-y-2 mb-3">
              <PlataformaDetails integracao={integracao} />
              {plataforma !== 'meta_ads' && (
                <p className="text-xs text-foreground">
                  <span className="text-muted-foreground">Último sync: </span>
                  {formatDate(integracao.ultimo_sync)}
                </p>
              )}
              {integracao.ultimo_erro && (
                <p className="text-xs text-destructive truncate">
                  <span className="text-muted-foreground">Erro: </span>
                  {integracao.ultimo_erro}
                </p>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2">
            {conectado && integracao ? (
              <>
                {/* Botão Configurar */}
                {onConfigurar && (
                  <button
                    onClick={() => onConfigurar(plataforma)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Configurar
                  </button>
                )}

                <button
                  onClick={() => onSincronizar(integracao.id)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sincronizar
                </button>

                {confirmDesconectar ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onDesconectar(plataforma, integracao.id)
                        setConfirmDesconectar(false)
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDesconectar(false)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDesconectar(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Desconectar
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => onConectar(plataforma)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Conectar {config.nome}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
