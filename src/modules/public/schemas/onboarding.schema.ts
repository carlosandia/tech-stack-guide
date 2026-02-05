 import { z } from 'zod'
 
 /**
  * AIDEV-NOTE: Schema de validação para o formulário de onboarding
  * Conforme PRD - Fluxo de Onboarding Pós-Checkout
  */
 
 export const SEGMENTOS_ONBOARDING = [
   { value: 'software', label: 'Software/Tecnologia' },
   { value: 'servicos', label: 'Serviços' },
   { value: 'varejo', label: 'Varejo' },
   { value: 'industria', label: 'Indústria' },
   { value: 'saude', label: 'Saúde' },
   { value: 'educacao', label: 'Educação' },
   { value: 'financeiro', label: 'Financeiro' },
   { value: 'imobiliario', label: 'Imobiliário' },
   { value: 'consultoria', label: 'Consultoria' },
   { value: 'marketing', label: 'Marketing/Agência' },
   { value: 'outro', label: 'Outro' },
 ] as const
 
 export const OnboardingSchema = z.object({
   nome_empresa: z
     .string()
     .min(2, 'Nome da empresa deve ter no mínimo 2 caracteres')
     .max(255, 'Nome da empresa deve ter no máximo 255 caracteres'),
   segmento: z.string().optional(),
   admin_nome: z
     .string()
     .min(2, 'Nome deve ter no mínimo 2 caracteres')
     .max(100, 'Nome deve ter no máximo 100 caracteres'),
   admin_sobrenome: z
     .string()
     .min(2, 'Sobrenome deve ter no mínimo 2 caracteres')
     .max(100, 'Sobrenome deve ter no máximo 100 caracteres'),
   admin_email: z
     .string()
     .email('Email inválido')
     .max(255, 'Email deve ter no máximo 255 caracteres'),
   admin_telefone: z
     .string()
     .min(10, 'Telefone deve ter no mínimo 10 dígitos')
     .max(20, 'Telefone deve ter no máximo 20 caracteres'),
   senha: z
     .string()
     .min(8, 'Senha deve ter no mínimo 8 caracteres')
     .max(128, 'Senha deve ter no máximo 128 caracteres'),
 })
 
 export type OnboardingData = z.infer<typeof OnboardingSchema>