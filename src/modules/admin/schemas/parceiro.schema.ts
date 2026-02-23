import { z } from 'zod'

// AIDEV-NOTE: Todos os tipos deste arquivo sao derivados via z.infer — NUNCA criar tipos manuais

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS DE ENTIDADE (espelham o banco de dados)
// ─────────────────────────────────────────────────────────────────────────────

// AIDEV-NOTE: ParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const ParceiroSchema = z.object({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  codigo_indicacao: z.string(),
  status: z.enum(['ativo', 'suspenso', 'inativo']),
  percentual_comissao: z.number().min(0).max(100).nullable(),
  aderiu_em: z.string().datetime(),
  suspenso_em: z.string().datetime().nullable(),
  motivo_suspensao: z.string().nullable(),
  gratuidade_aplicada_em: z.string().datetime().nullable(),
  gratuidade_valida_ate: z.string().datetime().nullable(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  // Joins opcionais retornados por consultas enriquecidas
  organizacao: z
    .object({
      nome: z.string(),
      email: z.string().nullable(),
      plano: z.string().nullable(),
      status: z.string(),
    })
    .optional(),
  usuario: z
    .object({
      nome: z.string(),
      sobrenome: z.string().nullable(),
      email: z.string(),
    })
    .optional(),
  total_indicados_ativos: z.number().optional(),
  total_comissoes_geradas: z.number().optional(),
})

// AIDEV-NOTE: IndicacaoParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const IndicacaoParceiroSchema = z.object({
  id: z.string().uuid(),
  parceiro_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  percentual_comissao_snapshot: z.number(),
  origem: z.enum(['link', 'codigo_manual', 'pre_cadastro']),
  status: z.enum(['ativa', 'inativa', 'cancelada']),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  // Join opcional
  organizacao: z
    .object({
      nome: z.string(),
      plano: z.string().nullable(),
      status: z.string(),
      criado_em: z.string().datetime(),
    })
    .optional(),
})

// AIDEV-NOTE: ComissaoParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const ComissaoParceiroSchema = z.object({
  id: z.string().uuid(),
  parceiro_id: z.string().uuid(),
  indicacao_id: z.string().uuid(),
  periodo_mes: z.number().int().min(1).max(12),
  periodo_ano: z.number().int(),
  valor_assinatura: z.number(),
  percentual_aplicado: z.number(),
  valor_comissao: z.number(),
  status: z.enum(['pendente', 'pago', 'cancelado']),
  pago_em: z.string().datetime().nullable(),
  observacoes: z.string().nullable(),
  criado_em: z.string().datetime(),
  // Join opcional para exibir nome da org indicada na listagem
  indicacao: z
    .object({
      organizacao_id: z.string().uuid(),
      organizacao: z
        .object({
          nome: z.string(),
        })
        .optional(),
    })
    .optional(),
})

// AIDEV-NOTE: ConfigProgramaParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const ConfigProgramaParceiroSchema = z.object({
  id: z.string().uuid(),
  percentual_padrao: z.number().min(0).max(100),
  regras_gratuidade: z.object({
    ativo: z.boolean(),
    meta_inicial_indicados: z.number().int().positive().optional(),
    renovacao_periodo_meses: z.number().int().positive().optional(),
    renovacao_meta_indicados: z.number().int().positive().optional(),
    carencia_dias: z.number().int().positive().optional(),
  }),
  base_url_indicacao: z.string().url().nullable(),
  observacoes: z.string().nullable(),
})

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS DE INPUT (formulários e operações)
// ─────────────────────────────────────────────────────────────────────────────

// AIDEV-NOTE: CriarParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const CriarParceiroSchema = z.object({
  organizacao_id: z.string().uuid('Selecione uma organização'),
  usuario_id: z.string().uuid('Admin da organização não encontrado'),
  percentual_comissao: z.number().min(0).max(100).nullable().optional(),
})

// AIDEV-NOTE: AtualizarParceiroSchema — tipo derivado via z.infer, nao editar manualmente
export const AtualizarParceiroSchema = z.object({
  status: z.enum(['ativo', 'suspenso', 'inativo']).optional(),
  percentual_comissao: z.number().min(0).max(100).nullable().optional(),
  motivo_suspensao: z.string().optional(),
})

// AIDEV-NOTE: AtualizarConfigProgramaSchema — tipo derivado via z.infer, nao editar manualmente
export const AtualizarConfigProgramaSchema = z.object({
  percentual_padrao: z.number().min(0).max(100),
  regras_gratuidade: z.object({
    ativo: z.boolean(),
    meta_inicial_indicados: z.number().int().positive().optional(),
    renovacao_periodo_meses: z.number().int().positive().optional(),
    renovacao_meta_indicados: z.number().int().positive().optional(),
    carencia_dias: z.number().int().positive().optional(),
  }),
  base_url_indicacao: z.string().url('URL inválida').nullable(),
  observacoes: z.string().nullable(),
})

// AIDEV-NOTE: GerarComissoesSchema — tipo derivado via z.infer, nao editar manualmente
export const GerarComissoesSchema = z.object({
  periodo_mes: z.number().int().min(1).max(12),
  periodo_ano: z.number().int().min(2020),
  // Se omitido, gera para todos os parceiros ativos
  parceiro_id: z.string().uuid().optional(),
})

// AIDEV-NOTE: AplicarGratuidadeSchema — tipo derivado via z.infer, nao editar manualmente
export const AplicarGratuidadeSchema = z.object({
  parceiro_id: z.string().uuid(),
  // null = gratuidade indefinida (sem data de validade)
  gratuidade_valida_ate: z.string().datetime().nullable(),
})

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DERIVADOS (NUNCA criar manualmente — sempre via z.infer)
// ─────────────────────────────────────────────────────────────────────────────

export type Parceiro = z.infer<typeof ParceiroSchema>
export type IndicacaoParceiro = z.infer<typeof IndicacaoParceiroSchema>
export type ComissaoParceiro = z.infer<typeof ComissaoParceiroSchema>
export type ConfigProgramaParceiro = z.infer<typeof ConfigProgramaParceiroSchema>
export type CriarParceiroData = z.infer<typeof CriarParceiroSchema>
export type AtualizarParceiroData = z.infer<typeof AtualizarParceiroSchema>
export type AtualizarConfigProgramaData = z.infer<typeof AtualizarConfigProgramaSchema>
export type GerarComissoesData = z.infer<typeof GerarComissoesSchema>
export type AplicarGratuidadeData = z.infer<typeof AplicarGratuidadeSchema>
