/**
 * AIDEV-NOTE: Rotas para Metas Hierarquicas
 * Conforme PRD-05 - Sistema de Metas
 *
 * Admin: CRUD completo + distribuicao
 * Member: Apenas /metas/minhas (suas proprias metas)
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import metasService from '../services/metas.service'
import {
  CriarMetaSchema,
  AtualizarMetaSchema,
  DistribuirMetaSchema,
  ListarMetasQuerySchema,
  RankingQuerySchema,
} from '../schemas/metas'

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
// ROTAS PARA MEMBERS (antes das rotas admin)
// =====================================================

// GET /v1/metas/minhas - Minhas metas (Member pode acessar)
router.get('/minhas', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    if (!userId) {
      return res.status(401).json({ error: 'Usuario nao autenticado' })
    }

    const result = await metasService.buscarMinhasMetas(organizacaoId, userId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao buscar minhas metas:', error)
    res.status(500).json({ error: 'Erro ao buscar minhas metas' })
  }
})

// GET /v1/metas/ranking - Ranking (Todos podem ver)
router.get('/ranking', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const query = RankingQuerySchema.parse(req.query)

    const result = await metasService.buscarRanking(organizacaoId, {
      metrica: query.metrica,
      periodo: query.periodo,
      equipeId: query.equipe_id,
      limit: query.limit ? parseInt(query.limit) : 10,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao buscar ranking:', error)
    res.status(500).json({ error: 'Erro ao buscar ranking' })
  }
})

// GET /v1/metas/progresso - Progresso geral (Admin pode ver detalhado, Member ve resumido)
router.get('/progresso', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await metasService.buscarProgressoGeral(organizacaoId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao buscar progresso:', error)
    res.status(500).json({ error: 'Erro ao buscar progresso' })
  }
})

// =====================================================
// ROTAS ADMIN ONLY
// =====================================================

// GET /v1/metas - Listar metas (Admin Only)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const query = ListarMetasQuerySchema.parse(req.query)

    const result = await metasService.listarMetas(organizacaoId, {
      tipo: query.tipo,
      metrica: query.metrica,
      periodo: query.periodo,
      equipeId: query.equipe_id,
      usuarioId: query.usuario_id,
      ativa: query.ativa === 'true' ? true : query.ativa === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar metas:', error)
    res.status(500).json({ error: 'Erro ao listar metas' })
  }
})

// GET /v1/metas/empresa - Metas da empresa (Admin Only)
router.get('/empresa', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await metasService.buscarMetasEmpresa(organizacaoId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao buscar metas da empresa:', error)
    res.status(500).json({ error: 'Erro ao buscar metas da empresa' })
  }
})

// GET /v1/metas/equipes - Metas por equipe (Admin Only)
router.get('/equipes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { equipe_id } = req.query

    if (!equipe_id || typeof equipe_id !== 'string') {
      return res.status(400).json({ error: 'equipe_id e obrigatorio' })
    }

    const result = await metasService.buscarMetasEquipe(organizacaoId, equipe_id)

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message.includes('nao encontrada')) {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao buscar metas da equipe:', error)
    res.status(500).json({ error: 'Erro ao buscar metas da equipe' })
  }
})

// GET /v1/metas/individuais - Metas individuais (Admin Only)
router.get('/individuais', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await metasService.listarMetas(organizacaoId, {
      tipo: 'individual',
    })

    res.json(result)
  } catch (error) {
    console.error('Erro ao buscar metas individuais:', error)
    res.status(500).json({ error: 'Erro ao buscar metas individuais' })
  }
})

// GET /v1/metas/:id - Buscar meta (Admin Only)
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const meta = await metasService.buscarMeta(organizacaoId, id)

    if (!meta) {
      return res.status(404).json({ error: 'Meta nao encontrada' })
    }

    res.json(meta)
  } catch (error) {
    console.error('Erro ao buscar meta:', error)
    res.status(500).json({ error: 'Erro ao buscar meta' })
  }
})

// POST /v1/metas - Criar meta (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarMetaSchema.parse(req.body)

    const meta = await metasService.criarMeta(organizacaoId, payload, userId)

    res.status(201).json(meta)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar meta:', error)
    res.status(500).json({ error: 'Erro ao criar meta' })
  }
})

// PATCH /v1/metas/:id - Atualizar meta (Admin Only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarMetaSchema.parse(req.body)

    const meta = await metasService.atualizarMeta(organizacaoId, id, payload)

    res.json(meta)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar meta:', error)
    res.status(500).json({ error: 'Erro ao atualizar meta' })
  }
})

// DELETE /v1/metas/:id - Excluir meta (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await metasService.excluirMeta(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir meta:', error)
    res.status(500).json({ error: 'Erro ao excluir meta' })
  }
})

// POST /v1/metas/:id/distribuir - Distribuir meta para niveis inferiores (Admin Only)
router.post('/:id/distribuir', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params
    const userId = getUserId(req)

    const payload = DistribuirMetaSchema.parse(req.body)

    const metasCriadas = await metasService.distribuirMeta(organizacaoId, id, payload, userId)

    res.status(201).json({
      success: true,
      metas_criadas: metasCriadas.length,
      metas: metasCriadas,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao distribuir meta:', error)
    res.status(500).json({ error: 'Erro ao distribuir meta' })
  }
})

export default router
