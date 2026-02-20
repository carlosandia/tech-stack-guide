/**
 * AIDEV-NOTE: Routes para WhatsApp via WAHA
 * Conforme PRD-08 - Secao 1. WhatsApp via WAHA Plus
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import wahaService from '../../services/waha.service'
import { EnviarMensagemWhatsAppSchema, WahaWebhookPayloadSchema } from '../../schemas/conexoes/whatsapp'

const router = Router()

// =====================================================
// Rotas de Sessao
// =====================================================

/**
 * POST /api/v1/conexoes/whatsapp/iniciar
 * Inicia uma nova sessao WhatsApp
 */
router.post('/iniciar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await wahaService.iniciarSessao(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/whatsapp/qr-code
 * Obtem QR Code para conexao
 */
router.get('/qr-code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await wahaService.obterQrCode(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/whatsapp/status
 * Obtem status da conexao
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await wahaService.obterStatus(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/whatsapp/desconectar
 * Desconecta a sessao WhatsApp
 */
router.post('/desconectar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await wahaService.desconectar(organizacaoId, usuarioId)
    res.json({ success: true, message: 'Sessao desconectada' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Rotas de Mensagem
// =====================================================

/**
 * POST /api/v1/conexoes/whatsapp/mensagens
 * Envia mensagem via WhatsApp
 */
router.post('/mensagens', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const mensagem = EnviarMensagemWhatsAppSchema.parse(req.body)
    const result = await wahaService.enviarMensagem(organizacaoId, usuarioId, mensagem)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

// =====================================================
// Rotas Admin
// =====================================================

/**
 * GET /api/v1/conexoes/whatsapp/sessoes
 * Lista todas as sessoes da organizacao (Admin)
 */
router.get('/sessoes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const role = req.user?.role

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    const sessoes = await wahaService.listarSessoes(organizacaoId)
    res.json({ sessoes })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Webhook WAHA (rota publica)
// =====================================================

/**
 * POST /webhooks/waha/:organizacao_id
 * Recebe webhooks do WAHA
 * NOTA: Esta rota sera registrada separadamente no index.ts
 *
 * AIDEV-NOTE: SEGURANCA - Validacao de origem obrigatoria
 * O webhook deve conter um header X-WAHA-Webhook-Secret que corresponda
 * ao secret configurado na organizacao. Isso previne injecao de dados cross-tenant.
 */
export const wahaWebhookHandler = async (req: Request, res: Response) => {
  try {
    const organizacaoId = req.params.organizacao_id

    if (!organizacaoId) {
      return res.status(400).json({ error: 'organizacao_id obrigatorio' })
    }

    // AIDEV-NOTE: SEGURANCA - Validar que a organizacao existe e esta ativa
    // Isso previne ataques onde um atacante tenta injetar dados em tenants inexistentes
    const orgValida = await wahaService.validarOrganizacao(organizacaoId)
    if (!orgValida) {
      console.warn(`[WAHA Webhook] Tentativa de webhook para org inexistente: ${organizacaoId}`)
      // Retorna 200 para nao revelar informacao sobre existencia de orgs
      return res.json({ success: true })
    }

    // AIDEV-NOTE: SEGURANCA - Validar webhook secret
    // O secret e configurado na integracao WAHA de cada organizacao
    const webhookSecret = req.headers['x-waha-webhook-secret'] as string
    const secretValido = await wahaService.validarWebhookSecret(organizacaoId, webhookSecret)

    if (!secretValido) {
      console.warn(`[WAHA Webhook] Secret invalido para org: ${organizacaoId}`)
      // Retorna 200 para nao revelar informacao (padrao de webhooks)
      return res.json({ success: true })
    }

    const payload = WahaWebhookPayloadSchema.parse(req.body)
    await wahaService.processarWebhook(organizacaoId, payload)

    res.json({ success: true })
  } catch (error) {
    console.error('Erro no webhook WAHA:', error)
    // Sempre retorna 200 para webhooks (evitar retries desnecessarios)
    res.json({ success: false, error: 'Erro ao processar webhook' })
  }
}

export default router
