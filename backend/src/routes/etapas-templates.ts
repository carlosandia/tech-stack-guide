/**
 * AIDEV-NOTE: Rotas para Templates de Etapas de Funil
 * Conforme PRD-05 - Templates de Etapas com Tarefas Automaticas
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import etapasTemplatesService from '../services/etapas-templates.service'
import {
  CriarEtapaTemplateSchema,
  AtualizarEtapaTemplateSchema,
  TipoEtapaEnum,
  ReordenarEtapasSchema,
} from '../schemas/etapas-templates'

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

// GET /v1/etapas-templates - Listar templates de etapas
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { tipo, ativo } = req.query

    const result = await etapasTemplatesService.listarEtapasTemplates(organizacaoId, {
      tipo: tipo ? TipoEtapaEnum.parse(tipo) : undefined,
      ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Tipo invalido', details: error.errors })
    }
    console.error('Erro ao listar templates de etapas:', error)
    res.status(500).json({ error: 'Erro ao listar templates de etapas' })
  }
})

// GET /v1/etapas-templates/:id - Buscar template de etapa
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const template = await etapasTemplatesService.buscarEtapaTemplate(organizacaoId, id)

    if (!template) {
      return res.status(404).json({ error: 'Template de etapa nao encontrado' })
    }

    res.json(template)
  } catch (error) {
    console.error('Erro ao buscar template de etapa:', error)
    res.status(500).json({ error: 'Erro ao buscar template de etapa' })
  }
})

// POST /v1/etapas-templates - Criar template de etapa (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarEtapaTemplateSchema.parse(req.body)

    const template = await etapasTemplatesService.criarEtapaTemplate(
      organizacaoId,
      payload,
      userId
    )

    res.status(201).json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar template de etapa:', error)
    res.status(500).json({ error: 'Erro ao criar template de etapa' })
  }
})

// PATCH /v1/etapas-templates/:id - Atualizar template de etapa (Admin Only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarEtapaTemplateSchema.parse(req.body)

    const template = await etapasTemplatesService.atualizarEtapaTemplate(
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
    console.error('Erro ao atualizar template de etapa:', error)
    res.status(500).json({ error: 'Erro ao atualizar template de etapa' })
  }
})

// DELETE /v1/etapas-templates/:id - Excluir template de etapa (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await etapasTemplatesService.excluirEtapaTemplate(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao excluir template de etapa:', error)
    res.status(500).json({ error: 'Erro ao excluir template de etapa' })
  }
})

// PATCH /v1/etapas-templates/reordenar - Reordenar templates (Admin Only)
router.patch('/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const { ordem } = ReordenarEtapasSchema.parse(req.body)

    await etapasTemplatesService.reordenarEtapasTemplates(
      organizacaoId,
      ordem as Array<{ id: string; ordem: number }>
    )

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao reordenar templates de etapas:', error)
    res.status(500).json({ error: 'Erro ao reordenar templates de etapas' })
  }
})

// POST /v1/etapas-templates/:id/tarefas - Vincular tarefa (Admin Only)
router.post('/:id/tarefas', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tarefa_template_id, dias_offset, obrigatoria, ordem } = req.body

    await etapasTemplatesService.vincularTarefaEtapa(id, tarefa_template_id, {
      diasOffset: dias_offset,
      obrigatoria,
      ordem,
    })

    res.status(201).json({ success: true })
  } catch (error) {
    console.error('Erro ao vincular tarefa:', error)
    res.status(500).json({ error: 'Erro ao vincular tarefa' })
  }
})

// DELETE /v1/etapas-templates/:id/tarefas/:tarefaId - Desvincular tarefa (Admin Only)
router.delete('/:id/tarefas/:tarefaId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, tarefaId } = req.params

    await etapasTemplatesService.desvincularTarefaEtapa(id, tarefaId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desvincular tarefa:', error)
    res.status(500).json({ error: 'Erro ao desvincular tarefa' })
  }
})

export default router
