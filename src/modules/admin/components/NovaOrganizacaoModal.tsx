import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Building2, Check, Loader2 } from 'lucide-react'
import { useCreateOrganizacao } from '../hooks/useOrganizacoes'
import {
  CriarOrganizacaoSchema,
  type CriarOrganizacaoData,
} from '../schemas/organizacao.schema'
import { Step1Empresa } from './wizard/Step1Empresa'
import { Step2Expectativas } from './wizard/Step2Expectativas'
import { Step3Admin } from './wizard/Step3Admin'

/**
 * AIDEV-NOTE: Modal Wizard para criar nova Organizacao
 * Conforme PRD-14 - RF-002
 *
 * 3 etapas:
 * 1. Dados da Empresa
 * 2. Expectativas
 * 3. Dados do Admin
 */

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const STEPS = [
  { id: 1, label: 'Empresa', fields: ['nome', 'segmento', 'email', 'website', 'telefone', 'endereco'] },
  { id: 2, label: 'Expectativas', fields: ['numero_usuarios', 'volume_leads_mes', 'principal_objetivo', 'como_conheceu', 'observacoes'] },
  { id: 3, label: 'Admin', fields: ['admin_nome', 'admin_sobrenome', 'admin_email', 'admin_telefone', 'enviar_convite', 'senha_inicial'] },
] as const

export function NovaOrganizacaoModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const { mutate: criarOrganizacao, isPending } = useCreateOrganizacao()

  const methods = useForm<CriarOrganizacaoData>({
    resolver: zodResolver(CriarOrganizacaoSchema),
    defaultValues: {
      nome: '',
      segmento: '',
      email: '',
      website: '',
      telefone: '',
      numero_usuarios: '',
      volume_leads_mes: '',
      principal_objetivo: '',
      como_conheceu: '',
      observacoes: '',
      admin_nome: '',
      admin_sobrenome: '',
      admin_email: '',
      admin_telefone: '',
      enviar_convite: true,
      senha_inicial: '',
    },
    mode: 'onBlur',
  })

  const { handleSubmit, trigger, reset } = methods

  const handleClose = () => {
    reset()
    setCurrentStep(1)
    onClose()
  }

  const handleNext = async () => {
    // Validar campos da etapa atual
    const fieldsToValidate = [...STEPS[currentStep - 1].fields] as (keyof CriarOrganizacaoData)[]

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = (data: CriarOrganizacaoData) => {
    criarOrganizacao(
      {
        nome: data.nome,
        segmento: data.segmento,
        email: data.email,
        website: data.website || undefined,
        telefone: data.telefone || undefined,
        endereco: data.endereco,
        numero_usuarios: data.numero_usuarios,
        volume_leads_mes: data.volume_leads_mes,
        principal_objetivo: data.principal_objetivo,
        como_conheceu: data.como_conheceu || undefined,
        observacoes: data.observacoes || undefined,
        admin_nome: data.admin_nome,
        admin_sobrenome: data.admin_sobrenome,
        admin_email: data.admin_email,
        admin_telefone: data.admin_telefone || undefined,
        enviar_convite: data.enviar_convite,
        senha_inicial: data.senha_inicial || undefined,
      },
      {
        onSuccess: () => {
          handleClose()
          onSuccess?.()
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Criar nova empresa</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-center gap-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep > step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                {/* Step Label */}
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {/* Connector */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 hidden sm:block ${
                      currentStep > step.id ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1">
              {currentStep === 1 && <Step1Empresa />}
              {currentStep === 2 && <Step2Expectativas />}
              {currentStep === 3 && <Step3Admin />}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 h-11 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 h-11 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
                  >
                    Voltar
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 h-11 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Proximo
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 h-11 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? 'Criando...' : 'Criar Empresa'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
