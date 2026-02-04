/**
 * AIDEV-NOTE: Rotas para Produtos e Categorias
 * Conforme PRD-05 - Catalogo de Produtos
 *
 * Admin: CRUD completo
 * Member: Somente leitura
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import produtosService from '../services/produtos.service'
import {
  CriarProdutoSchema,
  AtualizarProdutoSchema,
  CriarCategoriaSchema,
  AtualizarCategoriaSchema,
  ListarProdutosQuerySchema,
} from '../schemas/produtos'

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
// CATEGORIAS
// =====================================================

// GET /v1/categorias-produtos - Listar categorias
router.get('/categorias', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await produtosService.listarCategorias(organizacaoId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    res.status(500).json({ error: 'Erro ao listar categorias' })
  }
})

// GET /v1/categorias-produtos/:id - Buscar categoria
router.get('/categorias/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const categoria = await produtosService.buscarCategoria(organizacaoId, id)

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria nao encontrada' })
    }

    res.json(categoria)
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    res.status(500).json({ error: 'Erro ao buscar categoria' })
  }
})

// POST /v1/categorias-produtos - Criar categoria (Admin Only)
router.post('/categorias', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarCategoriaSchema.parse(req.body)

    const categoria = await produtosService.criarCategoria(organizacaoId, payload, userId)

    res.status(201).json(categoria)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar categoria:', error)
    res.status(500).json({ error: 'Erro ao criar categoria' })
  }
})

// PATCH /v1/categorias-produtos/:id - Atualizar categoria (Admin Only)
router.patch('/categorias/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarCategoriaSchema.parse(req.body)

    const categoria = await produtosService.atualizarCategoria(organizacaoId, id, payload)

    res.json(categoria)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar categoria:', error)
    res.status(500).json({ error: 'Erro ao atualizar categoria' })
  }
})

// DELETE /v1/categorias-produtos/:id - Excluir categoria (Admin Only)
router.delete('/categorias/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await produtosService.excluirCategoria(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('produtos vinculados')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao excluir categoria:', error)
    res.status(500).json({ error: 'Erro ao excluir categoria' })
  }
})

// =====================================================
// PRODUTOS
// =====================================================

// GET /v1/produtos - Listar produtos
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const query = ListarProdutosQuerySchema.parse(req.query)

    const result = await produtosService.listarProdutos(organizacaoId, {
      categoriaId: query.categoria_id,
      busca: query.busca,
      ativo: query.ativo === 'true' ? true : query.ativo === 'false' ? false : undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar produtos:', error)
    res.status(500).json({ error: 'Erro ao listar produtos' })
  }
})

// GET /v1/produtos/:id - Buscar produto
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const produto = await produtosService.buscarProduto(organizacaoId, id)

    if (!produto) {
      return res.status(404).json({ error: 'Produto nao encontrado' })
    }

    res.json(produto)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    res.status(500).json({ error: 'Erro ao buscar produto' })
  }
})

// POST /v1/produtos - Criar produto (Admin Only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarProdutoSchema.parse(req.body)

    const produto = await produtosService.criarProduto(organizacaoId, payload, userId)

    res.status(201).json(produto)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('codigo')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao criar produto:', error)
    res.status(500).json({ error: 'Erro ao criar produto' })
  }
})

// PATCH /v1/produtos/:id - Atualizar produto (Admin Only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarProdutoSchema.parse(req.body)

    const produto = await produtosService.atualizarProduto(organizacaoId, id, payload)

    res.json(produto)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('codigo')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao atualizar produto:', error)
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

// DELETE /v1/produtos/:id - Excluir produto (Admin Only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await produtosService.excluirProduto(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    res.status(500).json({ error: 'Erro ao excluir produto' })
  }
})

export default router
