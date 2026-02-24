/**
 * AIDEV-NOTE: Rotas para Webhooks Bidirecionais
 * Conforme PRD-05 - Webhooks de Entrada e Saida
 *
 * Admin Only - Members nao podem gerenciar webhooks
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import webhooksService from '../services/webhooks.service'
import {
  CriarWebhookEntradaSchema,
  AtualizarWebhookEntradaSchema,
  CriarWebhookSaidaSchema,
  AtualizarWebhookSaidaSchema,
  ListarLogsQuerySchema,
} from '../schemas/webhooks'

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
// WEBHOOKS DE ENTRADA
// =====================================================

// GET /v1/webhooks-entrada - Listar webhooks de entrada
router.get('/entrada', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await webhooksService.listarWebhooksEntrada(organizacaoId)

    // Adicionar URL completa para cada webhook
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    const webhooksComUrl = result.webhooks.map((w) => ({
      ...w,
      url_completa: `${baseUrl}/v1/webhook/${w.url_token}`,
    }))

    res.json({ ...result, webhooks: webhooksComUrl })
  } catch (error) {
    console.error('Erro ao listar webhooks de entrada:', error)
    res.status(500).json({ error: 'Erro ao listar webhooks de entrada' })
  }
})

// GET /v1/webhooks-entrada/:id - Buscar webhook de entrada
router.get('/entrada/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const webhook = await webhooksService.buscarWebhookEntrada(organizacaoId, id)

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook nao encontrado' })
    }

    // Adicionar URL completa
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    res.json({
      ...webhook,
      url_completa: `${baseUrl}/v1/webhook/${webhook.url_token}`,
    })
  } catch (error) {
    console.error('Erro ao buscar webhook de entrada:', error)
    res.status(500).json({ error: 'Erro ao buscar webhook de entrada' })
  }
})

// POST /v1/webhooks-entrada - Criar webhook de entrada
router.post('/entrada', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarWebhookEntradaSchema.parse(req.body)

    const webhook = await webhooksService.criarWebhookEntrada(organizacaoId, payload, userId)

    // Adicionar URL completa
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    res.status(201).json({
      ...webhook,
      url_completa: `${baseUrl}/v1/webhook/${webhook.url_token}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar webhook de entrada:', error)
    res.status(500).json({ error: 'Erro ao criar webhook de entrada' })
  }
})

// PATCH /v1/webhooks-entrada/:id - Atualizar webhook de entrada
router.patch('/entrada/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarWebhookEntradaSchema.parse(req.body)

    const webhook = await webhooksService.atualizarWebhookEntrada(organizacaoId, id, payload)

    res.json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar webhook de entrada:', error)
    res.status(500).json({ error: 'Erro ao atualizar webhook de entrada' })
  }
})

// DELETE /v1/webhooks-entrada/:id - Excluir webhook de entrada
router.delete('/entrada/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await webhooksService.excluirWebhookEntrada(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir webhook de entrada:', error)
    res.status(500).json({ error: 'Erro ao excluir webhook de entrada' })
  }
})

// POST /v1/webhooks-entrada/:id/regenerar-token - Regenerar token
router.post('/entrada/:id/regenerar-token', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const webhook = await webhooksService.regenerarTokenWebhookEntrada(organizacaoId, id)

    // Adicionar URL completa
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    res.json({
      ...webhook,
      url_completa: `${baseUrl}/v1/webhook/${webhook.url_token}`,
    })
  } catch (error) {
    console.error('Erro ao regenerar token:', error)
    res.status(500).json({ error: 'Erro ao regenerar token' })
  }
})

// =====================================================
// WEBHOOKS DE SAIDA
// =====================================================

// GET /v1/webhooks-saida - Listar webhooks de saida
router.get('/saida', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)

    const result = await webhooksService.listarWebhooksSaida(organizacaoId)

    res.json(result)
  } catch (error) {
    console.error('Erro ao listar webhooks de saida:', error)
    res.status(500).json({ error: 'Erro ao listar webhooks de saida' })
  }
})

// GET /v1/webhooks-saida/:id - Buscar webhook de saida
router.get('/saida/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const webhook = await webhooksService.buscarWebhookSaida(organizacaoId, id)

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook nao encontrado' })
    }

    res.json(webhook)
  } catch (error) {
    console.error('Erro ao buscar webhook de saida:', error)
    res.status(500).json({ error: 'Erro ao buscar webhook de saida' })
  }
})

// POST /v1/webhooks-saida - Criar webhook de saida
router.post('/saida', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)

    const payload = CriarWebhookSaidaSchema.parse(req.body)

    const webhook = await webhooksService.criarWebhookSaida(organizacaoId, payload, userId)

    res.status(201).json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao criar webhook de saida:', error)
    res.status(500).json({ error: 'Erro ao criar webhook de saida' })
  }
})

// PATCH /v1/webhooks-saida/:id - Atualizar webhook de saida
router.patch('/saida/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const payload = AtualizarWebhookSaidaSchema.parse(req.body)

    const webhook = await webhooksService.atualizarWebhookSaida(organizacaoId, id, payload)

    res.json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao atualizar webhook de saida:', error)
    res.status(500).json({ error: 'Erro ao atualizar webhook de saida' })
  }
})

// DELETE /v1/webhooks-saida/:id - Excluir webhook de saida
router.delete('/saida/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    await webhooksService.excluirWebhookSaida(organizacaoId, id)

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao excluir webhook de saida:', error)
    res.status(500).json({ error: 'Erro ao excluir webhook de saida' })
  }
})

// POST /v1/webhooks-saida/:id/testar - Testar webhook
router.post('/saida/:id/testar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const resultado = await webhooksService.testarWebhook(organizacaoId, id)

    res.json(resultado)
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao testar webhook:', error)
    res.status(500).json({ error: 'Erro ao testar webhook' })
  }
})

// GET /v1/webhooks-saida/:id/logs - Listar logs de webhook
router.get('/saida/:id/logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const query = ListarLogsQuerySchema.parse(req.query)

    const result = await webhooksService.listarLogsWebhook(organizacaoId, id, {
      evento: query.evento,
      sucesso: query.sucesso === 'true' ? true : query.sucesso === 'false' ? false : undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar logs:', error)
    res.status(500).json({ error: 'Erro ao listar logs' })
  }
})

export default router

// =====================================================
// ROUTER PARA RECEBER WEBHOOKS (Publico)
// =====================================================

export const webhookReceiverRouter = Router()

// AIDEV-NOTE: Rate limit por token para prevenir flood/DoS no receiver público
const webhookReceiverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.params.token || req.ip || 'unknown',
  message: { error: 'Muitos webhooks recebidos. Tente novamente em alguns instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /v1/webhook/:token - Receber webhook de entrada
webhookReceiverRouter.post('/:token', webhookReceiverLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    // Buscar webhook pelo token
    const webhook = await webhooksService.buscarWebhookEntradaPorToken(token)

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook nao encontrado' })
    }

    // Validar API Key se configurada
    if (webhook.api_key) {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')

      if (apiKey !== webhook.api_key) {
        return res.status(401).json({ error: 'API Key invalida' })
      }
    }

    // Registrar request
    await webhooksService.registrarRequestWebhookEntrada(webhook.id)

    // AIDEV-TODO: Processar payload recebido conforme tipo de integracao
    console.log(`Webhook recebido: ${webhook.nome}`, req.body)

    res.json({ success: true, message: 'Webhook recebido com sucesso' })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    res.status(500).json({ error: 'Erro ao processar webhook' })
  }
})
