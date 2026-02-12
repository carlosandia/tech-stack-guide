/**
 * AIDEV-NOTE: Rotas para Segmentos de Contatos
 * Conforme PRD-06 - Sistema de Segmentacao
 *
 * Admin: CRUD completo
 * Member: Somente leitura
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import segmentosService from '../services/segmentos.service.js'
import { CriarSegmentoSchema, AtualizarSegmentoSchema, type CriarSegmentoPayload } from '../schemas/segmentos.js'

const router = Router()

function getOrganizacaoId(req: Request): string {
  const user = (req as any).user
  if (!user?.organizacao_id) throw new Error('Usuario nao autenticado ou sem organizacao')
  return user.organizacao_id
}

function getUserId(req: Request): string {
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

// GET / - Listar segmentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const result = await segmentosService.listarSegmentos(organizacaoId)
    res.json(result)
  } catch (error: any) {
    console.error('Erro ao listar segmentos:', error)
    res.status(500).json({ error: error.message || 'Erro ao listar segmentos' })
  }
})

// POST / - Criar segmento (Admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const payload = CriarSegmentoSchema.parse(req.body) as CriarSegmentoPayload
    const segmento = await segmentosService.criarSegmento(organizacaoId, userId, payload)
    res.status(201).json(segmento)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar segmento:', error)
    res.status(500).json({ error: error.message || 'Erro ao criar segmento' })
  }
})

// PATCH /:id - Atualizar segmento (Admin only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params
    const payload = AtualizarSegmentoSchema.parse(req.body)
    const segmento = await segmentosService.atualizarSegmento(id, organizacaoId, payload)
    res.json(segmento)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar segmento:', error)
    res.status(500).json({ error: error.message || 'Erro ao atualizar segmento' })
  }
})

// DELETE /:id - Excluir segmento (Admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params
    await segmentosService.excluirSegmento(id, organizacaoId)
    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao excluir segmento:', error)
    res.status(500).json({ error: error.message || 'Erro ao excluir segmento' })
  }
})

export default router
