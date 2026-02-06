/**
 * AIDEV-NOTE: Schemas Zod para formulários de Contatos (frontend)
 * Conforme PRD-06 - Modulo de Contatos
 */

import { z } from 'zod'

export const StatusContatoOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'perdido', label: 'Perdido' },
] as const

export const OrigemContatoOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'importacao', label: 'Importação' },
  { value: 'formulario', label: 'Formulário' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
] as const

export const PorteOptions = [
  { value: 'mei', label: 'MEI' },
  { value: 'micro', label: 'Microempresa' },
  { value: 'pequena', label: 'Pequena empresa' },
  { value: 'media', label: 'Média empresa' },
  { value: 'grande', label: 'Grande empresa' },
] as const

// Schema para formulário de Pessoa
export const PessoaFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  sobrenome: z.string().max(255).optional(),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  telefone: z.string().max(50).optional(),
  cargo: z.string().max(100).optional(),
  empresa_id: z.string().uuid().optional().or(z.literal('')),
  linkedin_url: z.string().url('URL inválida').max(500).optional().or(z.literal('')),
  status: z.enum(['novo', 'lead', 'mql', 'sql', 'cliente', 'perdido']).default('novo'),
  origem: z.enum(['manual', 'importacao', 'formulario', 'whatsapp', 'instagram', 'meta_ads', 'indicacao', 'outro']).default('manual'),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export type PessoaFormData = z.infer<typeof PessoaFormSchema>

// Schema para formulário de Empresa
export const EmpresaFormSchema = z.object({
  razao_social: z.string().min(1, 'Razão social é obrigatória').max(255),
  nome_fantasia: z.string().max(255).optional(),
  cnpj: z.string().max(18).optional(),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  telefone: z.string().max(50).optional(),
  website: z.string().url('URL inválida').max(500).optional().or(z.literal('')),
  segmento: z.string().max(100).optional(),
  porte: z.string().max(50).optional(),
  endereco_cep: z.string().max(10).optional(),
  endereco_logradouro: z.string().max(255).optional(),
  endereco_numero: z.string().max(20).optional(),
  endereco_complemento: z.string().max(100).optional(),
  endereco_bairro: z.string().max(100).optional(),
  endereco_cidade: z.string().max(100).optional(),
  endereco_estado: z.string().max(2).optional(),
  status: z.enum(['novo', 'lead', 'mql', 'sql', 'cliente', 'perdido']).default('novo'),
  origem: z.enum(['manual', 'importacao', 'formulario', 'whatsapp', 'instagram', 'meta_ads', 'indicacao', 'outro']).default('manual'),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export type EmpresaFormData = z.infer<typeof EmpresaFormSchema>

// Schema para Segmento
export const SegmentoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  descricao: z.string().optional(),
})

export type SegmentoFormData = z.infer<typeof SegmentoFormSchema>

// Cores predefinidas para segmentos
export const CORES_SEGMENTOS = [
  '#22C55E', '#3B82F6', '#EAB308', '#A855F7', '#EF4444',
  '#F97316', '#06B6D4', '#EC4899', '#6B7280', '#84CC16',
] as const
