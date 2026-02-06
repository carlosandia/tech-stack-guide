/**
 * AIDEV-NOTE: Rotas para Contatos (Pessoas e Empresas)
 * Conforme PRD-06 - Modulo de Contatos
 *
 * Todas as rotas requerem authMiddleware + requireTenant
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import contatosService from '../services/contatos.service.js'
import segmentosService from '../services/segmentos.service.js'
import {
  CriarPessoaSchema,
  CriarEmpresaSchema,
  AtualizarPessoaSchema,
  AtualizarEmpresaSchema,
  ListarContatosQuerySchema,
  DeleteLoteSchema,
  AtribuirLoteSchema,
  MesclarContatosSchema,
  SegmentarLoteSchema,
} from '../schemas/contatos.js'
import { VincularSegmentosSchema } from '../schemas/segmentos.js'

const router = Router()

function getOrganizacaoId(req: Request): string {
  const user = (req as any).user
  if (!user?.organizacao_id) throw new Error('Usuario nao autenticado ou sem organizacao')
  return user.organizacao_id
}

function getUserId(req: Request): string {
  return (req as any).user?.id
}

function getUserRole(req: Request): string {
  return (req as any).user?.role || 'member'
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
// GET / - Listar contatos com filtros
// =====================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const filtros = ListarContatosQuerySchema.parse(req.query)

    const result = await contatosService.listarContatos(organizacaoId, userId, role, {
      tipo: filtros.tipo,
      status: filtros.status,
      origem: filtros.origem,
      owner_id: filtros.owner_id,
      segmento_id: filtros.segmento_id,
      empresa_id: filtros.empresa_id,
      busca: filtros.busca,
      data_inicio: filtros.data_inicio,
      data_fim: filtros.data_fim,
      page: filtros.limit ? 1 : 1,
      per_page: filtros.limit || 50,
      ordenar_por: filtros.ordenar_por,
      ordem: filtros.ordem,
    })

    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar contatos:', error)
    res.status(500).json({ error: error.message || 'Erro ao listar contatos' })
  }
})

// =====================================================
// GET /duplicatas - Listar duplicatas (Admin only)
// =====================================================

router.get('/duplicatas', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const result = await contatosService.buscarDuplicatas(organizacaoId)
    res.json(result)
  } catch (error: any) {
    console.error('Erro ao buscar duplicatas:', error)
    res.status(500).json({ error: error.message || 'Erro ao buscar duplicatas' })
  }
})

// =====================================================
// GET /exportar - Exportar contatos CSV
// =====================================================

router.get('/exportar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const filtros = ListarContatosQuerySchema.parse(req.query)

    const result = await contatosService.exportarContatos(organizacaoId, userId, role, filtros)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=contatos.csv')
    res.send(result.csv)
  } catch (error: any) {
    console.error('Erro ao exportar contatos:', error)
    res.status(500).json({ error: error.message || 'Erro ao exportar contatos' })
  }
})

// =====================================================
// GET /:id - Buscar contato por ID
// =====================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const { id } = req.params

    const contato = await contatosService.buscarContato(id, organizacaoId, userId, role)

    if (!contato) {
      return res.status(404).json({ error: 'Contato nao encontrado' })
    }

    res.json(contato)
  } catch (error: any) {
    console.error('Erro ao buscar contato:', error)
    res.status(500).json({ error: error.message || 'Erro ao buscar contato' })
  }
})

// =====================================================
// POST / - Criar contato
// =====================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const { tipo, ...dados } = req.body

    // Validar baseado no tipo
    if (tipo === 'empresa') {
      CriarEmpresaSchema.parse(dados)
    } else {
      CriarPessoaSchema.parse(dados)
    }

    const contato = await contatosService.criarContato(organizacaoId, userId, role, {
      tipo,
      ...dados,
    })

    res.status(201).json(contato)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar contato:', error)
    res.status(500).json({ error: error.message || 'Erro ao criar contato' })
  }
})

// =====================================================
// POST /mesclar - Mesclar contatos (Admin only)
// =====================================================

router.post('/mesclar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const payload = MesclarContatosSchema.parse(req.body)
    const result = await contatosService.mesclarContatos(organizacaoId, userId, payload)
    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao mesclar contatos:', error)
    res.status(500).json({ error: error.message || 'Erro ao mesclar contatos' })
  }
})

// =====================================================
// POST /lote/segmentos - Segmentar em massa
// =====================================================

router.post('/lote/segmentos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = SegmentarLoteSchema.parse(req.body)
    const result = await segmentosService.segmentarLote(organizacaoId, payload)
    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao segmentar em lote:', error)
    res.status(500).json({ error: error.message || 'Erro ao segmentar em lote' })
  }
})

// =====================================================
// POST /:id/segmentos - Vincular segmentos
// =====================================================

router.post('/:id/segmentos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params
    const { segmento_ids } = VincularSegmentosSchema.parse(req.body)
    await segmentosService.vincularSegmentos(id, organizacaoId, segmento_ids)
    res.json({ sucesso: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao vincular segmentos:', error)
    res.status(500).json({ error: error.message || 'Erro ao vincular segmentos' })
  }
})

// =====================================================
// PATCH /:id - Atualizar contato
// =====================================================

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const { id } = req.params

    const contato = await contatosService.atualizarContato(id, organizacaoId, userId, role, req.body)
    res.json(contato)
  } catch (error: any) {
    if (error.message?.includes('permissao')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao atualizar contato:', error)
    res.status(500).json({ error: error.message || 'Erro ao atualizar contato' })
  }
})

// =====================================================
// PATCH /lote/atribuir - Atribuir owner em massa (Admin only)
// =====================================================

router.patch('/lote/atribuir', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtribuirLoteSchema.parse(req.body)
    const result = await contatosService.atribuirLote(organizacaoId, payload)
    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atribuir em lote:', error)
    res.status(500).json({ error: error.message || 'Erro ao atribuir em lote' })
  }
})

// =====================================================
// DELETE /lote - Excluir em massa
// =====================================================

router.delete('/lote', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const payload = DeleteLoteSchema.parse(req.body)
    const result = await contatosService.excluirLote(organizacaoId, userId, role, payload)
    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao excluir em lote:', error)
    res.status(500).json({ error: error.message || 'Erro ao excluir em lote' })
  }
})

// =====================================================
// DELETE /:id - Excluir contato
// =====================================================

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const role = getUserRole(req) as any
    const { id } = req.params

    await contatosService.excluirContato(id, organizacaoId, userId, role)
    res.status(204).send()
  } catch (error: any) {
    if (error.message?.includes('permissao')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message?.includes('vinculada') || error.message?.includes('oportunidade')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Erro ao excluir contato:', error)
    res.status(500).json({ error: error.message || 'Erro ao excluir contato' })
  }
})

// =====================================================
// DELETE /:id/segmentos/:segId - Desvincular segmento
// =====================================================

router.delete('/:id/segmentos/:segId', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, segId } = req.params
    await segmentosService.desvincularSegmento(id, organizacaoId, segId)
    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao desvincular segmento:', error)
    res.status(500).json({ error: error.message || 'Erro ao desvincular segmento' })
  }
})

export default router
