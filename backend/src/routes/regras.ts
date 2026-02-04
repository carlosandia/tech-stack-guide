/**
 * AIDEV-NOTE: Rotas para Regras de Qualificacao e Config do Card
 * Conforme PRD-05 - Regras MQL e Personalizacao do Card Kanban
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import regrasService from '../services/regras.service'
import {
  CriarRegraSchema,
  AtualizarRegraSchema,
  ReordenarRegrasSchema,
  AtualizarConfigCardSchema,
} from '../schemas/regras'

const router = Router()

function getOrganizacaoId(req: Request): string {
  const user = (req as any).user
  if (!user?.organizacao_id) {
    throw new Error('Usuario nao autenticado ou sem organizacao')
  }
  return user.organizacao_id
}

function getUserId(req: Request): string | undefined {
  return (req as any).user?.id
}

function isAdmin(req: Request): boolean {
  const user = (req as any).user
  return user?.role === 'admin' || user?.role === 'super_admin'
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }
  next()
}

// =====================================================
// REGRAS DE QUALIFICACAO
// =====================================================

// GET /v1/regras-qualificacao - Listar regras
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { ativa } = req.query

    const result = await regrasService.listarRegras(organizacaoId, {
      ativa: ativa === 'true' ? true : ativa === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    console.error('Erro ao listar regras:', error)
    res.status(500).json({ error: 'Erro ao listar regras' })
  }
})

// GET /v1/regras-qualificacao/:id - Buscar regra
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const regra = await regrasService.buscarRegra(organizacaoId, id)

    if (!regra) {
      return res.status(404).json({ error: 'Regra nao encontrada' })
    }

    res.json(regra)
  } catch (error) {
    console.error('Erro ao buscar regra:', error)
    res.status(500).json({ error: 'Erro ao buscar regra' })
  }
})

// POST /v1/regras-qualificacao - Criar regra (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarRegraSchema.parse(req.body)

    const regra = await regrasService.criarRegra(organizacaoId, payload, userId)

    res.status(201).json(regra)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar regra:', error)
    res.status(500).json({ error: 'Erro ao criar regra' })
  }
})

// PATCH /v1/regras-qualificacao/:id - Atualizar regra (Admin Only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarRegraSchema.parse(req.body)

    const regra = await regrasService.atualizarRegra(organizacaoId, id, payload)

    res.json(regra)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar regra:', error)
    res.status(500).json({ error: 'Erro ao atualizar regra' })
  }
})

// DELETE /v1/regras-qualificacao/:id - Excluir regra (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await regrasService.excluirRegra(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir regra:', error)
    res.status(500).json({ error: 'Erro ao excluir regra' })
  }
})

// PATCH /v1/regras-qualificacao/reordenar - Reordenar regras (Admin Only)
router.patch('/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const { prioridades } = ReordenarRegrasSchema.parse(req.body)

    await regrasService.reordenarRegras(
      organizacaoId,
      prioridades as Array<{ id: string; prioridade: number }>
    )

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao reordenar regras:', error)
    res.status(500).json({ error: 'Erro ao reordenar regras' })
  }
})

// POST /v1/regras-qualificacao/avaliar - Avaliar contato
router.post('/avaliar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { dados } = req.body

    const resultado = await regrasService.avaliarQualificacao(organizacaoId, dados)

    res.json(resultado)
  } catch (error) {
    console.error('Erro ao avaliar qualificacao:', error)
    res.status(500).json({ error: 'Erro ao avaliar qualificacao' })
  }
})

export default router

// =====================================================
// ROUTER SEPARADO PARA CONFIG CARD
// =====================================================

export const configCardRouter = Router()

// GET /v1/configuracoes-card - Buscar configuracao do card
configCardRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const config = await regrasService.buscarConfigCard(organizacaoId)

    res.json(config || {})
  } catch (error) {
    console.error('Erro ao buscar configuracao do card:', error)
    res.status(500).json({ error: 'Erro ao buscar configuracao do card' })
  }
})

// PUT /v1/configuracoes-card - Atualizar configuracao do card (Admin Only)
configCardRouter.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = AtualizarConfigCardSchema.parse(req.body)

    const config = await regrasService.atualizarConfigCard(organizacaoId, payload, userId)

    res.json(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar configuracao do card:', error)
    res.status(500).json({ error: 'Erro ao atualizar configuracao do card' })
  }
})
