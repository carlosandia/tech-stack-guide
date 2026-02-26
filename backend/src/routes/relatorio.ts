import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { FunilQuerySchema, SalvarInvestimentoSchema } from '../schemas/relatorio.js'
import { calcularRelatorioFunil, salvarInvestimento } from '../services/relatorio.service.js'
import { requireRole } from '../middlewares/auth.js'

// =====================================================
// PRD-18: Rotas do módulo de Relatório de Funil
// Montado em /api/v1/relatorio (com authMiddleware + requireTenant)
// =====================================================

const router = Router()

// ─────────────────────────────────────────────────────
// Helpers locais
// ─────────────────────────────────────────────────────

function getOrganizacaoId(req: Request): string {
  const user = (req as Request & { user?: { organizacao_id: string | null } }).user
  if (!user?.organizacao_id) throw new Error('Usuário não autenticado ou sem organização')
  return user.organizacao_id
}

function getUserId(req: Request): string {
  const user = (req as Request & { user?: { id: string } }).user
  if (!user?.id) throw new Error('Usuário não autenticado')
  return user.id
}

// ─────────────────────────────────────────────────────
// GET /api/v1/relatorio/funil
// Retorna todas as métricas do funil para o período/filtros
// ─────────────────────────────────────────────────────

router.get('/funil', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = FunilQuerySchema.parse(req.query)

    // Validação adicional para período personalizado
    if (query.periodo === 'personalizado' && (!query.data_inicio || !query.data_fim)) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: 'data_inicio e data_fim são obrigatórios para período personalizado',
      })
    }

    const relatorio = await calcularRelatorioFunil(organizacaoId, query)

    return res.json(relatorio)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: error.errors })
    }
    console.error('[relatorio] Erro ao calcular funil:', error)
    return res.status(500).json({ error: 'Erro ao calcular relatório de funil' })
  }
})

// ─────────────────────────────────────────────────────
// POST /api/v1/relatorio/investimento
// Salva investimento de marketing por canal/período (Invest Mode)
// Restrito a Admin
// ─────────────────────────────────────────────────────

router.post('/investimento', requireRole('admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const usuarioId = getUserId(req)
    const payload = SalvarInvestimentoSchema.parse(req.body)

    // Validar que data_fim >= data_inicio
    if (payload.periodo_fim < payload.periodo_inicio) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: 'periodo_fim deve ser maior ou igual a periodo_inicio',
      })
    }

    await salvarInvestimento(organizacaoId, usuarioId, payload)

    return res.status(201).json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('[relatorio] Erro ao salvar investimento:', error)
    return res.status(500).json({ error: 'Erro ao salvar investimento' })
  }
})

export default router
