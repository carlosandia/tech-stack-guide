import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, DollarSign } from 'lucide-react'
import { GerarComissoesSchema, type GerarComissoesData } from '../schemas/parceiro.schema'
import { useGerarComissoes } from '../hooks/useParceiros'

interface Props {
  isOpen: boolean
  onClose: () => void
  parceiroId: string
  nomeEmpresa: string
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

/**
 * AIDEV-NOTE: ComissaoMesModal — seleciona mes/ano e gera comissoes do parceiro
 * Idempotente: comissoes ja existentes sao ignoradas silenciosamente
 */
export function ComissaoMesModal({ isOpen, onClose, parceiroId, nomeEmpresa }: Props) {
  const agora = new Date()
  const gerarComissoes = useGerarComissoes()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GerarComissoesData>({
    resolver: zodResolver(GerarComissoesSchema),
    defaultValues: {
      periodo_mes: agora.getMonth() + 1,
      periodo_ano: agora.getFullYear(),
      parceiro_id: parceiroId,
    },
  })

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      reset({
        periodo_mes: agora.getMonth() + 1,
        periodo_ano: agora.getFullYear(),
        parceiro_id: parceiroId,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parceiroId])

  // Fechar ao pressionar Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const onSubmit = (data: GerarComissoesData) => {
    gerarComissoes.mutate(
      { ...data, parceiro_id: parceiroId },
      { onSuccess: () => onClose() },
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Gerar Comissões</h2>
              <p className="text-xs text-muted-foreground">{nomeEmpresa}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Comissões já geradas para este período serão ignoradas automaticamente.
            </p>

            {/* Mês */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Mês <span className="text-destructive">*</span>
              </label>
              <select
                {...register('periodo_mes', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.periodo_mes && (
                <p className="text-xs text-destructive">{errors.periodo_mes.message}</p>
              )}
            </div>

            {/* Ano */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Ano <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2099}
                {...register('periodo_ano', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
              {errors.periodo_ano && (
                <p className="text-xs text-destructive">{errors.periodo_ano.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={gerarComissoes.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gerarComissoes.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Gerar Comissões
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
