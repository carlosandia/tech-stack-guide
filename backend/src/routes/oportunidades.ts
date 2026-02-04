/**
 * AIDEV-NOTE: Rotas para Oportunidades (Negocios)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Admin: CRUD completo
 * Member: CRUD das oportunidades atribuidas ou do funil que e membro
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import oportunidadesService from '../services/oportunidades.service'
import distribuicaoService from '../services/distribuicao.service'
import {
  CriarOportunidadeSchema,
  AtualizarOportunidadeSchema,
  ListarOportunidadesQuerySchema,
  MoverEtapaSchema,
  FecharOportunidadeSchema,
  AtribuirResponsavelSchema,
  QualificarOportunidadeSchema,
  AdicionarProdutoSchema,
  AtualizarProdutoOportunidadeSchema,
} from '../schemas/oportunidades'

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
// OPORTUNIDADES - CRUD
// =====================================================

// GET /v1/oportunidades - Listar oportunidades
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = ListarOportunidadesQuerySchema.parse(req.query)

    const result = await oportunidadesService.listarOportunidades(organizacaoId, query)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar oportunidades:', error)
    res.status(500).json({ error: 'Erro ao listar oportunidades' })
  }
})

// GET /v1/oportunidades/kanban/:funilId - Obter dados do Kanban
router.get('/kanban/:funilId', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funilId } = req.params
    const filtros = ListarOportunidadesQuerySchema.partial().parse(req.query)

    const kanban = await oportunidadesService.obterKanban(organizacaoId, funilId, filtros)

    res.json(kanban)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message === 'Funil nao encontrado') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao obter kanban:', error)
    res.status(500).json({ error: 'Erro ao obter kanban' })
  }
})

// GET /v1/oportunidades/:id - Buscar oportunidade com detalhes
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const oportunidade = await oportunidadesService.buscarOportunidadeDetalhe(organizacaoId, id)

    if (!oportunidade) {
      return res.status(404).json({ error: 'Oportunidade nao encontrada' })
    }

    res.json(oportunidade)
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error)
    res.status(500).json({ error: 'Erro ao buscar oportunidade' })
  }
})

// POST /v1/oportunidades - Criar oportunidade
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarOportunidadeSchema.parse(req.body)

    const oportunidade = await oportunidadesService.criarOportunidade(
      organizacaoId,
      payload,
      userId
    )

    // Tentar distribuir automaticamente
    try {
      await distribuicaoService.distribuirOportunidade(organizacaoId, oportunidade.id)
    } catch {
      // Ignora erro de distribuicao (pode ser manual)
    }

    res.status(201).json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message.includes('etapa de entrada')) {
        return res.status(400).json({ error: error.message })
      }
      if (error.message === 'Contato e obrigatorio') {
        return res.status(400).json({ error: error.message })
      }
    }
    console.error('Erro ao criar oportunidade:', error)
    res.status(500).json({ error: 'Erro ao criar oportunidade' })
  }
})

// PUT /v1/oportunidades/:id - Atualizar oportunidade
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarOportunidadeSchema.parse(req.body)

    const oportunidade = await oportunidadesService.atualizarOportunidade(
      organizacaoId,
      id,
      payload
    )

    res.json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message === 'Oportunidade nao encontrada') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao atualizar oportunidade:', error)
    res.status(500).json({ error: 'Erro ao atualizar oportunidade' })
  }
})

// DELETE /v1/oportunidades/:id - Excluir oportunidade
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await oportunidadesService.excluirOportunidade(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Oportunidade nao encontrada') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao excluir oportunidade:', error)
    res.status(500).json({ error: 'Erro ao excluir oportunidade' })
  }
})

// =====================================================
// ACOES ESPECIFICAS
// =====================================================

// PATCH /v1/oportunidades/:id/etapa - Mover de etapa (Drag & Drop)
router.patch('/:id/etapa', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = MoverEtapaSchema.parse(req.body)

    const oportunidade = await oportunidadesService.moverEtapa(organizacaoId, id, payload)

    res.json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message === 'Oportunidade nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (
        error.message.includes('outro funil') ||
        error.message.includes('Use o endpoint de fechar')
      ) {
        return res.status(400).json({ error: error.message })
      }
    }
    console.error('Erro ao mover oportunidade:', error)
    res.status(500).json({ error: 'Erro ao mover oportunidade' })
  }
})

// PATCH /v1/oportunidades/:id/fechar - Fechar oportunidade (Ganho/Perda)
router.patch('/:id/fechar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = FecharOportunidadeSchema.parse(req.body)

    const oportunidade = await oportunidadesService.fecharOportunidade(organizacaoId, id, payload)

    res.json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message === 'Oportunidade nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('ja esta fechada') || error.message.includes('obrigatorio')) {
        return res.status(400).json({ error: error.message })
      }
    }
    console.error('Erro ao fechar oportunidade:', error)
    res.status(500).json({ error: 'Erro ao fechar oportunidade' })
  }
})

// PATCH /v1/oportunidades/:id/atribuir - Atribuir responsavel
router.patch('/:id/atribuir', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtribuirResponsavelSchema.parse(req.body)

    const oportunidade = await oportunidadesService.atribuirResponsavel(
      organizacaoId,
      id,
      payload.usuario_responsavel_id
    )

    res.json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atribuir responsavel:', error)
    res.status(500).json({ error: 'Erro ao atribuir responsavel' })
  }
})

// PATCH /v1/oportunidades/:id/qualificar - Qualificar (MQL/SQL)
router.patch('/:id/qualificar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = QualificarOportunidadeSchema.parse(req.body)

    const oportunidade = await oportunidadesService.qualificar(
      organizacaoId,
      id,
      payload.tipo,
      payload.qualificado
    )

    res.json(oportunidade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao qualificar oportunidade:', error)
    res.status(500).json({ error: 'Erro ao qualificar oportunidade' })
  }
})

// =====================================================
// DISTRIBUICAO
// =====================================================

// POST /v1/oportunidades/:id/distribuir - Redistribuir manualmente
router.post('/:id/distribuir', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    // Limpar responsavel atual
    await oportunidadesService.atribuirResponsavel(organizacaoId, id, null)

    // Redistribuir
    const novoResponsavel = await distribuicaoService.distribuirOportunidade(organizacaoId, id)

    res.json({ usuario_responsavel_id: novoResponsavel })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Oportunidade nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Nao ha')) {
        return res.status(400).json({ error: error.message })
      }
    }
    console.error('Erro ao distribuir oportunidade:', error)
    res.status(500).json({ error: 'Erro ao distribuir oportunidade' })
  }
})

// GET /v1/oportunidades/:id/historico-distribuicao - Historico de distribuicao
router.get('/:id/historico-distribuicao', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const historico = await distribuicaoService.listarHistorico(organizacaoId, id)

    res.json({ historico })
  } catch (error) {
    console.error('Erro ao listar historico:', error)
    res.status(500).json({ error: 'Erro ao listar historico' })
  }
})

// =====================================================
// PRODUTOS DA OPORTUNIDADE
// =====================================================

// GET /v1/oportunidades/:id/produtos - Listar produtos
router.get('/:id/produtos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    // Buscar oportunidade com detalhes ja inclui produtos
    const oportunidade = await oportunidadesService.buscarOportunidadeDetalhe(organizacaoId, id)

    if (!oportunidade) {
      return res.status(404).json({ error: 'Oportunidade nao encontrada' })
    }

    res.json({ produtos: oportunidade.produtos || [] })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    res.status(500).json({ error: 'Erro ao listar produtos' })
  }
})

// POST /v1/oportunidades/:id/produtos - Adicionar produto
router.post('/:id/produtos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AdicionarProdutoSchema.parse(req.body)

    // Importar supabase diretamente para operacao simples
    const { supabaseAdmin } = await import('../config/supabase')

    const { data, error } = await supabaseAdmin
      .from('oportunidades_produtos')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: id,
        produto_id: payload.produto_id,
        quantidade: payload.quantidade,
        preco_unitario: payload.preco_unitario || 0,
        desconto_percentual: payload.desconto_percentual || 0,
        subtotal: 0, // Calculado por trigger
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao adicionar produto: ${error.message}`)
    }

    res.status(201).json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao adicionar produto:', error)
    res.status(500).json({ error: 'Erro ao adicionar produto' })
  }
})

// PUT /v1/oportunidades/:id/produtos/:produtoId - Atualizar produto
router.put('/:id/produtos/:produtoId', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, produtoId } = req.params

    const payload = AtualizarProdutoOportunidadeSchema.parse(req.body)

    const { supabaseAdmin } = await import('../config/supabase')

    const { data, error } = await supabaseAdmin
      .from('oportunidades_produtos')
      .update(payload)
      .eq('organizacao_id', organizacaoId)
      .eq('oportunidade_id', id)
      .eq('id', produtoId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar produto: ${error.message}`)
    }

    res.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar produto:', error)
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

// DELETE /v1/oportunidades/:id/produtos/:produtoId - Remover produto
router.delete('/:id/produtos/:produtoId', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id, produtoId } = req.params

    const { supabaseAdmin } = await import('../config/supabase')

    const { error } = await supabaseAdmin
      .from('oportunidades_produtos')
      .delete()
      .eq('organizacao_id', organizacaoId)
      .eq('oportunidade_id', id)
      .eq('id', produtoId)

    if (error) {
      throw new Error(`Erro ao remover produto: ${error.message}`)
    }

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao remover produto:', error)
    res.status(500).json({ error: 'Erro ao remover produto' })
  }
})

export default router
