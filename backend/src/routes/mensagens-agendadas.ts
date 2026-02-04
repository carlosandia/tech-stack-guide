/**
 * AIDEV-NOTE: Routes de Mensagens Agendadas (PRD-09)
 *
 * Mensagens programadas para envio futuro
 *
 * Endpoints:
 * - GET /api/v1/mensagens-agendadas - Lista agendadas
 * - GET /api/v1/mensagens-agendadas/:id - Detalhes
 * - POST /api/v1/mensagens-agendadas - Agenda mensagem
 * - DELETE /api/v1/mensagens-agendadas/:id - Cancela
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso
 * - Admin: Ve todas do tenant
 * - Member: Ve apenas suas proprias
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth'
import mensagensAgendadasService from '../services/mensagens-agendadas.service'
import {
  ListarMensagensAgendadasQuerySchema,
  CriarMensagemAgendadaSchema,
} from '../schemas/mensagens-agendadas'

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
 * GET /api/v1/mensagens-agendadas
 * Lista mensagens agendadas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = ListarMensagensAgendadasQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await mensagensAgendadasService.listar(
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar mensagens agendadas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar mensagens agendadas',
    })
  }
})

/**
 * GET /api/v1/mensagens-agendadas/:id
 * Busca mensagem agendada por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: agendadaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const agendada = await mensagensAgendadasService.buscarPorId(
      agendadaId,
      organizacao_id,
      usuarioId,
      role
    )

    if (!agendada) {
      return res.status(404).json({ error: 'Mensagem agendada nao encontrada' })
    }

    return res.json(agendada)
  } catch (error) {
    console.error('Erro ao buscar mensagem agendada:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao buscar mensagem agendada',
    })
  }
})

/**
 * POST /api/v1/mensagens-agendadas
 * Agenda nova mensagem
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = CriarMensagemAgendadaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const agendada = await mensagensAgendadasService.criar(
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(agendada)
  } catch (error) {
    console.error('Erro ao agendar mensagem:', error)

    const message = error instanceof Error ? error.message : 'Erro ao agendar mensagem'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }
    if (message.includes('futuro')) {
      return res.status(400).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/v1/mensagens-agendadas/:id
 * Cancela mensagem agendada
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: agendadaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    await mensagensAgendadasService.cancelar(
      agendadaId,
      organizacao_id,
      usuarioId,
      role
    )

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao cancelar mensagem agendada:', error)

    const message = error instanceof Error ? error.message : 'Erro ao cancelar'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }
    if (message.includes('Somente mensagens')) {
      return res.status(400).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

export default router
