/**
 * AIDEV-NOTE: Rotas para Gestao de Equipes, Usuarios e Perfis
 * Conforme PRD-05 - Gestao de Equipe
 *
 * Admin Only - Members nao podem acessar estas rotas
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import equipeService from '../services/equipe.service'
import {
  CriarEquipeSchema,
  AtualizarEquipeSchema,
  AdicionarMembroSchema,
  ConvidarUsuarioSchema,
  AtualizarUsuarioSchema,
  AlterarStatusUsuarioSchema,
  CriarPerfilSchema,
  AtualizarPerfilSchema,
  ListarUsuariosQuerySchema,
  ListarEquipesQuerySchema,
} from '../schemas/equipe'

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

// Aplicar requireAdmin em TODAS as rotas deste router
router.use(requireAdmin)

// =====================================================
// EQUIPES
// =====================================================

// GET /v1/equipes - Listar equipes
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const query = ListarEquipesQuerySchema.parse(req.query)

    const result = await equipeService.listarEquipes(organizacaoId, {
      busca: query.busca,
      ativa: query.ativa === 'true' ? true : query.ativa === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar equipes:', error)
    res.status(500).json({ error: 'Erro ao listar equipes' })
  }
})

// GET /v1/equipes/:id - Buscar equipe
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const equipe = await equipeService.buscarEquipe(organizacaoId, id)

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe nao encontrada' })
    }

    res.json(equipe)
  } catch (error) {
    console.error('Erro ao buscar equipe:', error)
    res.status(500).json({ error: 'Erro ao buscar equipe' })
  }
})

// POST /v1/equipes - Criar equipe
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarEquipeSchema.parse(req.body)

    const equipe = await equipeService.criarEquipe(organizacaoId, payload, userId)

    res.status(201).json(equipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar equipe:', error)
    res.status(500).json({ error: 'Erro ao criar equipe' })
  }
})

// PATCH /v1/equipes/:id - Atualizar equipe
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarEquipeSchema.parse(req.body)

    const equipe = await equipeService.atualizarEquipe(organizacaoId, id, payload)

    res.json(equipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar equipe:', error)
    res.status(500).json({ error: 'Erro ao atualizar equipe' })
  }
})

// DELETE /v1/equipes/:id - Excluir equipe
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await equipeService.excluirEquipe(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir equipe:', error)
    res.status(500).json({ error: 'Erro ao excluir equipe' })
  }
})

// POST /v1/equipes/:id/membros - Adicionar membro a equipe
router.post('/:id/membros', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = getUserId(req)

    const payload = AdicionarMembroSchema.parse(req.body)

    await equipeService.adicionarMembroEquipe(id, payload, userId)

    res.status(201).json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('ja e membro')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao adicionar membro:', error)
    res.status(500).json({ error: 'Erro ao adicionar membro' })
  }
})

// DELETE /v1/equipes/:id/membros/:usuarioId - Remover membro da equipe
router.delete('/:id/membros/:usuarioId', async (req: Request, res: Response) => {
  try {
    const { id, usuarioId } = req.params

    await equipeService.removerMembroEquipe(id, usuarioId)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao remover membro:', error)
    res.status(500).json({ error: 'Erro ao remover membro' })
  }
})

// PATCH /v1/equipes/:id/membros/:usuarioId/papel - Alterar papel do membro
router.patch('/:id/membros/:usuarioId/papel', async (req: Request, res: Response) => {
  try {
    const { id, usuarioId } = req.params
    const { papel } = req.body

    if (!['lider', 'membro'].includes(papel)) {
      return res.status(400).json({ error: 'Papel invalido' })
    }

    await equipeService.alterarPapelMembro(id, usuarioId, papel)

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao alterar papel:', error)
    res.status(500).json({ error: 'Erro ao alterar papel' })
  }
})

export default router

// =====================================================
// ROUTER PARA USUARIOS
// =====================================================

export const usuariosRouter = Router()

usuariosRouter.use(requireAdmin)

// GET /v1/usuarios - Listar usuarios do tenant
usuariosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const query = ListarUsuariosQuerySchema.parse(req.query)

    const result = await equipeService.listarUsuarios(organizacaoId, {
      busca: query.busca,
      status: query.status,
      equipeId: query.equipe_id,
      papelId: query.papel_id,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar usuarios:', error)
    res.status(500).json({ error: 'Erro ao listar usuarios' })
  }
})

// GET /v1/usuarios/:id - Buscar usuario
usuariosRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const usuario = await equipeService.buscarUsuario(organizacaoId, id)

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario nao encontrado' })
    }

    res.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuario:', error)
    res.status(500).json({ error: 'Erro ao buscar usuario' })
  }
})

// POST /v1/usuarios - Convidar usuario
usuariosRouter.post('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = ConvidarUsuarioSchema.parse(req.body)

    const usuario = await equipeService.convidarUsuario(organizacaoId, payload, userId)

    res.status(201).json(usuario)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('email')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao convidar usuario:', error)
    res.status(500).json({ error: 'Erro ao convidar usuario' })
  }
})

// PATCH /v1/usuarios/:id - Atualizar usuario
usuariosRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarUsuarioSchema.parse(req.body)

    const usuario = await equipeService.atualizarUsuario(organizacaoId, id, payload)

    res.json(usuario)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar usuario:', error)
    res.status(500).json({ error: 'Erro ao atualizar usuario' })
  }
})

// PATCH /v1/usuarios/:id/status - Alterar status do usuario
usuariosRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AlterarStatusUsuarioSchema.parse(req.body)

    const usuario = await equipeService.alterarStatusUsuario(organizacaoId, id, payload)

    res.json(usuario)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao alterar status:', error)
    res.status(500).json({ error: 'Erro ao alterar status' })
  }
})

// POST /v1/usuarios/:id/reenviar-convite - Reenviar convite
usuariosRouter.post('/:id/reenviar-convite', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await equipeService.reenviarConvite(organizacaoId, id)

    res.json({ success: true, message: 'Convite reenviado com sucesso' })
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao reenviar convite:', error)
    res.status(500).json({ error: 'Erro ao reenviar convite' })
  }
})

// =====================================================
// ROUTER PARA PERFIS DE PERMISSAO
// =====================================================

export const perfisRouter = Router()

perfisRouter.use(requireAdmin)

// GET /v1/perfis-permissao - Listar perfis
perfisRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await equipeService.listarPerfis(organizacaoId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao listar perfis:', error)
    res.status(500).json({ error: 'Erro ao listar perfis' })
  }
})

// GET /v1/perfis-permissao/:id - Buscar perfil
perfisRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const perfil = await equipeService.buscarPerfil(organizacaoId, id)

    if (!perfil) {
      return res.status(404).json({ error: 'Perfil nao encontrado' })
    }

    res.json(perfil)
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    res.status(500).json({ error: 'Erro ao buscar perfil' })
  }
})

// POST /v1/perfis-permissao - Criar perfil
perfisRouter.post('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarPerfilSchema.parse(req.body)

    const perfil = await equipeService.criarPerfil(organizacaoId, payload, userId)

    res.status(201).json(perfil)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar perfil:', error)
    res.status(500).json({ error: 'Erro ao criar perfil' })
  }
})

// PATCH /v1/perfis-permissao/:id - Atualizar perfil
perfisRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarPerfilSchema.parse(req.body)

    const perfil = await equipeService.atualizarPerfil(organizacaoId, id, payload)

    res.json(perfil)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    console.error('Erro ao atualizar perfil:', error)
    res.status(500).json({ error: 'Erro ao atualizar perfil' })
  }
})

// DELETE /v1/perfis-permissao/:id - Excluir perfil
perfisRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await equipeService.excluirPerfil(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('sistema')) {
      return res.status(403).json({ error: error.message })
    }
    if (error instanceof Error && error.message.includes('usuarios vinculados')) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao excluir perfil:', error)
    res.status(500).json({ error: 'Erro ao excluir perfil' })
  }
})
