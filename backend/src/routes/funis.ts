/**
 * AIDEV-NOTE: Rotas para Funis (Pipelines)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Admin: CRUD completo, configuracoes
 * Member: Visualizacao dos funis que e membro
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import funisService from '../services/funis.service'
import etapasFunilService from '../services/etapas-funil.service'
import distribuicaoService from '../services/distribuicao.service'
import {
  CriarFunilSchema,
  AtualizarFunilSchema,
  ListarFunisQuerySchema,
  VincularMembroSchema,
  VincularMembrosLoteSchema,
  VincularCampoSchema,
  AtualizarVinculoCampoSchema,
  VincularRegraSchema,
  VincularMotivoSchema,
} from '../schemas/funis'
import {
  CriarEtapaFunilSchema,
  AtualizarEtapaFunilSchema,
  ReordenarEtapasSchema,
  VincularTarefaEtapaSchema,
} from '../schemas/etapas-funil'
import { AtualizarDistribuicaoSchema } from '../schemas/distribuicao'

const router = Router()

// =====================================================
// Helpers
// =====================================================

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
// FUNIS - CRUD
// =====================================================

// GET /v1/funis - Listar funis
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = ListarFunisQuerySchema.parse(req.query)

    const result = await funisService.listarFunis(organizacaoId, query)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar funis:', error)
    res.status(500).json({ error: 'Erro ao listar funis' })
  }
})

// GET /v1/funis/contadores - Contadores para UI
router.get('/contadores', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const contadores = await funisService.obterContadores(organizacaoId)
    res.json(contadores)
  } catch (error) {
    console.error('Erro ao obter contadores:', error)
    res.status(500).json({ error: 'Erro ao obter contadores' })
  }
})

// GET /v1/funis/:id - Buscar funil com etapas
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const funil = await funisService.buscarFunilComEtapas(organizacaoId, id)

    if (!funil) {
      return res.status(404).json({ error: 'Funil nao encontrado' })
    }

    res.json(funil)
  } catch (error) {
    console.error('Erro ao buscar funil:', error)
    res.status(500).json({ error: 'Erro ao buscar funil' })
  }
})

// POST /v1/funis - Criar funil (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarFunilSchema.parse(req.body)

    const funil = await funisService.criarFunil(organizacaoId, payload, userId)

    res.status(201).json(funil)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar funil:', error)
    res.status(500).json({ error: 'Erro ao criar funil' })
  }
})

// PUT /v1/funis/:id - Atualizar funil (Admin Only)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarFunilSchema.parse(req.body)

    const funil = await funisService.atualizarFunil(organizacaoId, id, payload)

    res.json(funil)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message === 'Funil nao encontrado') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao atualizar funil:', error)
    res.status(500).json({ error: 'Erro ao atualizar funil' })
  }
})

// DELETE /v1/funis/:id - Excluir funil (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await funisService.excluirFunil(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Funil nao encontrado') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('oportunidades abertas')) {
        return res.status(409).json({ error: error.message })
      }
    }
    console.error('Erro ao excluir funil:', error)
    res.status(500).json({ error: 'Erro ao excluir funil' })
  }
})

// POST /v1/funis/:id/arquivar - Arquivar funil (Admin Only)
router.post('/:id/arquivar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const funil = await funisService.arquivarFunil(organizacaoId, id)

    res.json(funil)
  } catch (error) {
    if (error instanceof Error && error.message === 'Funil nao encontrado') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao arquivar funil:', error)
    res.status(500).json({ error: 'Erro ao arquivar funil' })
  }
})

// POST /v1/funis/:id/desarquivar - Desarquivar funil (Admin Only)
router.post('/:id/desarquivar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const funil = await funisService.desarquivarFunil(organizacaoId, id)

    res.json(funil)
  } catch (error) {
    console.error('Erro ao desarquivar funil:', error)
    res.status(500).json({ error: 'Erro ao desarquivar funil' })
  }
})

// =====================================================
// ETAPAS DO FUNIL
// =====================================================

// GET /v1/funis/:funilId/etapas - Listar etapas
router.get('/:funilId/etapas', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funilId } = req.params

    const etapas = await etapasFunilService.listarEtapas(organizacaoId, funilId)

    res.json({ etapas })
  } catch (error) {
    console.error('Erro ao listar etapas:', error)
    res.status(500).json({ error: 'Erro ao listar etapas' })
  }
})

// POST /v1/funis/:funilId/etapas - Criar etapa (Admin Only)
router.post('/:funilId/etapas', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funilId } = req.params

    const payload = CriarEtapaFunilSchema.parse(req.body)

    const etapa = await etapasFunilService.criarEtapa(organizacaoId, funilId, payload)

    res.status(201).json(etapa)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('Ja existe')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Erro ao criar etapa:', error)
    res.status(500).json({ error: 'Erro ao criar etapa' })
  }
})

// PUT /v1/funis/:funilId/etapas/:id - Atualizar etapa (Admin Only)
router.put('/:funilId/etapas/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarEtapaFunilSchema.parse(req.body)

    const etapa = await etapasFunilService.atualizarEtapa(organizacaoId, id, payload)

    res.json(etapa)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message === 'Etapa nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('nao e permitido')) {
        return res.status(403).json({ error: error.message })
      }
    }
    console.error('Erro ao atualizar etapa:', error)
    res.status(500).json({ error: 'Erro ao atualizar etapa' })
  }
})

// DELETE /v1/funis/:funilId/etapas/:id - Excluir etapa (Admin Only)
router.delete('/:funilId/etapas/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await etapasFunilService.excluirEtapa(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Etapa nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('nao pode ser excluida') || error.message.includes('oportunidades')) {
        return res.status(409).json({ error: error.message })
      }
    }
    console.error('Erro ao excluir etapa:', error)
    res.status(500).json({ error: 'Erro ao excluir etapa' })
  }
})

// PATCH /v1/funis/:funilId/etapas/reordenar - Reordenar etapas (Admin Only)
router.patch('/:funilId/etapas/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funilId } = req.params

    const payload = ReordenarEtapasSchema.parse(req.body)

    await etapasFunilService.reordenarEtapas(organizacaoId, funilId, payload)

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('deve')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao reordenar etapas:', error)
    res.status(500).json({ error: 'Erro ao reordenar etapas' })
  }
})

// =====================================================
// MEMBROS DO FUNIL
// =====================================================

// GET /v1/funis/:id/membros - Listar membros
router.get('/:id/membros', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const membros = await funisService.listarMembros(organizacaoId, id)

    res.json({ membros })
  } catch (error) {
    console.error('Erro ao listar membros:', error)
    res.status(500).json({ error: 'Erro ao listar membros' })
  }
})

// POST /v1/funis/:id/membros - Vincular membro (Admin Only)
router.post('/:id/membros', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = VincularMembroSchema.parse(req.body)

    await funisService.vincularMembro(organizacaoId, id, payload)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('ja e membro')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Erro ao vincular membro:', error)
    res.status(500).json({ error: 'Erro ao vincular membro' })
  }
})

// POST /v1/funis/:id/membros/lote - Vincular membros em lote (Admin Only)
router.post('/:id/membros/lote', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = VincularMembrosLoteSchema.parse(req.body)

    for (const usuario_id of payload.usuario_ids) {
      try {
        await funisService.vincularMembro(organizacaoId, id, { usuario_id })
      } catch {
        // Ignora erros de usuarios ja vinculados
      }
    }

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao vincular membros:', error)
    res.status(500).json({ error: 'Erro ao vincular membros' })
  }
})

// DELETE /v1/funis/:id/membros/:usuarioId - Desvincular membro (Admin Only)
router.delete('/:id/membros/:usuarioId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, usuarioId } = req.params

    await funisService.desvincularMembro(organizacaoId, id, usuarioId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desvincular membro:', error)
    res.status(500).json({ error: 'Erro ao desvincular membro' })
  }
})

// =====================================================
// CAMPOS DO FUNIL
// =====================================================

// GET /v1/funis/:id/campos - Listar campos vinculados
router.get('/:id/campos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const campos = await funisService.listarCamposFunil(organizacaoId, id)

    res.json({ campos })
  } catch (error) {
    console.error('Erro ao listar campos:', error)
    res.status(500).json({ error: 'Erro ao listar campos' })
  }
})

// POST /v1/funis/:id/campos - Vincular campo (Admin Only)
router.post('/:id/campos', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = VincularCampoSchema.parse(req.body)

    await funisService.vincularCampo(organizacaoId, id, payload)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('ja esta vinculado')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Erro ao vincular campo:', error)
    res.status(500).json({ error: 'Erro ao vincular campo' })
  }
})

// PUT /v1/funis/:id/campos/:campoId - Atualizar vinculo (Admin Only)
router.put('/:id/campos/:campoId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, campoId } = req.params

    const payload = AtualizarVinculoCampoSchema.parse(req.body)

    await funisService.atualizarVinculoCampo(organizacaoId, id, campoId, payload)

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar vinculo:', error)
    res.status(500).json({ error: 'Erro ao atualizar vinculo' })
  }
})

// DELETE /v1/funis/:id/campos/:campoId - Desvincular campo (Admin Only)
router.delete('/:id/campos/:campoId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, campoId } = req.params

    await funisService.desvincularCampo(organizacaoId, id, campoId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desvincular campo:', error)
    res.status(500).json({ error: 'Erro ao desvincular campo' })
  }
})

// =====================================================
// DISTRIBUICAO
// =====================================================

// GET /v1/funis/:id/distribuicao - Obter configuracao
router.get('/:id/distribuicao', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const config = await distribuicaoService.obterConfiguracao(organizacaoId, id)

    res.json(config || { modo: 'manual' })
  } catch (error) {
    console.error('Erro ao obter distribuicao:', error)
    res.status(500).json({ error: 'Erro ao obter distribuicao' })
  }
})

// PUT /v1/funis/:id/distribuicao - Atualizar configuracao (Admin Only)
router.put('/:id/distribuicao', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarDistribuicaoSchema.parse(req.body)

    const config = await distribuicaoService.atualizarConfiguracao(organizacaoId, id, payload)

    res.json(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar distribuicao:', error)
    res.status(500).json({ error: 'Erro ao atualizar distribuicao' })
  }
})

// =====================================================
// REGRAS DE QUALIFICACAO
// =====================================================

// GET /v1/funis/:id/regras - Listar regras vinculadas
router.get('/:id/regras', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const regras = await funisService.listarRegrasFunil(organizacaoId, id)

    res.json({ regras })
  } catch (error) {
    console.error('Erro ao listar regras:', error)
    res.status(500).json({ error: 'Erro ao listar regras' })
  }
})

// POST /v1/funis/:id/regras - Vincular regra (Admin Only)
router.post('/:id/regras', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = VincularRegraSchema.parse(req.body)

    await funisService.vincularRegra(organizacaoId, id, payload)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao vincular regra:', error)
    res.status(500).json({ error: 'Erro ao vincular regra' })
  }
})

// DELETE /v1/funis/:id/regras/:regraId - Desvincular regra (Admin Only)
router.delete('/:id/regras/:regraId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, regraId } = req.params

    await funisService.desvincularRegra(organizacaoId, id, regraId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desvincular regra:', error)
    res.status(500).json({ error: 'Erro ao desvincular regra' })
  }
})

// =====================================================
// MOTIVOS DE RESULTADO
// =====================================================

// GET /v1/funis/:id/motivos - Listar motivos vinculados
router.get('/:id/motivos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const motivos = await funisService.listarMotivosFunil(organizacaoId, id)

    res.json({ motivos })
  } catch (error) {
    console.error('Erro ao listar motivos:', error)
    res.status(500).json({ error: 'Erro ao listar motivos' })
  }
})

// POST /v1/funis/:id/motivos - Vincular motivo (Admin Only)
router.post('/:id/motivos', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = VincularMotivoSchema.parse(req.body)

    await funisService.vincularMotivo(organizacaoId, id, payload)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao vincular motivo:', error)
    res.status(500).json({ error: 'Erro ao vincular motivo' })
  }
})

// DELETE /v1/funis/:id/motivos/:motivoId - Desvincular motivo (Admin Only)
router.delete('/:id/motivos/:motivoId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, motivoId } = req.params

    await funisService.desvincularMotivo(organizacaoId, id, motivoId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desvincular motivo:', error)
    res.status(500).json({ error: 'Erro ao desvincular motivo' })
  }
})

// =====================================================
// TAREFAS AUTOMATICAS POR ETAPA
// =====================================================

// GET /v1/funis/:funilId/etapas/:etapaId/tarefas - Listar tarefas
router.get('/:funilId/etapas/:etapaId/tarefas', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { etapaId } = req.params

    const tarefas = await etapasFunilService.listarTarefasEtapa(organizacaoId, etapaId)

    res.json({ tarefas })
  } catch (error) {
    console.error('Erro ao listar tarefas:', error)
    res.status(500).json({ error: 'Erro ao listar tarefas' })
  }
})

// POST /v1/funis/:funilId/etapas/:etapaId/tarefas - Vincular tarefa (Admin Only)
router.post('/:funilId/etapas/:etapaId/tarefas', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { etapaId } = req.params

    const payload = VincularTarefaEtapaSchema.parse(req.body)

    await etapasFunilService.vincularTarefa(organizacaoId, etapaId, payload)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao vincular tarefa:', error)
    res.status(500).json({ error: 'Erro ao vincular tarefa' })
  }
})

// DELETE /v1/funis/:funilId/etapas/:etapaId/tarefas/:tarefaId - Desvincular tarefa (Admin Only)
router.delete(
  '/:funilId/etapas/:etapaId/tarefas/:tarefaId',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const organizacaoId = getOrganizacaoId(req)
      const { etapaId, tarefaId } = req.params

      await etapasFunilService.desvincularTarefa(organizacaoId, etapaId, tarefaId)

      res.status(204).send()
    } catch (error) {
      console.error('Erro ao desvincular tarefa:', error)
      res.status(500).json({ error: 'Erro ao desvincular tarefa' })
    }
  }
)

export default router
