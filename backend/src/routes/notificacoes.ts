/**
 * AIDEV-NOTE: Routes de Notificacoes (PRD-15)
 *
 * Sistema de notificacoes para usuarios do CRM
 *
 * Endpoints:
 * - GET /api/v1/notificacoes - Listar notificacoes
 * - GET /api/v1/notificacoes/contagem - Contar nao lidas
 * - PATCH /api/v1/notificacoes/:id/lida - Marcar como lida
 * - PATCH /api/v1/notificacoes/marcar-todas - Marcar todas como lidas
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso (usa painel admin)
 * - Admin: Ve suas notificacoes
 * - Member: Ve suas notificacoes
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth.js'
import notificacoesService from '../services/notificacoes.service.js'
import { ListarNotificacoesQuerySchema } from '../schemas/notificacoes.js'

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
 * GET /api/v1/notificacoes
 * Lista notificacoes do usuario (mais recentes primeiro)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = req.user!

    const parseResult = ListarNotificacoesQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await notificacoesService.listar(
      usuarioId,
      parseResult.data.limit
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar notificacoes:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar notificacoes',
    })
  }
})

/**
 * GET /api/v1/notificacoes/contagem
 * Conta notificacoes nao lidas
 */
router.get('/contagem', async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = req.user!

    const nao_lidas = await notificacoesService.contarNaoLidas(usuarioId)

    return res.json({ nao_lidas })
  } catch (error) {
    console.error('Erro ao contar notificacoes:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao contar notificacoes',
    })
  }
})

/**
 * PATCH /api/v1/notificacoes/:id/lida
 * Marca notificacao como lida
 */
router.patch('/:id/lida', async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = req.user!
    const { id: notificacaoId } = req.params

    await notificacoesService.marcarComoLida(notificacaoId, usuarioId)

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar notificacao como lida:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao marcar como lida',
    })
  }
})

/**
 * PATCH /api/v1/notificacoes/marcar-todas
 * Marca todas as notificacoes como lidas
 */
router.patch('/marcar-todas', async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = req.user!

    await notificacoesService.marcarTodasComoLidas(usuarioId)

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar todas notificacoes:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao marcar todas como lidas',
    })
  }
})

export default router
