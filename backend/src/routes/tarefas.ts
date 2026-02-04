/**
 * AIDEV-NOTE: Routes do modulo de Tarefas (PRD-10)
 *
 * Endpoints:
 * - GET /api/v1/tarefas - Lista tarefas com filtros
 * - GET /api/v1/tarefas/metricas - Metricas agregadas
 * - PATCH /api/v1/tarefas/:id/concluir - Marca tarefa como concluida
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso (gerencia plataforma, nao vendas)
 * - Admin: Ve todas tarefas do tenant
 * - Member: Ve apenas suas proprias tarefas
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth'
import tarefasService from '../services/tarefas.service'
import {
  ListarTarefasQuerySchema,
  TarefasMetricasFiltrosSchema,
  ConcluirTarefaBodySchema,
} from '../schemas/tarefas'

const router = Router()

// =====================================================
// Middlewares
// =====================================================

// Todas as rotas requerem autenticacao e tenant
router.use(authMiddleware)
router.use(requireTenant)

// AIDEV-NOTE: Super Admin nao acessa este modulo
router.use(requireRole('admin', 'member'))

// =====================================================
// GET /api/v1/tarefas
// Lista tarefas com filtros e paginacao
// =====================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({
        error: 'Organizacao nao identificada',
      })
    }

    // AIDEV-NOTE: Member nao pode usar filtro owner_id (ve apenas suas proprias)
    if (role === 'member' && req.query.owner_id) {
      return res.status(403).json({
        error: 'Voce nao tem permissao para filtrar por responsavel',
      })
    }

    // Valida query params
    const parseResult = ListarTarefasQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const filtros = parseResult.data

    const resultado = await tarefasService.listar(
      organizacao_id,
      usuarioId,
      role,
      filtros
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar tarefas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar tarefas',
    })
  }
})

// =====================================================
// GET /api/v1/tarefas/metricas
// Retorna metricas agregadas
// =====================================================
router.get('/metricas', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({
        error: 'Organizacao nao identificada',
      })
    }

    // AIDEV-NOTE: Member nao pode usar filtro owner_id
    if (role === 'member' && req.query.owner_id) {
      return res.status(403).json({
        error: 'Voce nao tem permissao para filtrar por responsavel',
      })
    }

    // Valida query params
    const parseResult = TarefasMetricasFiltrosSchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const filtros = parseResult.data

    const metricas = await tarefasService.obterMetricas(
      organizacao_id,
      usuarioId,
      role,
      filtros
    )

    return res.json(metricas)
  } catch (error) {
    console.error('Erro ao obter metricas de tarefas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao obter metricas',
    })
  }
})

// =====================================================
// PATCH /api/v1/tarefas/:id/concluir
// Marca tarefa como concluida
// =====================================================
router.patch('/:id/concluir', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: tarefaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({
        error: 'Organizacao nao identificada',
      })
    }

    if (!tarefaId) {
      return res.status(400).json({
        error: 'ID da tarefa nao fornecido',
      })
    }

    // Valida body
    const parseResult = ConcluirTarefaBodySchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const { observacao } = parseResult.data

    const tarefa = await tarefasService.concluir(
      tarefaId,
      organizacao_id,
      usuarioId,
      role,
      observacao
    )

    return res.json({
      success: true,
      tarefa,
    })
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error)

    const message = error instanceof Error ? error.message : 'Erro ao concluir tarefa'

    // Erros de permissao ou validacao retornam 403/400
    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada') || message.includes('ja foi') || message.includes('cancelada')) {
      return res.status(400).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

// =====================================================
// GET /api/v1/tarefas/:id
// Busca tarefa por ID
// =====================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: tarefaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({
        error: 'Organizacao nao identificada',
      })
    }

    if (!tarefaId) {
      return res.status(400).json({
        error: 'ID da tarefa nao fornecido',
      })
    }

    const tarefa = await tarefasService.buscarPorId(
      tarefaId,
      organizacao_id,
      usuarioId,
      role
    )

    if (!tarefa) {
      return res.status(404).json({
        error: 'Tarefa nao encontrada',
      })
    }

    return res.json(tarefa)
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao buscar tarefa',
    })
  }
})

export default router
