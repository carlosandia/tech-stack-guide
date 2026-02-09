/**
 * AIDEV-NOTE: Modal de criação de formulário
 * Conforme Design System - seção 10.5 Modal/Dialog
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { criarFormularioSchema, type CriarFormularioInput, TipoFormularioOptions } from '../schemas/formulario.schema'
import { useCriarFormulario } from '../hooks/useFormularios'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoFormularioModal({ open, onOpenChange }: Props) {
  const criarMutation = useCriarFormulario()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CriarFormularioInput>({
    resolver: zodResolver(criarFormularioSchema),
    defaultValues: { nome: '', tipo: 'inline', descricao: '' },
  })

  const tipoAtual = watch('tipo')

  const onSubmit = async (data: CriarFormularioInput) => {
    await criarMutation.mutateAsync(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col w-[calc(100%-32px)] sm:w-auto max-w-lg max-h-[calc(100dvh-32px)] sm:max-h-[85vh] m-4 sm:m-auto p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Formulário</DialogTitle>
              <DialogDescription>Crie um novo formulário para capturar leads</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Formulário de contato"
                {...register('nome')}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Tipo <span className="text-destructive">*</span>
              </Label>
              <select
                value={tipoAtual}
                onChange={(e) => setValue('tipo', e.target.value as CriarFormularioInput['tipo'])}
                className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {TipoFormularioOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição opcional do formulário"
                rows={3}
                {...register('descricao')}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criarMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              {criarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Formulário'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
