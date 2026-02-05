/**
 * AIDEV-NOTE: Schemas Zod para Motivos de Resultado (Frontend)
 * Conforme PRD-05 e backend/src/schemas/motivos.ts
 */

import { z } from 'zod'

// =====================================================
// Options
// =====================================================

export const tipoMotivoOptions = [
  { value: 'ganho', label: 'Ganho' },
  { value: 'perda', label: 'Perda' },
] as const

// =====================================================
// Schema - Criar Motivo
// =====================================================

export const criarMotivoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  descricao: z.string().optional(),
  tipo: z.enum(['ganho', 'perda']),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').optional(),
})

export type CriarMotivoFormData = z.infer<typeof criarMotivoSchema>
