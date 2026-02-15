/**
 * AIDEV-NOTE: Modal de configuração do Google Calendar
 * Conforme PRD-08 - Conexões com Plataformas Externas
 * Exibe dados da conexão e permite selecionar calendário
 */

import { useState } from 'react'
import { Calendar, Mail, User, RefreshCw, Loader2 } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useSincronizarIntegracao } from '../../hooks/useIntegracoes'
import type { Integracao, PlataformaIntegracao } from '../../services/configuracoes.api'

interface Props {
  integracao: Integracao
  onClose: () => void
  onDesconectar: (plataforma: PlataformaIntegracao, id: string) => void
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GoogleCalendarConfigModal({ integracao, onClose, onDesconectar }: Props) {
  const [confirmDesconectar, setConfirmDesconectar] = useState(false)
  const sincronizar = useSincronizarIntegracao()

  return (
    <ModalBase
      onClose={onClose}
      title="Configurações Google Calendar"
      description="Gerencie sua conexão com o Google Calendar"
      icon={Calendar}
      variant="edit"
      size="md"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Dados da Conta */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Conta Conectada</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            {integracao.google_user_email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.google_user_email}</span>
              </div>
            )}
            {integracao.google_user_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.google_user_name}</span>
              </div>
            )}
            {integracao.calendar_name && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.calendar_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sincronização */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Sincronização</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conectado em</span>
              <span className="text-xs text-foreground">{formatDate(integracao.conectado_em)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Último sync</span>
              <span className="text-xs text-foreground">{formatDate(integracao.ultimo_sync)}</span>
            </div>
            {integracao.ultimo_erro && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-destructive">{integracao.ultimo_erro}</p>
              </div>
            )}
            <button
              onClick={() => sincronizar.mutate(integracao.id)}
              disabled={sincronizar.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50 mt-1"
            >
              {sincronizar.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Sincronizar agora
            </button>
          </div>
        </div>

        {/* Desconectar */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Zona de perigo</h4>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Desconectar removerá a integração com o Google Calendar. Você poderá reconectar a qualquer momento.
            </p>
            {confirmDesconectar ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onDesconectar('google', integracao.id)
                    onClose()
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Confirmar desconexão
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
                className="text-xs font-medium px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              >
                Desconectar Google Calendar
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalBase>
  )
}
