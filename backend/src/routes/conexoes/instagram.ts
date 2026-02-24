/**
 * AIDEV-NOTE: Routes para Instagram Direct
 * Conforme PRD-08 - Secao 4. Instagram Direct
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import instagramService from '../../services/instagram.service'
import {
  ConectarContaInstagramSchema,
  EnviarMensagemInstagramSchema,
} from '../../schemas/conexoes/instagram'

const router = Router()

// =====================================================
// Conexao
// =====================================================

/**
 * GET /api/v1/conexoes/instagram/contas
 * Lista contas Instagram disponiveis (via Meta)
 */
router.get('/contas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await instagramService.listarContasInstagram(organizacaoId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/instagram/conectar
 * Conecta conta Instagram
 */
router.post('/conectar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = ConectarContaInstagramSchema.parse(req.body)
    const result = await instagramService.conectarConta(
      organizacaoId,
      usuarioId,
      dados.instagram_id,
      dados.page_id
    )
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

// =====================================================
// Status e Desconexao
// =====================================================

/**
 * GET /api/v1/conexoes/instagram
 * Obtem status da conexao Instagram
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await instagramService.obterStatus(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/instagram
 * Desconecta Instagram
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await instagramService.desconectar(organizacaoId, usuarioId)
    res.json({ success: true, message: 'Instagram desconectado' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Conversas e Mensagens
// =====================================================

/**
 * GET /api/v1/conexoes/instagram/conversas
 * Lista conversas do Instagram Direct
 */
router.get('/conversas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id
    const limit = parseInt(req.query.limit as string) || 20
    const cursor = req.query.cursor as string | undefined

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await instagramService.listarConversas(organizacaoId, usuarioId, limit, cursor)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/instagram/conversas/:conversation_id/mensagens
 * Lista mensagens de uma conversa
 */
router.get('/conversas/:conversation_id/mensagens', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id
    const conversationId = req.params.conversation_id
    const limit = parseInt(req.query.limit as string) || 50
    const cursor = req.query.cursor as string | undefined

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await instagramService.listarMensagens(
      organizacaoId,
      usuarioId,
      conversationId,
      limit,
      cursor
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/instagram/mensagens
 * Envia mensagem via Instagram Direct
 */
router.post('/mensagens', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = EnviarMensagemInstagramSchema.parse(req.body)
    const result = await instagramService.enviarMensagem(organizacaoId, usuarioId, dados)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

// =====================================================
// Webhook Instagram (rota publica)
// =====================================================

// AIDEV-NOTE: Validação HMAC-SHA256 compartilhada com Meta (mesma app secret)
function validateMetaHmac(rawBody: string, signatureHeader: string | undefined, appSecret: string | undefined): boolean {
  if (!appSecret) {
    console.warn('[Instagram Webhook] META_APP_SECRET não configurado — HMAC não validado')
    return true
  }
  if (!signatureHeader) return false
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`
  const received = Buffer.from(signatureHeader)
  const expectedBuf = Buffer.from(expected)
  if (received.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(received, expectedBuf)
}

/**
 * GET /webhooks/instagram
 * Verificacao do webhook (Meta envia challenge)
 */
export const instagramWebhookVerify = (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'crm_renove_webhook'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook Instagram verificado')
    return res.status(200).send(challenge)
  }

  return res.sendStatus(403)
}

/**
 * POST /webhooks/instagram
 * Recebe webhooks do Instagram
 * AIDEV-NOTE: Valida X-Hub-Signature-256 (HMAC-SHA256) antes de processar
 */
export const instagramWebhookHandler = async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody || ''
  const signature = req.headers['x-hub-signature-256'] as string | undefined
  const appSecret = process.env.META_APP_SECRET

  if (!validateMetaHmac(rawBody, signature, appSecret)) {
    console.warn('[Instagram Webhook] Assinatura inválida — requisição rejeitada')
    return res.status(401).json({ error: 'Assinatura inválida' })
  }

  try {
    await instagramService.processarWebhook(req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Erro no webhook Instagram:', error)
    res.json({ success: false })
  }
}

export default router
