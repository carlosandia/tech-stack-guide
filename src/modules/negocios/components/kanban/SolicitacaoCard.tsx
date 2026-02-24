/**
 * AIDEV-NOTE: Card de Pré-Oportunidade (RF-11)
 * Exibe dados do WhatsApp lead na coluna Solicitações
 * Inclui ícone WhatsApp para abrir conversa inline
 */

import React, { useState } from 'react'
import { Clock, User, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { PreOportunidadeCard } from '../../services/pre-oportunidades.api'
import { getValidWhatsAppUrl } from '@/shared/utils/whatsapp-url'

interface SolicitacaoCardProps {
  preOp: PreOportunidadeCard
  onClick: (preOp: PreOportunidadeCard) => void
  onWhatsApp?: (preOp: PreOportunidadeCard) => void
}

function formatTempoEspera(minutos: number): string {
  if (minutos < 60) return `${minutos}min`
  if (minutos < 1440) return `${Math.round(minutos / 60)}h`
  return `${Math.round(minutos / 1440)}d`
}

function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const parte1 = cleaned.slice(4, 9)
    const parte2 = cleaned.slice(9)
    return `(${ddd}) ${parte1}-${parte2}`
  }
  return phone
}

export const SolicitacaoCard = React.forwardRef<HTMLDivElement, SolicitacaoCardProps>(
  ({ preOp, onClick, onWhatsApp }, ref) => {
  const isUrgente = preOp.tempo_espera_minutos > 60
  const [fotoError, setFotoError] = useState(false)
  const fotoUrlValida = getValidWhatsAppUrl(preOp.profile_picture_url)

  return (
    <div
      ref={ref}
      className="w-full text-left bg-card rounded-lg shadow-sm p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick(preOp)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(preOp) }}
    >
      {/* Header: Nome/Telefone */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {fotoUrlValida && !fotoError ? (
            <img src={fotoUrlValida} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" onError={() => setFotoError(true)} />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-foreground truncate text-left">
              {preOp.phone_name || formatPhoneDisplay(preOp.phone_number)}
            </p>
            {preOp.phone_name && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Phone className="w-2.5 h-2.5" />
                {formatPhoneDisplay(preOp.phone_number)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview da mensagem */}
      {preOp.ultima_mensagem && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {preOp.ultima_mensagem}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWhatsApp?.(preOp) }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#25D366] transition-colors"
          title="Ver conversa WhatsApp"
        >
          <WhatsAppIcon size={12} className="flex-shrink-0" />
          <span>{preOp.total_mensagens} msg</span>
        </button>
        <div className={`flex items-center gap-1 text-[10px] font-medium ${isUrgente ? 'text-destructive' : 'text-muted-foreground'}`}>
          <Clock className="w-3 h-3" />
          <span>{formatTempoEspera(preOp.tempo_espera_minutos)}</span>
        </div>
      </div>
    </div>
  )
})

SolicitacaoCard.displayName = 'SolicitacaoCard'
