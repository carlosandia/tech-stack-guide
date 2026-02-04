import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas comuns reutilizados em todo o sistema
 * Todos schemas derivam tipos via z.infer - nunca criar tipos manuais
 */

// UUID padrao
export const UUIDSchema = z.string().uuid()

// Timestamps padrao
export const TimestampsSchema = z.object({
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

// Campos base para todas tabelas multi-tenant
export const TenantBaseSchema = z.object({
  id: UUIDSchema,
  organizacao_id: UUIDSchema,
}).merge(TimestampsSchema)

// Roles do sistema
export const UserRoleSchema = z.enum(['super_admin', 'admin', 'member'])

// Paginacao
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })

// Tipos derivados
export type UUID = z.infer<typeof UUIDSchema>
export type Timestamps = z.infer<typeof TimestampsSchema>
export type TenantBase = z.infer<typeof TenantBaseSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
export type Pagination = z.infer<typeof PaginationSchema>
