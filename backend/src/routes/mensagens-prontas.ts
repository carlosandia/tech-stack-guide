/**
 * AIDEV-NOTE: Routes de Mensagens Prontas (PRD-09)
 *
 * Quick replies / templates de resposta rapida
 *
 * Endpoints:
 * - GET /api/v1/mensagens-prontas - Lista templates
 * - GET /api/v1/mensagens-prontas/:id - Detalhes
 * - POST /api/v1/mensagens-prontas - Cria template
 * - PATCH /api/v1/mensagens-prontas/:id - Atualiza
 * - DELETE /api/v1/mensagens-prontas/:id - Exclui
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso
 * - Admin: Cria global ou pessoal, ve todas do tenant
 * - Member: Cria apenas pessoal, ve globais + suas pessoais
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth'
import mensagensProntasService from '../services/mensagens-prontas.service'
import {
  ListarMensagensProntasQuerySchema,
  CriarMensagemProntaSchema,
  AtualizarMensagemProntaSchema,
} from '../schemas/mensagens-prontas'

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
 * GET /api/v1/mensagens-prontas
 * Lista mensagens prontas (pessoais + globais)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = ListarMensagensProntasQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await mensagensProntasService.listar(
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar mensagens prontas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar mensagens prontas',
    })
  }
})

/**
 * GET /api/v1/mensagens-prontas/:id
 * Busca mensagem pronta por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: mensagemId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const mensagem = await mensagensProntasService.buscarPorId(
      mensagemId,
      organizacao_id,
      usuarioId,
      role
    )

    if (!mensagem) {
      return res.status(404).json({ error: 'Mensagem pronta nao encontrada' })
    }

    return res.json(mensagem)
  } catch (error) {
    console.error('Erro ao buscar mensagem pronta:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao buscar mensagem pronta',
    })
  }
})

/**
 * POST /api/v1/mensagens-prontas
 * Cria nova mensagem pronta
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = CriarMensagemProntaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensProntasService.criar(
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao criar mensagem pronta:', error)

    const message = error instanceof Error ? error.message : 'Erro ao criar mensagem pronta'

    if (message.includes('Ja existe')) {
      return res.status(409).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * PATCH /api/v1/mensagens-prontas/:id
 * Atualiza mensagem pronta
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: mensagemId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = AtualizarMensagemProntaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensProntasService.atualizar(
      mensagemId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(mensagem)
  } catch (error) {
    console.error('Erro ao atualizar mensagem pronta:', error)

    const message = error instanceof Error ? error.message : 'Erro ao atualizar'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }
    if (message.includes('Ja existe')) {
      return res.status(409).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/v1/mensagens-prontas/:id
 * Exclui mensagem pronta (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: mensagemId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    await mensagensProntasService.excluir(
      mensagemId,
      organizacao_id,
      usuarioId,
      role
    )

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir mensagem pronta:', error)

    const message = error instanceof Error ? error.message : 'Erro ao excluir'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

export default router
