/**
 * AIDEV-NOTE: Modal para rejeitar pré-oportunidade (RF-11)
 * Motivo é opcional. Switch para bloquear futuras criações de card.
 */

import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { PreOportunidadeCard } from '../../services/pre-oportunidades.api'
import { useRejeitarPreOportunidade } from '../../hooks/usePreOportunidades'
import { toast } from 'sonner'

interface RejeitarPreOportunidadeModalProps {
  preOp: PreOportunidadeCard
  onClose: () => void
}

export function RejeitarPreOportunidadeModal({ preOp, onClose }: RejeitarPreOportunidadeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const rejeitar = useRejeitarPreOportunidade()
  const [motivo, setMotivo] = useState('')
  const [bloquear, setBloquear] = useState(false)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleRejeitar = async () => {
    try {
      await rejeitar.mutateAsync({
        preOpId: preOp.id,
        motivo: motivo.trim() || undefined,
        bloquear,
        phoneNumber: preOp.phone_number,
        phoneName: preOp.phone_name || undefined,
      })
      toast.success('Solicitação rejeitada')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao rejeitar')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-16px)] sm:max-w-md animate-enter"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Rejeitar Solicitação</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Rejeitando solicitação de <strong className="text-foreground">{preOp.phone_name || preOp.phone_number}</strong>.
            </p>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Motivo da rejeição <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md border border-border">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Não criar mais cards dessa pessoa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bloqueia futuras solicitações deste número. Pode ser revertido em Configurações &gt; Conexões.
                </p>
              </div>
              <Switch checked={bloquear} onCheckedChange={setBloquear} />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRejeitar}
              disabled={rejeitar.isPending}
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {rejeitar.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Rejeitar'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
