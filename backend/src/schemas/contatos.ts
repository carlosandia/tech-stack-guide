/**
 * AIDEV-NOTE: Schemas Zod para Contatos (Pessoas e Empresas)
 * Conforme PRD-06 - Modulo de Contatos
 *
 * Tipos de contato:
 * - pessoa: Pessoa fisica
 * - empresa: Pessoa juridica
 *
 * Status do contato:
 * - novo, lead, mql, sql, cliente, perdido
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoContatoEnum = z.enum(['pessoa', 'empresa'])
export type TipoContato = z.infer<typeof TipoContatoEnum>

export const StatusContatoEnum = z.enum(['novo', 'lead', 'mql', 'sql', 'cliente', 'perdido'])
export type StatusContato = z.infer<typeof StatusContatoEnum>

export const OrigemContatoEnum = z.enum([
  'manual',
  'importacao',
  'formulario',
  'whatsapp',
  'instagram',
  'meta_ads',
  'indicacao',
  'outro',
])
export type OrigemContato = z.infer<typeof OrigemContatoEnum>

// =====================================================
// Schema Base do Contato (campos comuns)
// =====================================================

export const ContatoBaseSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  tipo: TipoContatoEnum,
  status: StatusContatoEnum.default('novo'),
  origem: OrigemContatoEnum.default('manual'),
  owner_id: z.string().uuid().nullable().optional(),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

// =====================================================
// Schema de Pessoa (Contato tipo pessoa)
// =====================================================

export const PessoaSchema = ContatoBaseSchema.extend({
  tipo: z.literal('pessoa'),
  nome: z.string().min(1).max(255),
  sobrenome: z.string().max(255).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  telefone: z.string().max(50).nullable().optional(),
  cargo: z.string().max(100).nullable().optional(),
  empresa_id: z.string().uuid().nullable().optional(), // Vinculo com empresa
  linkedin_url: z.string().url().max(500).nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

export type Pessoa = z.infer<typeof PessoaSchema>

// =====================================================
// Schema de Empresa (Contato tipo empresa)
// =====================================================

export const EmpresaSchema = ContatoBaseSchema.extend({
  tipo: z.literal('empresa'),
  razao_social: z.string().min(1).max(255),
  nome_fantasia: z.string().max(255).nullable().optional(),
  cnpj: z.string().max(18).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  telefone: z.string().max(50).nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  segmento: z.string().max(100).nullable().optional(),
  porte: z.string().max(50).nullable().optional(),
  endereco_cep: z.string().max(10).nullable().optional(),
  endereco_logradouro: z.string().max(255).nullable().optional(),
  endereco_numero: z.string().max(20).nullable().optional(),
  endereco_complemento: z.string().max(100).nullable().optional(),
  endereco_bairro: z.string().max(100).nullable().optional(),
  endereco_cidade: z.string().max(100).nullable().optional(),
  endereco_estado: z.string().max(2).nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

export type Empresa = z.infer<typeof EmpresaSchema>

// =====================================================
// Union Type para Contato (Pessoa ou Empresa)
// =====================================================

export const ContatoSchema = z.discriminatedUnion('tipo', [PessoaSchema, EmpresaSchema])
export type Contato = z.infer<typeof ContatoSchema>

// =====================================================
// Schemas de Request - Criar Pessoa
// =====================================================

export const CriarPessoaSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  sobrenome: z.string().max(255).optional(),
  email: z.string().email('Email invalido').max(255).optional(),
  telefone: z.string().max(50).optional(),
  cargo: z.string().max(100).optional(),
  empresa_id: z.string().uuid().optional(),
  linkedin_url: z.string().url('URL do LinkedIn invalida').max(500).optional(),
  status: StatusContatoEnum.optional(),
  origem: OrigemContatoEnum.optional(),
  owner_id: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

export type CriarPessoaPayload = z.infer<typeof CriarPessoaSchema>

// =====================================================
// Schemas de Request - Criar Empresa
// =====================================================

export const CriarEmpresaSchema = z.object({
  razao_social: z.string().min(1, 'Razao social e obrigatoria').max(255),
  nome_fantasia: z.string().max(255).optional(),
  cnpj: z
    .string()
    .max(18)
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ invalido (formato: XX.XXX.XXX/XXXX-XX)')
    .optional(),
  email: z.string().email('Email invalido').max(255).optional(),
  telefone: z.string().max(50).optional(),
  website: z.string().url('URL invalida').max(500).optional(),
  segmento: z.string().max(100).optional(),
  porte: z.string().max(50).optional(),
  endereco_cep: z.string().max(10).optional(),
  endereco_logradouro: z.string().max(255).optional(),
  endereco_numero: z.string().max(20).optional(),
  endereco_complemento: z.string().max(100).optional(),
  endereco_bairro: z.string().max(100).optional(),
  endereco_cidade: z.string().max(100).optional(),
  endereco_estado: z.string().max(2).optional(),
  status: StatusContatoEnum.optional(),
  origem: OrigemContatoEnum.optional(),
  owner_id: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

export type CriarEmpresaPayload = z.infer<typeof CriarEmpresaSchema>

// =====================================================
// Schemas de Request - Atualizar Pessoa
// =====================================================

export const AtualizarPessoaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  sobrenome: z.string().max(255).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  telefone: z.string().max(50).nullable().optional(),
  cargo: z.string().max(100).nullable().optional(),
  empresa_id: z.string().uuid().nullable().optional(),
  linkedin_url: z.string().url().max(500).nullable().optional(),
  status: StatusContatoEnum.optional(),
  origem: OrigemContatoEnum.optional(),
  owner_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

export type AtualizarPessoaPayload = z.infer<typeof AtualizarPessoaSchema>

// =====================================================
// Schemas de Request - Atualizar Empresa
// =====================================================

export const AtualizarEmpresaSchema = z.object({
  razao_social: z.string().min(1).max(255).optional(),
  nome_fantasia: z.string().max(255).nullable().optional(),
  cnpj: z.string().max(18).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  telefone: z.string().max(50).nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  segmento: z.string().max(100).nullable().optional(),
  porte: z.string().max(50).nullable().optional(),
  endereco_cep: z.string().max(10).nullable().optional(),
  endereco_logradouro: z.string().max(255).nullable().optional(),
  endereco_numero: z.string().max(20).nullable().optional(),
  endereco_complemento: z.string().max(100).nullable().optional(),
  endereco_bairro: z.string().max(100).nullable().optional(),
  endereco_cidade: z.string().max(100).nullable().optional(),
  endereco_estado: z.string().max(2).nullable().optional(),
  status: StatusContatoEnum.optional(),
  origem: OrigemContatoEnum.optional(),
  owner_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

export type AtualizarEmpresaPayload = z.infer<typeof AtualizarEmpresaSchema>

// =====================================================
// Schemas de Query - Listagem com Filtros
// =====================================================

export const ListarContatosQuerySchema = z.object({
  tipo: TipoContatoEnum.optional(),
  status: StatusContatoEnum.optional(),
  origem: OrigemContatoEnum.optional(),
  owner_id: z.string().uuid().optional(),
  segmento_id: z.string().uuid().optional(),
  empresa_id: z.string().uuid().optional(),
  busca: z.string().max(255).optional(), // Busca por nome, email, telefone
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  // Paginacao cursor-based (PRD-06 RF-015)
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  ordem: z.enum(['asc', 'desc']).default('desc'),
  ordenar_por: z.enum(['criado_em', 'atualizado_em', 'nome', 'razao_social']).default('criado_em'),
})

export type ListarContatosQuery = z.infer<typeof ListarContatosQuerySchema>

// =====================================================
// Schemas para Duplicatas (PRD-06 RF-007)
// =====================================================

export const DuplicataSchema = z.object({
  contato_original_id: z.string().uuid(),
  contato_duplicado_id: z.string().uuid(),
  score_similaridade: z.number().min(0).max(100),
  campos_coincidentes: z.array(z.string()), // ['email', 'telefone', 'nome']
  status: z.enum(['pendente', 'confirmada', 'descartada']).default('pendente'),
  criado_em: z.string().datetime(),
  resolvido_em: z.string().datetime().nullable().optional(),
  resolvido_por: z.string().uuid().nullable().optional(),
})

export type Duplicata = z.infer<typeof DuplicataSchema>

export const MesclarContatosSchema = z.object({
  contato_manter_id: z.string().uuid(),
  contato_mesclar_id: z.string().uuid(),
  campos_mesclar: z.array(z.string()).optional(), // Campos a copiar do contato_mesclar
})

export type MesclarContatosPayload = {
  contato_manter_id: string
  contato_mesclar_id: string
  campos_mesclar?: string[]
}

// =====================================================
// Schemas para Acoes em Massa (PRD-06 RF-016)
// =====================================================

export const DeleteLoteSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um contato')
    .max(100, 'Maximo 100 contatos por vez'),
  tipo: TipoContatoEnum,
})

export type DeleteLotePayload = {
  ids: string[]
  tipo: 'pessoa' | 'empresa'
}

export const AtribuirLoteSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um contato')
    .max(100, 'Maximo 100 contatos por vez'),
  owner_id: z.string().uuid().nullable(), // null para remover atribuicao
})

export type AtribuirLotePayload = {
  ids: string[]
  owner_id: string | null
}

export const SegmentarLoteSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, 'Selecione pelo menos um contato')
    .max(100, 'Maximo 100 contatos por vez'),
  adicionar: z.array(z.string().uuid()).default([]),
  remover: z.array(z.string().uuid()).default([]),
})

export type SegmentarLotePayload = {
  ids: string[]
  adicionar: string[]
  remover: string[]
}

export const ExportarSelecionadosSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um contato'),
  tipo: TipoContatoEnum,
  colunas: z.array(z.string()).min(1, 'Selecione pelo menos uma coluna'),
})

export type ExportarSelecionadosPayload = z.infer<typeof ExportarSelecionadosSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaContatosResponseSchema = z.object({
  contatos: z.array(ContatoSchema),
  total: z.number(),
  cursor_proximo: z.string().uuid().nullable(),
  tem_mais: z.boolean(),
})

export type ListaContatosResponse = z.infer<typeof ListaContatosResponseSchema>

export const PessoaComEmpresaSchema = PessoaSchema.extend({
  empresa: EmpresaSchema.nullable().optional(),
  segmentos: z
    .array(
      z.object({
        id: z.string().uuid(),
        nome: z.string(),
        cor: z.string(),
      })
    )
    .optional(),
  total_oportunidades: z.number().optional(),
})

export type PessoaComEmpresa = z.infer<typeof PessoaComEmpresaSchema>

export const EmpresaComPessoasSchema = EmpresaSchema.extend({
  pessoas: z.array(PessoaSchema).optional(),
  total_pessoas: z.number().optional(),
  total_oportunidades: z.number().optional(),
})

export type EmpresaComPessoas = z.infer<typeof EmpresaComPessoasSchema>

// =====================================================
// Schema para vinculo pessoa-empresa
// =====================================================

export const VincularPessoaEmpresaSchema = z.object({
  pessoa_id: z.string().uuid(),
  empresa_id: z.string().uuid().nullable(), // null para desvincular
})

export type VincularPessoaEmpresaPayload = z.infer<typeof VincularPessoaEmpresaSchema>
