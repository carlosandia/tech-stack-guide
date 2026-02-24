/**
 * AIDEV-NOTE: Rotas publicas para Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 *
 * SEM autenticacao - acesso publico para renderizacao e submissao
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import submissoesService from '../services/submissoes-formularios.service.js'
import { SubmeterFormularioPublicoSchema } from '../schemas/formularios.js'

const router = Router()

// AIDEV-NOTE: SEGURANCA - Rate limit por IP para prevenir spam de submissao publica
const submissaoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Muitas submissoes. Tente novamente em alguns instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// =====================================================
// GET /:slug - Buscar formulario publico por slug
// =====================================================

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const resultado = await submissoesService.buscarFormularioPublico(slug)

    if (!resultado) {
      return res.status(404).json({ error: 'Formulario nao encontrado' })
    }

    res.json(resultado)
  } catch (error) {
    console.error('Erro ao buscar formulario publico:', error)
    res.status(500).json({ error: 'Erro ao carregar formulario' })
  }
})

// =====================================================
// POST /:slug/submeter - Submeter formulario publico
// =====================================================

router.post('/:slug/submeter', submissaoLimiter, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const payload = SubmeterFormularioPublicoSchema.parse(req.body)

    // Extrair IP e User Agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || '0.0.0.0'
    const userAgent = req.headers['user-agent'] || ''

    const resultado = await submissoesService.submeterFormulario(slug, payload, ipAddress, userAgent)

    if (!resultado.sucesso) {
      return res.status(400).json({ error: resultado.mensagem })
    }

    res.status(201).json(resultado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    console.error('Erro ao submeter formulario:', error)
    res.status(500).json({ error: 'Erro ao processar submissao' })
  }
})

export default router
