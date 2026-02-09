/**
 * AIDEV-NOTE: Schemas Zod para Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoFormularioSchema = z.enum(['padrao', 'popup_saida', 'newsletter', 'multi_etapas'])
export type TipoFormulario = z.infer<typeof TipoFormularioSchema>

export const StatusFormularioSchema = z.enum(['rascunho', 'publicado', 'arquivado'])
export type StatusFormulario = z.infer<typeof StatusFormularioSchema>

export const TipoCampoSchema = z.enum([
  'texto', 'email', 'telefone', 'numero', 'textarea', 'select', 'multi_select',
  'checkbox', 'radio', 'data', 'arquivo', 'oculto', 'cpf', 'cnpj', 'cep', 'url',
])
export type TipoCampo = z.infer<typeof TipoCampoSchema>

export const LarguraCampoSchema = z.enum(['full', 'half', 'third'])
export type LarguraCampo = z.infer<typeof LarguraCampoSchema>

export const OperadorCondicionalSchema = z.enum([
  'igual', 'diferente', 'contem', 'nao_contem', 'maior', 'menor', 'vazio', 'nao_vazio',
])

export const CaptchaTipoSchema = z.enum(['recaptcha_v2', 'recaptcha_v3', 'hcaptcha'])

export const TipoLinkSchema = z.enum(['link', 'embed', 'qrcode'])

export const StatusSubmissaoSchema = z.enum(['nova', 'processada', 'erro', 'spam'])

// =====================================================
// FORMULARIO - Schema principal
// =====================================================

export const FormularioSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  slug: z.string(),
  tipo: TipoFormularioSchema,
  funil_id: z.string().uuid().nullable().optional(),
  etapa_id: z.string().uuid().nullable().optional(),
  status: StatusFormularioSchema,
  publicado_em: z.string().nullable().optional(),
  despublicado_em: z.string().nullable().optional(),
  titulo_pagina: z.string().nullable().optional(),
  mensagem_sucesso: z.string().nullable().optional(),
  url_redirecionamento: z.string().nullable().optional(),
  redirecionar_apos_envio: z.boolean(),
  captcha_ativo: z.boolean(),
  captcha_tipo: CaptchaTipoSchema.nullable().optional(),
  captcha_site_key: z.string().nullable().optional(),
  honeypot_ativo: z.boolean(),
  rate_limit_ativo: z.boolean(),
  rate_limit_max: z.number(),
  rate_limit_janela_minutos: z.number(),
  notificar_email: z.boolean(),
  emails_notificacao: z.array(z.string()).nullable().optional(),
  meta_titulo: z.string().nullable().optional(),
  meta_descricao: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  total_visualizacoes: z.number(),
  total_submissoes: z.number(),
  taxa_conversao: z.number(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable().optional(),
})

export type Formulario = z.infer<typeof FormularioSchema>

// =====================================================
// Criar Formulario
// =====================================================

export const CriarFormularioSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens').optional(),
  tipo: TipoFormularioSchema.optional().default('padrao'),
  funil_id: z.string().uuid().optional(),
  etapa_id: z.string().uuid().optional(),
  titulo_pagina: z.string().max(255).optional(),
  mensagem_sucesso: z.string().optional(),
  url_redirecionamento: z.string().url().optional(),
  redirecionar_apos_envio: z.boolean().optional(),
  captcha_ativo: z.boolean().optional(),
  captcha_tipo: CaptchaTipoSchema.optional(),
  captcha_site_key: z.string().optional(),
  honeypot_ativo: z.boolean().optional(),
  rate_limit_ativo: z.boolean().optional(),
  rate_limit_max: z.number().int().min(1).max(1000).optional(),
  rate_limit_janela_minutos: z.number().int().min(1).max(60).optional(),
  notificar_email: z.boolean().optional(),
  emails_notificacao: z.array(z.string().email()).optional(),
  meta_titulo: z.string().max(255).optional(),
  meta_descricao: z.string().optional(),
  og_image_url: z.string().url().optional(),
})

export type CriarFormularioPayload = z.infer<typeof CriarFormularioSchema>

// =====================================================
// Atualizar Formulario
// =====================================================

export const AtualizarFormularioSchema = CriarFormularioSchema.partial()

export type AtualizarFormularioPayload = z.infer<typeof AtualizarFormularioSchema>

// =====================================================
// Listar Formularios (query)
// =====================================================

export const ListarFormulariosQuerySchema = z.object({
  status: StatusFormularioSchema.optional(),
  tipo: TipoFormularioSchema.optional(),
  busca: z.string().max(255).optional(),
  funil_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarFormulariosQuery = z.infer<typeof ListarFormulariosQuerySchema>

// =====================================================
// CAMPOS DO FORMULARIO
// =====================================================

export const CampoFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  nome: z.string(),
  label: z.string(),
  placeholder: z.string().nullable().optional(),
  texto_ajuda: z.string().nullable().optional(),
  tipo: TipoCampoSchema,
  obrigatorio: z.boolean(),
  validacoes: z.any().optional(),
  opcoes: z.any().optional(),
  mapeamento_campo: z.string().nullable().optional(),
  largura: LarguraCampoSchema,
  ordem: z.number(),
  condicional_ativo: z.boolean(),
  condicional_campo_id: z.string().uuid().nullable().optional(),
  condicional_operador: z.string().nullable().optional(),
  condicional_valor: z.string().nullable().optional(),
  etapa_numero: z.number().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type CampoFormulario = z.infer<typeof CampoFormularioSchema>

export const CriarCampoSchema = z.object({
  nome: z.string().min(1).max(255),
  label: z.string().min(1).max(255),
  placeholder: z.string().max(255).optional(),
  texto_ajuda: z.string().optional(),
  tipo: TipoCampoSchema.optional().default('texto'),
  obrigatorio: z.boolean().optional().default(false),
  validacoes: z.record(z.any()).optional(),
  opcoes: z.array(z.object({
    label: z.string(),
    valor: z.string(),
  })).optional(),
  mapeamento_campo: z.string().max(100).optional(),
  largura: LarguraCampoSchema.optional().default('full'),
  ordem: z.number().int().optional(),
  condicional_ativo: z.boolean().optional(),
  condicional_campo_id: z.string().uuid().optional(),
  condicional_operador: OperadorCondicionalSchema.optional(),
  condicional_valor: z.string().optional(),
  etapa_numero: z.number().int().min(1).optional(),
})

export type CriarCampoPayload = z.infer<typeof CriarCampoSchema>

export const AtualizarCampoSchema = CriarCampoSchema.partial()
export type AtualizarCampoPayload = z.infer<typeof AtualizarCampoSchema>

export const ReordenarCamposSchema = z.object({
  campos: z.array(z.object({
    id: z.string().uuid(),
    ordem: z.number().int().min(0),
  })),
})

export type ReordenarCamposPayload = z.infer<typeof ReordenarCamposSchema>

// =====================================================
// ESTILOS DO FORMULARIO
// =====================================================

export const EstiloFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  container: z.any(),
  cabecalho: z.any(),
  campos: z.any(),
  botao: z.any(),
  pagina: z.any(),
  css_customizado: z.string().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type EstiloFormulario = z.infer<typeof EstiloFormularioSchema>

export const AtualizarEstiloSchema = z.object({
  container: z.record(z.any()).optional(),
  cabecalho: z.record(z.any()).optional(),
  campos: z.record(z.any()).optional(),
  botao: z.record(z.any()).optional(),
  pagina: z.record(z.any()).optional(),
  css_customizado: z.string().nullable().optional(),
})

export type AtualizarEstiloPayload = z.infer<typeof AtualizarEstiloSchema>

// =====================================================
// SUBMISSOES
// =====================================================

export const SubmissaoFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  dados: z.any(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  pagina_origem: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  geo_pais: z.string().nullable().optional(),
  geo_estado: z.string().nullable().optional(),
  geo_cidade: z.string().nullable().optional(),
  lead_score: z.number().nullable().optional(),
  contato_id: z.string().uuid().nullable().optional(),
  oportunidade_id: z.string().uuid().nullable().optional(),
  status: StatusSubmissaoSchema,
  erro_mensagem: z.string().nullable().optional(),
  honeypot_preenchido: z.boolean(),
  captcha_validado: z.boolean().nullable().optional(),
  criado_em: z.string(),
})

export type SubmissaoFormulario = z.infer<typeof SubmissaoFormularioSchema>

export const SubmeterFormularioPublicoSchema = z.object({
  dados: z.record(z.any()),
  honeypot: z.string().optional(),
  captcha_token: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  pagina_origem: z.string().optional(),
  referrer: z.string().optional(),
})

export type SubmeterFormularioPublicoPayload = z.infer<typeof SubmeterFormularioPublicoSchema>

export const ListarSubmissoesQuerySchema = z.object({
  status: StatusSubmissaoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarSubmissoesQuery = z.infer<typeof ListarSubmissoesQuerySchema>

// =====================================================
// LINKS DE COMPARTILHAMENTO
// =====================================================

export const LinkCompartilhamentoSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  tipo: TipoLinkSchema,
  url_completa: z.string(),
  codigo_embed: z.string().nullable().optional(),
  qrcode_data: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  ativo: z.boolean(),
  total_cliques: z.number(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type LinkCompartilhamento = z.infer<typeof LinkCompartilhamentoSchema>

export const CriarLinkCompartilhamentoSchema = z.object({
  tipo: TipoLinkSchema.optional().default('link'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
})

export type CriarLinkCompartilhamentoPayload = z.infer<typeof CriarLinkCompartilhamentoSchema>
