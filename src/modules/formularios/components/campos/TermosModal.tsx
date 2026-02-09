/**
 * AIDEV-NOTE: Modal para visualizar texto dos termos de uso
 * Usado no campo checkbox_termos
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  texto: string
  trigger: React.ReactNode
}

export function TermosModal({ texto, trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Termos de Uso</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {texto || 'Nenhum texto de termos configurado.'}
        </div>
      </DialogContent>
    </Dialog>
  )
}
