/**
 * AIDEV-NOTE: Schemas Zod para o modulo de Tarefas (PRD-10)
 * Define schemas para listagem, metricas e conclusao de tarefas
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusTarefaEnum = z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada'])
export type StatusTarefa = z.infer<typeof StatusTarefaEnum>

export const PrioridadeTarefaEnum = z.enum(['baixa', 'media', 'alta', 'urgente'])
export type PrioridadeTarefa = z.infer<typeof PrioridadeTarefaEnum>

export const TipoTarefaEnum = z.enum(['ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro'])
export type TipoTarefa = z.infer<typeof TipoTarefaEnum>

// =====================================================
// Schema Base da Tarefa
// =====================================================

export const TarefaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid().nullable(),
  contato_id: z.string().uuid().nullable(),
  titulo: z.string().min(1).max(255),
  descricao: z.string().nullable(),
  tipo: TipoTarefaEnum,
  canal: z.string().max(50).nullable(),
  owner_id: z.string().uuid(),
  criado_por_id: z.string().uuid(),
  data_vencimento: z.string().datetime().nullable(),
  data_conclusao: z.string().datetime().nullable(),
  status: StatusTarefaEnum,
  prioridade: PrioridadeTarefaEnum.nullable(),
  lembrete_em: z.string().datetime().nullable(),
  lembrete_enviado: z.boolean().nullable(),
  tarefa_template_id: z.string().uuid().nullable(),
  etapa_origem_id: z.string().uuid().nullable(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable(),
})

export type Tarefa = z.infer<typeof TarefaSchema>

// =====================================================
// Schema com dados da Oportunidade (para listagem)
// =====================================================

export const OportunidadeResumoSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().nullable().optional(),
  titulo: z.string().nullable().optional(),
  funil_id: z.string().uuid().nullable().optional(),
  etapa_id: z.string().uuid().nullable().optional(),
  funis: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }).nullable().optional(),
  etapas_funil: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }).nullable().optional(),
})

export type OportunidadeResumo = z.infer<typeof OportunidadeResumoSchema>

export const UsuarioResumoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email().optional(),
})

export type UsuarioResumo = z.infer<typeof UsuarioResumoSchema>

export const TarefaComDetalhesSchema = TarefaSchema.extend({
  oportunidades: OportunidadeResumoSchema.nullable().optional(),
  owner: UsuarioResumoSchema.nullable().optional(),
  criado_por: UsuarioResumoSchema.nullable().optional(),
})

export type TarefaComDetalhes = z.infer<typeof TarefaComDetalhesSchema>

// =====================================================
// Query Params para Listagem
// =====================================================

export const ListarTarefasQuerySchema = z.object({
  // Filtros
  pipeline_id: z.string().uuid().optional(),
  etapa_id: z.string().uuid().optional(),
  status: z.union([
    StatusTarefaEnum,
    z.array(StatusTarefaEnum),
    z.string().transform(val => val.split(',') as StatusTarefa[]),
  ]).optional(),
  prioridade: z.union([
    PrioridadeTarefaEnum,
    z.array(PrioridadeTarefaEnum),
    z.string().transform(val => val.split(',') as PrioridadeTarefa[]),
  ]).optional(),
  owner_id: z.string().uuid().optional(), // APENAS ADMIN pode usar
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  busca: z.string().max(255).optional(),

  // Paginacao
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Ordenacao
  order_by: z.enum(['data_vencimento', 'criado_em', 'prioridade', 'status']).default('data_vencimento'),
  order_dir: z.enum(['asc', 'desc']).default('asc'),
})

export type ListarTarefasQuery = z.infer<typeof ListarTarefasQuerySchema>

// =====================================================
// Response de Listagem
// =====================================================

export const PaginacaoSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
})

export type Paginacao = z.infer<typeof PaginacaoSchema>

export const ListarTarefasResponseSchema = z.object({
  data: z.array(TarefaComDetalhesSchema),
  pagination: PaginacaoSchema,
})

export type ListarTarefasResponse = z.infer<typeof ListarTarefasResponseSchema>

// =====================================================
// Metricas
// =====================================================

export const TarefasMetricasFiltrosSchema = z.object({
  pipeline_id: z.string().uuid().optional(),
  etapa_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(), // APENAS ADMIN pode usar
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
})

export type TarefasMetricasFiltros = z.infer<typeof TarefasMetricasFiltrosSchema>

export const TarefasMetricasSchema = z.object({
  em_aberto: z.number().int().nonnegative(),
  atrasadas: z.number().int().nonnegative(),
  concluidas: z.number().int().nonnegative(),
  tempo_medio_dias: z.number().nonnegative().nullable(),
})

export type TarefasMetricas = z.infer<typeof TarefasMetricasSchema>

// =====================================================
// Concluir Tarefa
// =====================================================

export const ConcluirTarefaBodySchema = z.object({
  observacao: z.string().max(1000).optional(),
})

export type ConcluirTarefaBody = z.infer<typeof ConcluirTarefaBodySchema>

export const ConcluirTarefaResponseSchema = z.object({
  success: z.boolean(),
  tarefa: TarefaSchema,
})

export type ConcluirTarefaResponse = z.infer<typeof ConcluirTarefaResponseSchema>

// =====================================================
// Criar Tarefa (para uso interno - PRD-07)
// =====================================================

export const CriarTarefaSchema = z.object({
  oportunidade_id: z.string().uuid().optional(),
  contato_id: z.string().uuid().optional(),
  titulo: z.string().min(1).max(255),
  descricao: z.string().optional(),
  tipo: TipoTarefaEnum,
  canal: z.string().max(50).optional(),
  owner_id: z.string().uuid(),
  data_vencimento: z.string().datetime().optional(),
  prioridade: PrioridadeTarefaEnum.default('media'),
  lembrete_em: z.string().datetime().optional(),
  tarefa_template_id: z.string().uuid().optional(),
  etapa_origem_id: z.string().uuid().optional(),
})

export type CriarTarefa = z.infer<typeof CriarTarefaSchema>

// =====================================================
// Atualizar Tarefa (para uso interno)
// =====================================================

export const AtualizarTarefaSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  tipo: TipoTarefaEnum.optional(),
  canal: z.string().max(50).optional(),
  owner_id: z.string().uuid().optional(),
  data_vencimento: z.string().datetime().optional(),
  status: StatusTarefaEnum.optional(),
  prioridade: PrioridadeTarefaEnum.optional(),
  lembrete_em: z.string().datetime().nullable().optional(),
})

export type AtualizarTarefa = z.infer<typeof AtualizarTarefaSchema>
