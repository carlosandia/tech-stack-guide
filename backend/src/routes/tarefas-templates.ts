/**
 * AIDEV-NOTE: Rotas para Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas Padronizadas
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import tarefasTemplatesService from '../services/tarefas-templates.service'
import {
  CriarTarefaTemplateSchema,
  AtualizarTarefaTemplateSchema,
  TipoTarefaEnum,
} from '../schemas/tarefas-templates'

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

// GET /v1/tarefas-templates - Listar templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { tipo, ativo } = req.query

    const result = await tarefasTemplatesService.listarTarefasTemplates(organizacaoId, {
      tipo: tipo ? TipoTarefaEnum.parse(tipo) : undefined,
      ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Tipo invalido', details: error.errors })
    }
    console.error('Erro ao listar templates:', error)
    res.status(500).json({ error: 'Erro ao listar templates' })
  }
})

// GET /v1/tarefas-templates/:id - Buscar template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const template = await tarefasTemplatesService.buscarTarefaTemplate(organizacaoId, id)

    if (!template) {
      return res.status(404).json({ error: 'Template nao encontrado' })
    }

    res.json(template)
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    res.status(500).json({ error: 'Erro ao buscar template' })
  }
})

// POST /v1/tarefas-templates - Criar template (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarTarefaTemplateSchema.parse(req.body)

    const template = await tarefasTemplatesService.criarTarefaTemplate(
      organizacaoId,
      payload,
      userId
    )

    res.status(201).json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar template:', error)
    res.status(500).json({ error: 'Erro ao criar template' })
  }
})

// PATCH /v1/tarefas-templates/:id - Atualizar template (Admin Only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarTarefaTemplateSchema.parse(req.body)

    const template = await tarefasTemplatesService.atualizarTarefaTemplate(
      organizacaoId,
      id,
      payload
    )

    res.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao atualizar template:', error)
    res.status(500).json({ error: 'Erro ao atualizar template' })
  }
})

// DELETE /v1/tarefas-templates/:id - Excluir template (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await tarefasTemplatesService.excluirTarefaTemplate(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao excluir template:', error)
    res.status(500).json({ error: 'Erro ao excluir template' })
  }
})

export default router
