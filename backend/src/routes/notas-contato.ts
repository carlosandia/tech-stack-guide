/**
 * AIDEV-NOTE: Routes de Notas de Contato (PRD-09)
 *
 * Notas privadas vinculadas a contatos
 *
 * Endpoints:
 * - GET /api/v1/contatos/:contatoId/notas - Lista notas do contato
 * - POST /api/v1/contatos/:contatoId/notas - Cria nota
 * - PATCH /api/v1/notas/:id - Atualiza nota
 * - DELETE /api/v1/notas/:id - Exclui nota
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso
 * - Admin: Ve todas notas do tenant, pode excluir qualquer uma
 * - Member: Ve apenas suas proprias notas, so pode editar/excluir as suas
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth'
import notasContatoService from '../services/notas-contato.service'
import {
  ListarNotasContatoQuerySchema,
  CriarNotaContatoSchema,
  AtualizarNotaContatoSchema,
} from '../schemas/notas-contato'

const router = Router()

// =====================================================
// Middlewares
// =====================================================

router.use(authMiddleware)
router.use(requireTenant)
router.use(requireRole('admin', 'member'))

// =====================================================
// ROTAS NESTED EM CONTATOS
// =====================================================

/**
 * GET /api/v1/contatos/:contatoId/notas
 * Lista notas de um contato
 */
router.get('/contatos/:contatoId/notas', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { contatoId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = ListarNotasContatoQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await notasContatoService.listar(
      contatoId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar notas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar notas',
    })
  }
})

/**
 * POST /api/v1/contatos/:contatoId/notas
 * Cria nova nota para um contato
 */
router.post('/contatos/:contatoId/notas', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId } = req.user!
    const { contatoId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = CriarNotaContatoSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const nota = await notasContatoService.criar(
      organizacao_id,
      contatoId,
      usuarioId,
      parseResult.data
    )

    return res.status(201).json(nota)
  } catch (error) {
    console.error('Erro ao criar nota:', error)

    const message = error instanceof Error ? error.message : 'Erro ao criar nota'

    if (message.includes('nao encontrado') || message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

// =====================================================
// ROTAS DIRETAS DE NOTAS
// =====================================================

/**
 * GET /api/v1/notas/:id
 * Busca nota por ID
 */
router.get('/notas/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: notaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const nota = await notasContatoService.buscarPorId(
      notaId,
      organizacao_id,
      usuarioId,
      role
    )

    if (!nota) {
      return res.status(404).json({ error: 'Nota nao encontrada' })
    }

    return res.json(nota)
  } catch (error) {
    console.error('Erro ao buscar nota:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao buscar nota',
    })
  }
})

/**
 * PATCH /api/v1/notas/:id
 * Atualiza nota
 */
router.patch('/notas/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: notaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = AtualizarNotaContatoSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const nota = await notasContatoService.atualizar(
      notaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(nota)
  } catch (error) {
    console.error('Erro ao atualizar nota:', error)

    const message = error instanceof Error ? error.message : 'Erro ao atualizar nota'

    if (message.includes('permissao') || message.includes('Somente o autor')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/v1/notas/:id
 * Exclui nota (soft delete)
 */
router.delete('/notas/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: notaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    await notasContatoService.excluir(
      notaId,
      organizacao_id,
      usuarioId,
      role
    )

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir nota:', error)

    const message = error instanceof Error ? error.message : 'Erro ao excluir nota'

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
