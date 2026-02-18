import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SEGMENTOS } from '@/modules/admin/schemas/organizacao.schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TermosResumoDialog } from './TermosResumoDialog'
import { PrivacidadeResumoDialog } from './PrivacidadeResumoDialog'

/**
 * AIDEV-NOTE: Modal de pré-cadastro (captura de leads pre-checkout)
 * Coleta dados do prospect antes de redirecionar ao Stripe Checkout.
 * Salva na tabela pre_cadastros_saas via INSERT anon.
 * Inclui aceite obrigatório de Termos e Política de Privacidade (conformidade jurídica).
 */

const PreCadastroSchema = z.object({
  nome_contato: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  email: z.string().email('Email inválido').max(255),
  telefone: z.string().min(1, 'Telefone é obrigatório').max(20),
  nome_empresa: z.string().min(2, 'Nome da empresa deve ter no mínimo 2 caracteres').max(255),
  segmento: z.string().min(1, 'Selecione um segmento'),
  aceite_termos: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar os termos para continuar' }),
  }),
})

type PreCadastroData = z.infer<typeof PreCadastroSchema>

interface PreCadastroModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planoId: string
  planoNome: string
  periodo: 'mensal' | 'anual'
  isTrial: boolean
  utms: Record<string, string>
  onCheckout: (preCadastroId: string) => void
}

export function PreCadastroModal({
  open,
  onOpenChange,
  planoId,
  planoNome,
  periodo,
  isTrial,
  utms,
  onCheckout,
}: PreCadastroModalProps) {
  const [loading, setLoading] = useState(false)
  const [termosOpen, setTermosOpen] = useState(false)
  const [privacidadeOpen, setPrivacidadeOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PreCadastroData>({
    resolver: zodResolver(PreCadastroSchema),
    defaultValues: {
      aceite_termos: undefined as unknown as true,
    },
  })

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const onSubmit = async (data: PreCadastroData) => {
    setLoading(true)
    try {
      const { data: preCadastro, error } = await supabase
        .from('pre_cadastros_saas')
        .insert([{
          nome_contato: data.nome_contato.trim(),
          email: data.email.trim().toLowerCase(),
          telefone: data.telefone?.trim() || null,
          nome_empresa: data.nome_empresa.trim(),
          segmento: data.segmento,
          plano_id: planoId,
          periodo,
          is_trial: isTrial,
          status: 'pendente',
          utms,
          aceite_termos: true,
          aceite_termos_em: new Date().toISOString(),
        }])
        .select('id')
        .single()

      if (error) throw error

      reset()
      onCheckout(preCadastro.id)
    } catch (err) {
      console.error('Erro ao salvar pré-cadastro:', err)
      alert('Erro ao processar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {isTrial ? 'Iniciar teste grátis' : `Assinar ${planoNome}`}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isTrial
                ? 'Preencha seus dados para começar o período de teste.'
                : 'Preencha seus dados para continuar com a assinatura.'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Nome */}
            <div>
              <Label htmlFor="nome_contato">Nome completo *</Label>
              <Input
                id="nome_contato"
                placeholder="Seu nome completo"
                {...register('nome_contato')}
                className="mt-1.5"
              />
              {errors.nome_contato && (
                <p className="text-xs text-destructive mt-1">{errors.nome_contato.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className="mt-1.5"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="telefone">Telefone <span className="text-destructive">*</span></Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                {...register('telefone')}
                onChange={(e) => {
                  e.target.value = formatTelefone(e.target.value)
                }}
                className="mt-1.5"
              />
            </div>

            {/* Nome Empresa */}
            <div>
              <Label htmlFor="nome_empresa">Nome da empresa *</Label>
              <Input
                id="nome_empresa"
                placeholder="Nome da sua empresa"
                {...register('nome_empresa')}
                className="mt-1.5"
              />
              {errors.nome_empresa && (
                <p className="text-xs text-destructive mt-1">{errors.nome_empresa.message}</p>
              )}
            </div>

            {/* Segmento */}
            <div>
              <Label htmlFor="segmento">Qual o segmento da sua empresa? *</Label>
              <select
                id="segmento"
                {...register('segmento')}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione um segmento</option>
                {SEGMENTOS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label}
                  </option>
                ))}
              </select>
              {errors.segmento && (
                <p className="text-xs text-destructive mt-1">{errors.segmento.message}</p>
              )}
            </div>

            {/* Aceite de Termos */}
            <div className="pt-1">
              <Controller
                name="aceite_termos"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Li e aceito os{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setTermosOpen(true) }}
                        className="text-primary hover:underline font-medium"
                      >
                        Termos de Serviço
                      </button>
                      {' '}e a{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setPrivacidadeOpen(true) }}
                        className="text-primary hover:underline font-medium"
                      >
                        Política de Privacidade
                      </button>
                    </span>
                  </label>
                )}
              />
              {errors.aceite_termos && (
                <p className="text-xs text-destructive mt-1">{errors.aceite_termos.message}</p>
              )}
            </div>

            {/* Botão Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : isTrial ? (
                  'Iniciar teste grátis'
                ) : (
                  'Continuar para o pagamento'
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modais inline de Termos e Privacidade */}
      <TermosResumoDialog open={termosOpen} onOpenChange={setTermosOpen} />
      <PrivacidadeResumoDialog open={privacidadeOpen} onOpenChange={setPrivacidadeOpen} />
    </>
  )
}
