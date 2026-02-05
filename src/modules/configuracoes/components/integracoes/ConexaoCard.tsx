/**
 * AIDEV-NOTE: Card de conexão OAuth por plataforma
 * Conforme PRD-05 - Conexões com Plataformas Externas
 */

import { useState } from 'react'
import {
  MessageCircle,
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
} from 'lucide-react'
import type { Integracao, PlataformaIntegracao } from '../../services/configuracoes.api'

interface ConexaoCardProps {
  plataforma: PlataformaIntegracao
  integracao?: Integracao
  onConectar: (plataforma: PlataformaIntegracao) => void
  onDesconectar: (id: string) => void
  onSincronizar: (id: string) => void
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
    descricao: 'Integração via WAHA para envio e recebimento de mensagens',
    icon: MessageCircle,
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
    nome: 'Email SMTP',
    descricao: 'Envio de emails diretamente pelo CRM',
    icon: Mail,
    cor: 'text-amber-600',
    bgCor: 'bg-amber-50',
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

export function ConexaoCard({
  plataforma,
  integracao,
  onConectar,
  onDesconectar,
  onSincronizar,
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

          {/* Detalhes quando conectado */}
          {conectado && integracao && (
            <div className="space-y-1 mb-3">
              {(integracao.conta_externa_nome || integracao.conta_externa_email || integracao.waha_phone) && (
                <p className="text-xs text-foreground">
                  <span className="text-muted-foreground">Conta: </span>
                  {integracao.conta_externa_nome || integracao.conta_externa_email || integracao.waha_phone}
                </p>
              )}
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Último sync: </span>
                {formatDate(integracao.ultimo_sync)}
              </p>
              {integracao.ultimo_erro && (
                <p className="text-xs text-destructive truncate">
                  <span className="text-muted-foreground">Erro: </span>
                  {integracao.ultimo_erro}
                </p>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2">
            {conectado && integracao ? (
              <>
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
                        onDesconectar(integracao.id)
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
