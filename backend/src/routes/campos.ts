/**
 * AIDEV-NOTE: Rotas para Campos Customizados
 * Conforme PRD-05 - Personalizacao de Campos
 *
 * Admin: CRUD completo
 * Member: Somente leitura
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import camposService from '../services/campos.service'
import {
  CriarCampoSchema,
  AtualizarCampoSchema,
  EntidadeEnum,
  ReordenarCamposSchema,
} from '../schemas/campos'

const router = Router()

// Middleware para extrair organizacao_id do usuario autenticado
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

// Middleware para verificar se e Admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }
  next()
}

// =====================================================
// GET /v1/campos - Listar campos por entidade
// =====================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { entidade } = req.query

    // Validar entidade
    const entidadeValidada = EntidadeEnum.parse(entidade)

    const result = await camposService.listarCampos(organizacaoId, entidadeValidada)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Entidade invalida', details: error.errors })
    }
    console.error('Erro ao listar campos:', error)
    res.status(500).json({ error: 'Erro ao listar campos' })
  }
})

// =====================================================
// GET /v1/campos/:id - Buscar campo por ID
// =====================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const campo = await camposService.buscarCampo(organizacaoId, id)

    if (!campo) {
      return res.status(404).json({ error: 'Campo nao encontrado' })
    }

    res.json(campo)
  } catch (error) {
    console.error('Erro ao buscar campo:', error)
    res.status(500).json({ error: 'Erro ao buscar campo' })
  }
})

// =====================================================
// POST /v1/campos - Criar campo (Admin Only)
// =====================================================

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarCampoSchema.parse(req.body)

    const campo = await camposService.criarCampo(organizacaoId, payload, userId)

    res.status(201).json(campo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar campo:', error)
    res.status(500).json({ error: 'Erro ao criar campo' })
  }
})

// =====================================================
// PATCH /v1/campos/:id - Atualizar campo (Admin Only)
// =====================================================

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarCampoSchema.parse(req.body)

    const campo = await camposService.atualizarCampo(organizacaoId, id, payload)

    res.json(campo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao atualizar campo:', error)
    res.status(500).json({ error: 'Erro ao atualizar campo' })
  }
})

// =====================================================
// DELETE /v1/campos/:id - Excluir campo (Admin Only)
// =====================================================

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await camposService.excluirCampo(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao excluir campo:', error)
    res.status(500).json({ error: 'Erro ao excluir campo' })
  }
})

// =====================================================
// PATCH /v1/campos/reordenar - Reordenar campos (Admin Only)
// =====================================================

router.patch('/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const { entidade, ordem } = ReordenarCamposSchema.parse(req.body)

    await camposService.reordenarCampos(
      organizacaoId,
      entidade,
      ordem as Array<{ id: string; ordem: number }>
    )

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao reordenar campos:', error)
    res.status(500).json({ error: 'Erro ao reordenar campos' })
  }
})

export default router
