/**
 * AIDEV-NOTE: Routes para Meta (Facebook/Instagram - Lead Ads, CAPI, Audiences)
 * Conforme PRD-08 - Secoes 2, 3, 4
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import metaService from '../../services/meta.service'
import { supabaseAdmin } from '../../config/supabase'
import {
  CriarMapeamentoFormularioSchema,
  ConfigurarCapiSchema,
  EventoCapiPayloadSchema,
  CriarCustomAudienceSchema,
  AdicionarMembrosAudienceSchema,
} from '../../schemas/conexoes/meta'

const router = Router()

// =====================================================
// OAuth Flow
// =====================================================

/**
 * GET /api/v1/conexoes/meta/auth-url
 * Gera URL de autorizacao OAuth
 */
router.get('/auth-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.gerarAuthUrl(organizacaoId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/meta/callback
 * Callback OAuth (rota publica para redirect do Meta)
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=${oauthError}`)
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Code e state obrigatorios' })
    }

    await metaService.processarCallback(code as string, state as string)

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?success=meta`)
  } catch (error) {
    console.error('Erro no callback Meta:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=callback_failed`)
  }
})

// =====================================================
// Status e Desconexao
// =====================================================

/**
 * GET /api/v1/conexoes/meta
 * Obtem status da conexao Meta
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.obterStatus(organizacaoId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/meta
 * Desconecta Meta
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await metaService.desconectar(organizacaoId)
    res.json({ success: true, message: 'Meta desconectado' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Paginas
// =====================================================

/**
 * GET /api/v1/conexoes/meta/paginas
 * Lista paginas do usuario
 */
router.get('/paginas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.listarPaginas(organizacaoId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/paginas/:page_id/selecionar
 * Seleciona/conecta uma pagina
 */
router.post('/paginas/:page_id/selecionar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const pageId = req.params.page_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.selecionarPagina(organizacaoId, pageId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Lead Ads - Formularios
// =====================================================

/**
 * GET /api/v1/conexoes/meta/formularios/:page_id
 * Lista formularios de Lead Ads de uma pagina
 */
router.get('/formularios/:page_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const pageId = req.params.page_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.listarFormularios(organizacaoId, pageId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/formularios
 * Cria mapeamento de formulario para funil
 */
router.post('/formularios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = CriarMapeamentoFormularioSchema.parse(req.body)
    const result = await metaService.criarMapeamentoFormulario(
      organizacaoId,
      dados.page_id,
      dados.form_id,
      dados.funil_id,
      dados.mapeamento_campos
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
// Conversions API (CAPI)
// =====================================================

/**
 * GET /api/v1/conexoes/meta/capi
 * Obtem configuracao CAPI
 */
router.get('/capi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const { data } = await supabaseAdmin
      .from('config_conversions_api')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!data) {
      return res.json({ configurado: false })
    }

    res.json({
      configurado: true,
      pixel_id: data.pixel_id,
      pixel_name: data.pixel_name,
      test_event_code: data.test_event_code,
      ativo: data.ativo,
      total_eventos_enviados: data.total_eventos_enviados,
      ultimo_evento_em: data.ultimo_evento_em,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/capi
 * Configura Conversions API
 */
router.post('/capi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = ConfigurarCapiSchema.parse(req.body)
    const result = await metaService.configurarCapi(organizacaoId, dados.pixel_id, dados.access_token)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/capi/evento
 * Envia evento para CAPI
 */
router.post('/capi/evento', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const evento = EventoCapiPayloadSchema.parse(req.body)
    const result = await metaService.enviarEventoCapi(organizacaoId, evento)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/capi/testar
 * Envia evento de teste para CAPI
 */
router.post('/capi/testar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    // Envia evento de teste
    const eventoTeste = {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website' as const,
      user_data: {
        client_ip_address: req.ip || '127.0.0.1',
        client_user_agent: req.get('user-agent') || 'Test',
      },
    }

    const result = await metaService.enviarEventoCapi(organizacaoId, eventoTeste)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Custom Audiences
// =====================================================

/**
 * GET /api/v1/conexoes/meta/audiences
 * Lista Custom Audiences
 */
router.get('/audiences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await metaService.listarAudiences(organizacaoId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/audiences
 * Cria Custom Audience
 */
router.post('/audiences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = CriarCustomAudienceSchema.parse(req.body)
    const result = await metaService.criarAudience(organizacaoId, dados)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/meta/audiences/:audience_id/membros
 * Adiciona membros a Custom Audience
 */
router.post('/audiences/:audience_id/membros', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const audienceId = req.params.audience_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = AdicionarMembrosAudienceSchema.parse(req.body)
    const result = await metaService.adicionarMembrosAudience(organizacaoId, audienceId, dados)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/meta/audiences/:audience_id
 * Remove Custom Audience
 */
router.delete('/audiences/:audience_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const audienceId = req.params.audience_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await metaService.removerAudience(organizacaoId, audienceId)
    res.json({ success: true, message: 'Audience removida' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Webhook Lead Ads (rota publica)
// =====================================================

// AIDEV-NOTE: Validação HMAC-SHA256 conforme spec Meta X-Hub-Signature-256
// Se META_APP_SECRET não estiver configurado, loga warning e permite (backward compat)
function validateMetaHmac(rawBody: string, signatureHeader: string | undefined, appSecret: string | undefined): boolean {
  if (!appSecret) {
    console.warn('[Meta Webhook] META_APP_SECRET não configurado — HMAC não validado')
    return true // backward compat: não bloquear sem secret
  }
  if (!signatureHeader) return false
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`
  const received = Buffer.from(signatureHeader)
  const expectedBuf = Buffer.from(expected)
  if (received.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(received, expectedBuf)
}

/**
 * GET /webhooks/meta-leads
 * Verificacao do webhook (Meta envia challenge)
 */
export const metaLeadsWebhookVerify = (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'crm_renove_webhook'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook Meta verificado')
    return res.status(200).send(challenge)
  }

  return res.sendStatus(403)
}

/**
 * POST /webhooks/meta-leads
 * Recebe webhooks de Lead Ads
 * AIDEV-NOTE: Valida X-Hub-Signature-256 (HMAC-SHA256) antes de processar
 */
export const metaLeadsWebhookHandler = async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody || ''
  const signature = req.headers['x-hub-signature-256'] as string | undefined
  const appSecret = process.env.META_APP_SECRET

  if (!validateMetaHmac(rawBody, signature, appSecret)) {
    console.warn('[Meta Webhook] Assinatura inválida — requisição rejeitada')
    return res.status(401).json({ error: 'Assinatura inválida' })
  }

  try {
    await metaService.processarWebhookLeadAds(req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Erro no webhook Meta Leads:', error)
    res.json({ success: false })
  }
}

export default router
