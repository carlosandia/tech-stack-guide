/**
 * AIDEV-NOTE: Modal de configuração avançada do WhatsApp
 * Move WhatsAppPipelineConfig para dentro de um modal
 * Conforme Design System 10.5 - ModalBase
 */

import { Phone, User } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { WhatsAppPipelineConfig } from './WhatsAppPipelineConfig'
import { ContatosBloqueadosSection } from './ContatosBloqueadosSection'
import type { Integracao } from '../../services/configuracoes.api'

interface Props {
  integracao: Integracao
  onClose: () => void
}

export function WhatsAppConfigModal({ integracao, onClose }: Props) {
  return (
    <ModalBase
      onClose={onClose}
      title="Configurações WhatsApp"
      description="Gerencie sessão e automações"
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
        {/* Info da sessão */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Dados da Sessão</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            {integracao.waha_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.waha_phone}</span>
              </div>
            )}
            {integracao.waha_session_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.waha_session_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Config */}
        {integracao.waha_session_id && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Automação de Pipeline</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <WhatsAppPipelineConfig sessaoId={integracao.waha_session_id} />
            </div>
          </div>
        )}

        {/* Contatos Bloqueados */}
        <ContatosBloqueadosSection />
      </div>
    </ModalBase>
  )
}
