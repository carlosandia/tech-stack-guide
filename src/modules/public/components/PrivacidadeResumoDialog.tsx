import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PrivacidadeConteudo } from './PrivacidadeConteudo'

/**
 * AIDEV-NOTE: Dialog inline com conteúdo completo da Política de Privacidade
 * Usa o mesmo componente PrivacidadeConteudo da página /privacidade — sempre sincronizado.
 */

interface PrivacidadeResumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacidadeResumoDialog({ open, onOpenChange }: PrivacidadeResumoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Política de Privacidade
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
          <PrivacidadeConteudo />
        </div>
      </DialogContent>
    </Dialog>
  )
}
