import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas Zod para o Wizard de Nova Organizacao
 * Conforme PRD-14 - RF-002
 */

// Opcoes padrao para selects
export const SEGMENTOS = [
  { value: 'software', label: 'Software/Tecnologia' },
  { value: 'servicos', label: 'Servicos' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'industria', label: 'Industria' },
  { value: 'saude', label: 'Saude' },
  { value: 'educacao', label: 'Educacao' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'imobiliario', label: 'Imobiliario' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'marketing', label: 'Marketing/Agencia' },
  { value: 'outro', label: 'Outro' },
] as const

export const NUMERO_USUARIOS = [
  { value: '1-5', label: '1 a 5 usuarios' },
  { value: '6-15', label: '6 a 15 usuarios' },
  { value: '16-50', label: '16 a 50 usuarios' },
  { value: '51-100', label: '51 a 100 usuarios' },
  { value: '100+', label: 'Mais de 100 usuarios' },
] as const

export const VOLUME_LEADS = [
  { value: '1-50', label: '1 a 50 leads/mes' },
  { value: '51-200', label: '51 a 200 leads/mes' },
  { value: '201-500', label: '201 a 500 leads/mes' },
  { value: '501-1000', label: '501 a 1000 leads/mes' },
  { value: '1000+', label: 'Mais de 1000 leads/mes' },
] as const

export const OBJETIVOS = [
  { value: 'aumentar_vendas', label: 'Aumentar vendas' },
  { value: 'organizar_pipeline', label: 'Organizar pipeline' },
  { value: 'melhorar_atendimento', label: 'Melhorar atendimento' },
  { value: 'escalar_operacao', label: 'Escalar operacao' },
  { value: 'centralizar_comunicacao', label: 'Centralizar comunicacao' },
  { value: 'outro', label: 'Outro' },
] as const

export const COMO_CONHECEU = [
  { value: 'google', label: 'Google' },
  { value: 'indicacao', label: 'Indicacao' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
] as const

// Schema Etapa 1: Dados da Empresa
export const Step1EmpresaSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter no minimo 2 caracteres')
    .max(255, 'Nome deve ter no maximo 255 caracteres'),
  segmento: z.string().min(1, 'Selecione um segmento'),
   segmento_outro: z.string().optional(),
   email: z.string().email('Email invalido').optional().or(z.literal('')),
  website: z
    .string()
    .url('URL invalida')
    .optional()
    .or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z
    .object({
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
    })
    .optional(),
 }).refine(
   (data) => {
     // Se segmento for "outro", segmento_outro é obrigatório
     if (data.segmento === 'outro') {
       return data.segmento_outro && data.segmento_outro.trim().length >= 2
     }
     return true
   },
   {
     message: 'Especifique o segmento (mínimo 2 caracteres)',
     path: ['segmento_outro'],
   }
 )

export type Step1EmpresaData = z.infer<typeof Step1EmpresaSchema>

// Schema Etapa 2: Expectativas
export const Step2ExpectativasSchema = z.object({
  numero_usuarios: z.string().min(1, 'Selecione o numero de usuarios'),
  volume_leads_mes: z.string().min(1, 'Selecione o volume de leads'),
  principal_objetivo: z.string().min(1, 'Selecione o principal objetivo'),
  como_conheceu: z.string().optional(),
  observacoes: z.string().max(1000, 'Observacoes devem ter no maximo 1000 caracteres').optional(),
})

export type Step2ExpectativasData = z.infer<typeof Step2ExpectativasSchema>

// Schema Etapa 3: Dados do Administrador
export const Step3AdminSchema = z
  .object({
    admin_nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
    admin_sobrenome: z.string().min(2, 'Sobrenome deve ter no minimo 2 caracteres'),
    admin_email: z.string().email('Email invalido'),
    admin_telefone: z.string().optional(),
    enviar_convite: z.boolean().default(true),
    senha_inicial: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se nao enviar convite, senha e obrigatoria
      if (!data.enviar_convite) {
        return data.senha_inicial && data.senha_inicial.length >= 8
      }
      return true
    },
    {
      message: 'Senha deve ter no minimo 8 caracteres',
      path: ['senha_inicial'],
    }
  )

export type Step3AdminData = z.infer<typeof Step3AdminSchema>

// Schema combinado para submissao
 // Usando innerType para acessar o schema base antes do refine
 const Step1EmpresaBaseSchema = z.object({
   nome: z
     .string()
     .min(2, 'Nome deve ter no minimo 2 caracteres')
     .max(255, 'Nome deve ter no maximo 255 caracteres'),
   segmento: z.string().min(1, 'Selecione um segmento'),
   segmento_outro: z.string().optional(),
   email: z.string().email('Email invalido').optional().or(z.literal('')),
   website: z
     .string()
     .url('URL invalida')
     .optional()
     .or(z.literal('')),
   telefone: z.string().optional(),
   endereco: z
     .object({
       cep: z.string().optional(),
       logradouro: z.string().optional(),
       numero: z.string().optional(),
       complemento: z.string().optional(),
       bairro: z.string().optional(),
       cidade: z.string().optional(),
       estado: z.string().optional(),
     })
     .optional(),
 })
 
 export const CriarOrganizacaoSchema = Step1EmpresaBaseSchema.merge(Step2ExpectativasSchema).merge(
  z.object({
    admin_nome: z.string().min(2),
    admin_sobrenome: z.string().min(2),
    admin_email: z.string().email(),
    admin_telefone: z.string().optional(),
    enviar_convite: z.boolean().default(true),
    senha_inicial: z.string().optional(),
  })
 ).refine(
   (data) => {
     // Se segmento for "outro", segmento_outro é obrigatório
     if (data.segmento === 'outro') {
       return data.segmento_outro && data.segmento_outro.trim().length >= 2
     }
     return true
   },
   {
     message: 'Especifique o segmento (mínimo 2 caracteres)',
     path: ['segmento_outro'],
   }
 )

export type CriarOrganizacaoData = z.infer<typeof CriarOrganizacaoSchema>
