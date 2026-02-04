/**
 * AIDEV-NOTE: Schemas Zod para Documentos de Oportunidades
 * Conforme PRD-07 - Modal de Detalhes
 *
 * Documentos sao arquivos anexados a oportunidades.
 * Upload via Supabase Storage, referencia salva no banco.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoDocumentoEnum = z.enum([
  'proposta',
  'contrato',
  'apresentacao',
  'orcamento',
  'outros',
])
export type TipoDocumento = z.infer<typeof TipoDocumentoEnum>

// =====================================================
// Schema do Documento
// =====================================================

export const DocumentoOportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  nome: z.string().max(255),
  tipo: TipoDocumentoEnum,
  mime_type: z.string().max(100),
  tamanho_bytes: z.number().int().nonnegative(),
  storage_path: z.string(), // Path no Supabase Storage
  url_publica: z.string().url().nullable().optional(), // URL temporaria se necessario
  criado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type DocumentoOportunidade = z.infer<typeof DocumentoOportunidadeSchema>

// =====================================================
// Schemas de Request - Upload Documento
// =====================================================

export const UploadDocumentoSchema = z.object({
  nome: z.string().min(1).max(255),
  tipo: TipoDocumentoEnum.default('outros'),
  // Arquivo enviado via multipart/form-data
})

export type UploadDocumentoPayload = z.infer<typeof UploadDocumentoSchema>

// =====================================================
// Schemas de Request - Renomear Documento
// =====================================================

export const RenomearDocumentoSchema = z.object({
  nome: z.string().min(1).max(255),
})

export type RenomearDocumentoPayload = z.infer<typeof RenomearDocumentoSchema>

// =====================================================
// Schemas de Request - Alterar Tipo
// =====================================================

export const AlterarTipoDocumentoSchema = z.object({
  tipo: TipoDocumentoEnum,
})

export type AlterarTipoDocumentoPayload = z.infer<typeof AlterarTipoDocumentoSchema>

// =====================================================
// Response Types
// =====================================================

export const DocumentoComUsuarioSchema = DocumentoOportunidadeSchema.extend({
  usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }),
})

export type DocumentoComUsuario = z.infer<typeof DocumentoComUsuarioSchema>

export const ListaDocumentosResponseSchema = z.object({
  documentos: z.array(DocumentoComUsuarioSchema),
  total: z.number(),
  tamanho_total_bytes: z.number(),
})

export type ListaDocumentosResponse = z.infer<typeof ListaDocumentosResponseSchema>

// =====================================================
// MIME Types Permitidos
// =====================================================

export const MIME_TYPES_PERMITIDOS = [
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Imagens
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Texto
  'text/plain',
  'text/csv',
] as const

export type MimeTypePermitido = (typeof MIME_TYPES_PERMITIDOS)[number]

// Tamanho maximo: 10MB
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024
