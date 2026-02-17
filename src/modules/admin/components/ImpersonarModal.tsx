/**
 * AIDEV-NOTE: Modal de confirmação para Impersonação
 * Conforme plano PRD-14 - Exige motivo obrigatório (min 5 chars)
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgNome: string
  loading: boolean
  onConfirm: (motivo: string) => void
}

export function ImpersonarModal({ open, onOpenChange, orgNome, loading, onConfirm }: Props) {
  const [motivo, setMotivo] = useState('')
  const isValid = motivo.trim().length >= 5

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(motivo.trim())
  }

  const handleClose = (value: boolean) => {
    if (!value) setMotivo('')
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impersonar Organização</DialogTitle>
          <DialogDescription>
            Você será autenticado como o administrador de <strong>{orgNome}</strong>.
            Esta ação será registrada no audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-sm font-medium text-foreground" htmlFor="motivo">
            Motivo da impersonação *
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Suporte técnico - cliente reportou erro no funil"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            rows={3}
            disabled={loading}
          />
          {motivo.length > 0 && motivo.trim().length < 5 && (
            <p className="text-xs text-destructive">Mínimo de 5 caracteres</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => handleClose(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Gerando acesso...' : 'Confirmar Impersonação'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
