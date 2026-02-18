import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TermosConteudo } from './TermosConteudo'

/**
 * AIDEV-NOTE: Dialog inline com conteúdo completo dos Termos de Serviço
 * Usa o mesmo componente TermosConteudo da página /termos — sempre sincronizado.
 */

interface TermosResumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermosResumoDialog({ open, onOpenChange }: TermosResumoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Termos de Serviço
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
          <TermosConteudo />
        </div>
      </DialogContent>
    </Dialog>
  )
}
