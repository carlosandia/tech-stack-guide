/**
 * AIDEV-NOTE: Rotas para Integracoes OAuth
 * Conforme PRD-05 - Conexoes com Plataformas Externas
 *
 * Admin Only - Members nao podem gerenciar integracoes
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import integracoesService from '../services/integracoes.service'
import { PlataformaIntegracaoEnum } from '../schemas/integracoes'

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
// GET /v1/integracoes - Listar integracoes (Admin Only)
// =====================================================

router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { plataforma, ativa } = req.query

    const result = await integracoesService.listarIntegracoes(organizacaoId, {
      plataforma: plataforma ? PlataformaIntegracaoEnum.parse(plataforma) : undefined,
      ativa: ativa === 'true' ? true : ativa === 'false' ? false : undefined,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Plataforma invalida', details: error.errors })
    }
    console.error('Erro ao listar integracoes:', error)
    res.status(500).json({ error: 'Erro ao listar integracoes' })
  }
})

// =====================================================
// GET /v1/integracoes/:id - Buscar integracao (Admin Only)
// =====================================================

router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const integracao = await integracoesService.buscarIntegracao(organizacaoId, id)

    if (!integracao) {
      return res.status(404).json({ error: 'Integracao nao encontrada' })
    }

    res.json(integracao)
  } catch (error) {
    console.error('Erro ao buscar integracao:', error)
    res.status(500).json({ error: 'Erro ao buscar integracao' })
  }
})

// =====================================================
// GET /v1/integracoes/:plataforma/auth-url - URL OAuth (Admin Only)
// =====================================================

router.get('/:plataforma/auth-url', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { plataforma } = req.params
    const { redirect_uri } = req.query

    const plataformaValidada = PlataformaIntegracaoEnum.parse(plataforma)

    if (!redirect_uri || typeof redirect_uri !== 'string') {
      return res.status(400).json({ error: 'redirect_uri e obrigatorio' })
    }

    const url = integracoesService.gerarUrlAutenticacao(
      plataformaValidada,
      organizacaoId,
      redirect_uri
    )

    res.json({ url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Plataforma invalida', details: error.errors })
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao gerar URL de autenticacao:', error)
    res.status(500).json({ error: 'Erro ao gerar URL de autenticacao' })
  }
})

// =====================================================
// POST /v1/integracoes/:plataforma/callback - Callback OAuth (Admin Only)
// =====================================================

router.post('/:plataforma/callback', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { plataforma } = req.params
    const { code, state, redirect_uri } = req.body

    const plataformaValidada = PlataformaIntegracaoEnum.parse(plataforma)

    if (!code || !state || !redirect_uri) {
      return res.status(400).json({ error: 'code, state e redirect_uri sao obrigatorios' })
    }

    const integracao = await integracoesService.processarCallbackOAuth(
      plataformaValidada,
      code,
      state,
      redirect_uri
    )

    res.json(integracao)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Plataforma invalida', details: error.errors })
    }
    console.error('Erro ao processar callback OAuth:', error)
    res.status(500).json({ error: 'Erro ao processar callback OAuth' })
  }
})

// =====================================================
// DELETE /v1/integracoes/:id - Desconectar integracao (Admin Only)
// =====================================================

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await integracoesService.desconectarIntegracao(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao desconectar integracao:', error)
    res.status(500).json({ error: 'Erro ao desconectar integracao' })
  }
})

// =====================================================
// POST /v1/integracoes/:id/sync - Forcar sincronizacao (Admin Only)
// =====================================================

router.post('/:id/sync', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const resultado = await integracoesService.sincronizarIntegracao(organizacaoId, id)

    res.json(resultado)
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao sincronizar integracao:', error)
    res.status(500).json({ error: 'Erro ao sincronizar integracao' })
  }
})

export default router
