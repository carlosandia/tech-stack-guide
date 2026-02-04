/**
 * AIDEV-NOTE: Schemas Zod para Importacao de Contatos
 * Conforme PRD-06 RF-008 - Importacao CSV/XLSX
 *
 * Wizard de 4 etapas:
 * 1. Upload do arquivo
 * 2. Mapeamento de colunas
 * 3. Selecao de segmento
 * 4. Resultado da importacao
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoArquivoImportacaoEnum = z.enum(['csv', 'xlsx'])
export type TipoArquivoImportacao = z.infer<typeof TipoArquivoImportacaoEnum>

export const StatusImportacaoEnum = z.enum(['pendente', 'processando', 'concluido', 'erro'])
export type StatusImportacao = z.infer<typeof StatusImportacaoEnum>

// =====================================================
// Schema da Importacao
// =====================================================

export const ImportacaoContatosSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  nome_arquivo: z.string().max(255),
  tipo_arquivo: TipoArquivoImportacaoEnum,
  tamanho_bytes: z.number().int().nonnegative(),
  total_registros: z.number().int().nonnegative(),
  registros_importados: z.number().int().nonnegative().default(0),
  registros_duplicados: z.number().int().nonnegative().default(0),
  registros_erro: z.number().int().nonnegative().default(0),
  mapeamento_campos: z.record(z.string()), // { coluna_arquivo: campo_sistema }
  segmento_id: z.string().uuid().nullable().optional(),
  status: StatusImportacaoEnum.default('pendente'),
  erro_mensagem: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
  concluido_em: z.string().datetime().nullable().optional(),
})

export type ImportacaoContatos = z.infer<typeof ImportacaoContatosSchema>

// =====================================================
// Campos Mapeavaveis (PRD-06)
// =====================================================

export const CAMPOS_PESSOA_MAPEAVAVEIS = [
  'nome',
  'sobrenome',
  'email',
  'telefone',
  'cargo',
  'linkedin_url',
  'observacoes',
] as const

export const CAMPOS_EMPRESA_MAPEAVAVEIS = [
  'razao_social',
  'nome_fantasia',
  'cnpj',
  'email',
  'telefone',
  'website',
  'segmento',
  'porte',
  'endereco_cep',
  'endereco_logradouro',
  'endereco_numero',
  'endereco_complemento',
  'endereco_bairro',
  'endereco_cidade',
  'endereco_estado',
  'observacoes',
] as const

export type CampoPessoaMapeavel = (typeof CAMPOS_PESSOA_MAPEAVAVEIS)[number]
export type CampoEmpresaMapeavel = (typeof CAMPOS_EMPRESA_MAPEAVAVEIS)[number]

// =====================================================
// Schemas de Request - Upload (Etapa 1)
// =====================================================

export const UploadImportacaoSchema = z.object({
  tipo_contato: z.enum(['pessoa', 'empresa']),
  // Arquivo enviado via multipart/form-data
})

export type UploadImportacaoPayload = z.infer<typeof UploadImportacaoSchema>

// =====================================================
// Schemas de Response - Preview (Etapa 2)
// =====================================================

export const ColunaArquivoSchema = z.object({
  nome: z.string(),
  exemplos: z.array(z.string()).max(5), // Primeiras 5 linhas como exemplo
  sugestao_mapeamento: z.string().nullable(), // Campo sugerido pelo sistema
})

export type ColunaArquivo = z.infer<typeof ColunaArquivoSchema>

export const PreviewImportacaoResponseSchema = z.object({
  importacao_id: z.string().uuid(),
  nome_arquivo: z.string(),
  total_linhas: z.number(),
  colunas: z.array(ColunaArquivoSchema),
  preview_dados: z.array(z.record(z.string())).max(10), // Primeiras 10 linhas
})

export type PreviewImportacaoResponse = z.infer<typeof PreviewImportacaoResponseSchema>

// =====================================================
// Schemas de Request - Mapeamento (Etapa 2)
// =====================================================

export const MapeamentoCampoSchema = z.object({
  coluna_arquivo: z.string(),
  campo_sistema: z.string().nullable(), // null = ignorar coluna
})

export type MapeamentoCampo = z.infer<typeof MapeamentoCampoSchema>

export const ConfirmarMapeamentoSchema = z.object({
  mapeamentos: z.array(MapeamentoCampoSchema),
})

export type ConfirmarMapeamentoPayload = z.infer<typeof ConfirmarMapeamentoSchema>

// =====================================================
// Schemas de Request - Segmento (Etapa 3)
// =====================================================

export const SelecionarSegmentoImportacaoSchema = z.object({
  segmento_id: z.string().uuid().nullable(), // null = sem segmento
})

export type SelecionarSegmentoImportacaoPayload = z.infer<typeof SelecionarSegmentoImportacaoSchema>

// =====================================================
// Schemas de Request - Confirmar Importacao
// =====================================================

export const ConfirmarImportacaoSchema = z.object({
  importacao_id: z.string().uuid(),
})

export type ConfirmarImportacaoPayload = z.infer<typeof ConfirmarImportacaoSchema>

// =====================================================
// Response Types
// =====================================================

export const ResultadoImportacaoSchema = z.object({
  importacao_id: z.string().uuid(),
  status: StatusImportacaoEnum,
  total_registros: z.number(),
  registros_importados: z.number(),
  registros_duplicados: z.number(),
  registros_erro: z.number(),
  erros_detalhados: z
    .array(
      z.object({
        linha: z.number(),
        erro: z.string(),
        dados: z.record(z.string()).optional(),
      })
    )
    .optional(),
  duracao_segundos: z.number().optional(),
})

export type ResultadoImportacao = z.infer<typeof ResultadoImportacaoSchema>

export const ListaImportacoesResponseSchema = z.object({
  importacoes: z.array(ImportacaoContatosSchema),
  total: z.number(),
})

export type ListaImportacoesResponse = z.infer<typeof ListaImportacoesResponseSchema>

// =====================================================
// Schema para Exportacao (PRD-06 RF-009)
// =====================================================

export const ExportarContatosQuerySchema = z.object({
  tipo: z.enum(['pessoa', 'empresa']),
  colunas: z.array(z.string()).optional(), // Se vazio, exporta todas
  // Mesmos filtros da listagem
  status: z.string().optional(),
  origem: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  segmento_id: z.string().uuid().optional(),
  busca: z.string().optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
})

export type ExportarContatosQuery = z.infer<typeof ExportarContatosQuerySchema>
