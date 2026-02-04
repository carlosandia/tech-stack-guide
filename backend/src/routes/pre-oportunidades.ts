/**
 * AIDEV-NOTE: Rotas para Pre-Oportunidades (Inbox WhatsApp)
 * Conforme PRD-07 - Modulo de Negocios (RF-11)
 *
 * Pre-oportunidades sao leads vindos do WhatsApp que precisam
 * de triagem antes de virar uma oportunidade real.
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import preOportunidadesService from '../services/pre-oportunidades.service'
import {
  ListarPreOportunidadesQuerySchema,
  AceitarPreOportunidadeSchema,
  RejeitarPreOportunidadeSchema,
  CriarPreOportunidadeWebhookSchema,
} from '../schemas/pre-oportunidades'

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

function getUserId(req: Request): string {
  const user = (req as any).user
  if (!user?.id) {
    throw new Error('Usuario nao autenticado')
  }
  return user.id
}

// =====================================================
// PRE-OPORTUNIDADES - LISTAGEM
// =====================================================

// GET /v1/pre-oportunidades - Listar pre-oportunidades
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = ListarPreOportunidadesQuerySchema.parse(req.query)

    const result = await preOportunidadesService.listarPreOportunidades(organizacaoId, query)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    }
    console.error('Erro ao listar pre-oportunidades:', error)
    res.status(500).json({ error: 'Erro ao listar pre-oportunidades' })
  }
})

// GET /v1/pre-oportunidades/cards/:funilId - Cards para coluna Solicitacoes
router.get('/cards/:funilId', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funilId } = req.params

    const cards = await preOportunidadesService.listarCards(organizacaoId, funilId)

    res.json({ cards, total: cards.length })
  } catch (error) {
    console.error('Erro ao listar cards:', error)
    res.status(500).json({ error: 'Erro ao listar cards' })
  }
})

// GET /v1/pre-oportunidades/contagem - Contar pendentes
router.get('/contagem', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { funil_id } = req.query

    const total = await preOportunidadesService.contarPendentes(
      organizacaoId,
      funil_id as string | undefined
    )

    res.json({ total })
  } catch (error) {
    console.error('Erro ao contar pendentes:', error)
    res.status(500).json({ error: 'Erro ao contar pendentes' })
  }
})

// GET /v1/pre-oportunidades/:id - Buscar pre-oportunidade
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const { id } = req.params

    const preOportunidade = await preOportunidadesService.buscarPreOportunidade(organizacaoId, id)

    if (!preOportunidade) {
      return res.status(404).json({ error: 'Pre-oportunidade nao encontrada' })
    }

    res.json(preOportunidade)
  } catch (error) {
    console.error('Erro ao buscar pre-oportunidade:', error)
    res.status(500).json({ error: 'Erro ao buscar pre-oportunidade' })
  }
})

// =====================================================
// PRE-OPORTUNIDADES - ACOES
// =====================================================

// POST /v1/pre-oportunidades/:id/aceitar - Aceitar e criar oportunidade
router.post('/:id/aceitar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const { id } = req.params

    const payload = AceitarPreOportunidadeSchema.parse(req.body)

    const result = await preOportunidadesService.aceitarPreOportunidade(
      organizacaoId,
      id,
      payload,
      userId
    )

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message === 'Pre-oportunidade nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('ja foi processada')) {
        return res.status(409).json({ error: error.message })
      }
    }
    console.error('Erro ao aceitar pre-oportunidade:', error)
    res.status(500).json({ error: 'Erro ao aceitar pre-oportunidade' })
  }
})

// POST /v1/pre-oportunidades/:id/rejeitar - Rejeitar
router.post('/:id/rejeitar', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const userId = getUserId(req)
    const { id } = req.params

    const payload = RejeitarPreOportunidadeSchema.parse(req.body)

    await preOportunidadesService.rejeitarPreOportunidade(organizacaoId, id, payload, userId)

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message === 'Pre-oportunidade nao encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('ja foi processada')) {
        return res.status(409).json({ error: error.message })
      }
    }
    console.error('Erro ao rejeitar pre-oportunidade:', error)
    res.status(500).json({ error: 'Erro ao rejeitar pre-oportunidade' })
  }
})

// =====================================================
// WEBHOOK - INTEGRACAO WHATSAPP
// =====================================================

// POST /v1/pre-oportunidades/webhook - Receber mensagem do WhatsApp
// AIDEV-NOTE: Esta rota NAO requer autenticacao de usuario
// A validacao e feita por assinatura/token da integracao
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Validar payload do webhook
    const payload = CriarPreOportunidadeWebhookSchema.parse(req.body)

    // Buscar organizacao da integracao
    const { supabaseAdmin } = await import('../config/supabase')

    const { data: integracao, error: integracaoError } = await supabaseAdmin
      .from('integracoes')
      .select('organizacao_id')
      .eq('id', payload.integracao_id)
      .eq('ativo', true)
      .single()

    if (integracaoError || !integracao) {
      return res.status(400).json({ error: 'Integracao invalida ou inativa' })
    }

    // Criar ou atualizar pre-oportunidade
    const preOportunidade = await preOportunidadesService.criarPreOportunidade(
      integracao.organizacao_id,
      payload
    )

    res.status(201).json({ id: preOportunidade.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Payload invalido', details: error.errors })
    }
    console.error('Erro no webhook:', error)
    res.status(500).json({ error: 'Erro ao processar webhook' })
  }
})

export default router
