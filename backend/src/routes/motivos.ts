/**
 * AIDEV-NOTE: Rotas para Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho e Perda
 *
 * Admin: CRUD completo
 * Member: Somente leitura
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import motivosService from '../services/motivos.service'
import {
  CriarMotivoSchema,
  AtualizarMotivoSchema,
  TipoMotivoEnum,
  ReordenarMotivosSchema,
} from '../schemas/motivos'

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
// GET /v1/motivos-resultado - Listar motivos
// =====================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { tipo } = req.query

    let tipoValidado = undefined
    if (tipo) {
      tipoValidado = TipoMotivoEnum.parse(tipo)
    }

    const result = await motivosService.listarMotivos(organizacaoId, tipoValidado)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Tipo invalido', details: error.errors })
    }
    console.error('Erro ao listar motivos:', error)
    res.status(500).json({ error: 'Erro ao listar motivos' })
  }
})

// =====================================================
// GET /v1/motivos-resultado/:id - Buscar motivo
// =====================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const motivo = await motivosService.buscarMotivo(organizacaoId, id)

    if (!motivo) {
      return res.status(404).json({ error: 'Motivo nao encontrado' })
    }

    res.json(motivo)
  } catch (error) {
    console.error('Erro ao buscar motivo:', error)
    res.status(500).json({ error: 'Erro ao buscar motivo' })
  }
})

// =====================================================
// POST /v1/motivos-resultado - Criar motivo (Admin Only)
// =====================================================

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarMotivoSchema.parse(req.body)

    const motivo = await motivosService.criarMotivo(organizacaoId, payload, userId)

    res.status(201).json(motivo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar motivo:', error)
    res.status(500).json({ error: 'Erro ao criar motivo' })
  }
})

// =====================================================
// PATCH /v1/motivos-resultado/:id - Atualizar motivo (Admin Only)
// =====================================================

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarMotivoSchema.parse(req.body)

    const motivo = await motivosService.atualizarMotivo(organizacaoId, id, payload)

    res.json(motivo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao atualizar motivo:', error)
    res.status(500).json({ error: 'Erro ao atualizar motivo' })
  }
})

// =====================================================
// DELETE /v1/motivos-resultado/:id - Excluir motivo (Admin Only)
// =====================================================

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await motivosService.excluirMotivo(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao excluir motivo:', error)
    res.status(500).json({ error: 'Erro ao excluir motivo' })
  }
})

// =====================================================
// PATCH /v1/motivos-resultado/reordenar - Reordenar (Admin Only)
// =====================================================

router.patch('/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const { tipo, ordem } = ReordenarMotivosSchema.parse(req.body)

    await motivosService.reordenarMotivos(
      organizacaoId,
      tipo,
      ordem as Array<{ id: string; ordem: number }>
    )

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao reordenar motivos:', error)
    res.status(500).json({ error: 'Erro ao reordenar motivos' })
  }
})

export default router
