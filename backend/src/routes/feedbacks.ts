/**
 * AIDEV-NOTE: Routes de Feedbacks para Admin/Member (PRD-15)
 *
 * Endpoint unico para envio de feedback
 *
 * Endpoints:
 * - POST /api/v1/feedbacks - Enviar feedback
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso (nao envia feedback)
 * - Admin: Pode enviar feedback
 * - Member: Pode enviar feedback
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth.js'
import feedbacksService from '../services/feedbacks.service.js'
import { CriarFeedbackSchema } from '../schemas/feedbacks.js'

const router = Router()

// =====================================================
// Middlewares
// =====================================================

router.use(authMiddleware)
router.use(requireTenant)
router.use(requireRole('admin', 'member'))

// =====================================================
// ROTAS
// =====================================================

/**
 * POST /api/v1/feedbacks
 * Enviar feedback
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = CriarFeedbackSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const feedback = await feedbacksService.criar(
      organizacao_id,
      usuarioId,
      parseResult.data
    )

    return res.status(201).json(feedback)
  } catch (error) {
    console.error('Erro ao criar feedback:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao criar feedback',
    })
  }
})

export default router
