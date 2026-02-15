/**
 * AIDEV-NOTE: Coluna "Solicitações" do Kanban (RF-11)
 * Exibe pré-oportunidades pendentes vindas do WhatsApp
 * Posicionada antes das colunas de etapas
 */

import { useState, forwardRef } from 'react'
import { Inbox, Loader2 } from 'lucide-react'
import { usePreOportunidadesPendentes } from '../../hooks/usePreOportunidades'
import { SolicitacaoCard } from './SolicitacaoCard'
import { AceitarPreOportunidadeModal } from '../modals/AceitarPreOportunidadeModal'
import { RejeitarPreOportunidadeModal } from '../modals/RejeitarPreOportunidadeModal'
import { WhatsAppConversaModal } from './WhatsAppConversaModal'
import type { PreOportunidadeCard } from '../../services/pre-oportunidades.api'

interface SolicitacoesColumnProps {
  funilId: string
}

export const SolicitacoesColumn = forwardRef<HTMLDivElement, SolicitacoesColumnProps>(function SolicitacoesColumn({ funilId }, _ref) {
  const { data: preOps, isLoading } = usePreOportunidadesPendentes(funilId)
  const [selectedPreOp, setSelectedPreOp] = useState<PreOportunidadeCard | null>(null)
  const [showRejeitar, setShowRejeitar] = useState<PreOportunidadeCard | null>(null)
  const [whatsAppPreOp, setWhatsAppPreOp] = useState<PreOportunidadeCard | null>(null)

  const total = preOps?.length || 0

  if (total === 0 && !isLoading) return null

  return (
    <>
      <div className="flex flex-col min-w-[288px] w-[288px] bg-transparent rounded-lg">
        {/* Header */}
        <div className="flex-shrink-0 px-3 py-2.5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Inbox className="w-4 h-4 text-warning flex-shrink-0" />
              <h3 className="text-sm font-semibold text-foreground truncate">
                Solicitações
              </h3>
              <span className="flex-shrink-0 text-xs font-medium text-warning-foreground bg-warning-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {total}
              </span>
              <span className="text-[10px] text-muted-foreground">WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            preOps?.map(preOp => (
              <SolicitacaoCard
                key={preOp.id}
                preOp={preOp}
                onClick={setSelectedPreOp}
                onWhatsApp={setWhatsAppPreOp}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedPreOp && (
        <AceitarPreOportunidadeModal
          preOp={selectedPreOp}
          funilId={funilId}
          onClose={() => setSelectedPreOp(null)}
          onRejeitar={() => {
            setShowRejeitar(selectedPreOp)
            setSelectedPreOp(null)
          }}
        />
      )}

      {showRejeitar && (
        <RejeitarPreOportunidadeModal
          preOp={showRejeitar}
          onClose={() => setShowRejeitar(null)}
        />
      )}

      {whatsAppPreOp && (
        <WhatsAppConversaModal
          isOpen
          onClose={() => setWhatsAppPreOp(null)}
          contatoId=""
          contatoNome={whatsAppPreOp.phone_name || whatsAppPreOp.phone_number}
          telefone={whatsAppPreOp.phone_number}
        />
      )}
    </>
  )
})
SolicitacoesColumn.displayName = 'SolicitacoesColumn'
