/**
 * AIDEV-NOTE: Routes para Email (Gmail OAuth + SMTP Manual)
 * Conforme PRD-08 - Secao 6. Email Pessoal
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import emailService from '../../services/email.service'
import {
  ConfigurarSmtpSchema,
  EnviarEmailSchema,
} from '../../schemas/conexoes/email'

const router = Router()

// =====================================================
// Gmail OAuth
// =====================================================

/**
 * GET /api/v1/conexoes/email/google/auth-url
 * Gera URL de autorizacao Gmail OAuth
 */
router.get('/google/auth-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await emailService.gerarGmailAuthUrl(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/email/google/callback
 * Callback Gmail OAuth (rota publica para redirect do Google)
 */
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=${oauthError}`)
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Code e state obrigatorios' })
    }

    await emailService.processarGmailCallback(code as string, state as string)

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?success=gmail`)
  } catch (error) {
    console.error('Erro no callback Gmail:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=callback_failed`)
  }
})

// =====================================================
// SMTP Manual
// =====================================================

/**
 * POST /api/v1/conexoes/email/smtp/detectar
 * Auto-detecta configuracoes SMTP pelo dominio do email
 */
router.post('/smtp/detectar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatorio' })
    }

    const result = emailService.detectarSmtp(email)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/email/smtp/testar
 * Testa conexao SMTP
 */
router.post('/smtp/testar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id

    if (!organizacaoId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const config = ConfigurarSmtpSchema.parse(req.body)
    const result = await emailService.testarSmtp(config)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * POST /api/v1/conexoes/email/smtp
 * Salva configuracao SMTP
 */
router.post('/smtp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const config = ConfigurarSmtpSchema.parse(req.body)
    const result = await emailService.salvarSmtp(organizacaoId, usuarioId, config)
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
 * GET /api/v1/conexoes/email
 * Obtem status da conexao email
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await emailService.obterStatus(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/email
 * Desconecta email
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await emailService.desconectar(organizacaoId, usuarioId)
    res.json({ success: true, message: 'Email desconectado' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Enviar Email
// =====================================================

/**
 * POST /api/v1/conexoes/email/enviar
 * Envia email
 */
router.post('/enviar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const payload = EnviarEmailSchema.parse(req.body)
    const result = await emailService.enviarEmail(organizacaoId, usuarioId, payload)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

export default router
