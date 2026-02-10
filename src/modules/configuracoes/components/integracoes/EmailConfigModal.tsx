/**
 * AIDEV-NOTE: Modal de configuração avançada Email
 * Status, tipo de conexão, email configurado
 * Conforme Design System 10.5 - ModalBase
 */

import { Mail, CheckCircle2 } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import type { Integracao, PlataformaIntegracao } from '../../services/configuracoes.api'

interface Props {
  integracao: Integracao
  onClose: () => void
  onDesconectar: (plataforma: PlataformaIntegracao, id: string) => void
}

export function EmailConfigModal({ integracao, onClose, onDesconectar }: Props) {
  const handleDesconectar = () => {
    onDesconectar('email', integracao.id)
    onClose()
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Configurações de Email"
      description="Envio de emails pelo CRM"
      icon={Mail}
      variant="edit"
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={handleDesconectar}
            className="text-xs font-medium px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            Desconectar
          </button>
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
        {/* Status */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Status da Conexão</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
                <CheckCircle2 className="w-3 h-3" />
                Conectado
              </span>
            </div>
            {integracao.email && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-xs text-foreground">{integracao.email}</span>
              </div>
            )}
            {integracao.tipo_email && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tipo</span>
                <span className="text-xs text-foreground font-medium">
                  {integracao.tipo_email === 'gmail_oauth' ? 'Gmail OAuth' : 'SMTP Manual'}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conectado em</span>
              <span className="text-xs text-foreground">{formatDate(integracao.conectado_em)}</span>
            </div>
            {integracao.ultimo_sync && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Último sync</span>
                <span className="text-xs text-foreground">{formatDate(integracao.ultimo_sync)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalBase>
  )
}
