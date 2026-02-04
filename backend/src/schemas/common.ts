import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas comuns do backend
 * Espelha os schemas do frontend para consistencia
 */

// Roles do sistema
export const UserRoleSchema = z.enum(['super_admin', 'admin', 'member'])
export type UserRole = z.infer<typeof UserRoleSchema>

// UUID padrao
export const UUIDSchema = z.string().uuid()
export type UUID = z.infer<typeof UUIDSchema>

// Paginacao
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})
export type Pagination = z.infer<typeof PaginationSchema>
