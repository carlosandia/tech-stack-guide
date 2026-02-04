/**
 * AIDEV-NOTE: Routes para Google Calendar
 * Conforme PRD-08 - Secao 5.2 Google Calendar
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import googleService from '../../services/google.service'
import {
  SelecionarCalendarioSchema,
  CriarEventoGoogleSchema,
  AtualizarConfigGoogleSchema,
} from '../../schemas/conexoes/google'

const router = Router()

// =====================================================
// OAuth Flow
// =====================================================

/**
 * GET /api/v1/conexoes/google/auth-url
 * Gera URL de autorizacao OAuth
 */
router.get('/auth-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id
    const tipo = (req.query.tipo as 'calendar' | 'gmail') || 'calendar'

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await googleService.gerarAuthUrl(organizacaoId, usuarioId, tipo)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/conexoes/google/callback
 * Callback OAuth (rota publica para redirect do Google)
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      // Redireciona para frontend com erro
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=${oauthError}`)
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Code e state obrigatorios' })
    }

    await googleService.processarCallback(code as string, state as string)

    // Redireciona para frontend com sucesso
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?success=google`)
  } catch (error) {
    console.error('Erro no callback Google:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes/integracoes?error=callback_failed`)
  }
})

// =====================================================
// Status e Desconexao
// =====================================================

/**
 * GET /api/v1/conexoes/google
 * Obtem status da conexao Google
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await googleService.obterStatus(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/google
 * Desconecta Google
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await googleService.desconectar(organizacaoId, usuarioId)
    res.json({ success: true, message: 'Google desconectado' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Calendarios
// =====================================================

/**
 * GET /api/v1/conexoes/google/calendarios
 * Lista calendarios do usuario
 */
router.get('/calendarios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const result = await googleService.listarCalendarios(organizacaoId, usuarioId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/v1/conexoes/google/calendario
 * Seleciona calendario padrao
 */
router.patch('/calendario', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = SelecionarCalendarioSchema.parse(req.body)
    await googleService.selecionarCalendario(organizacaoId, usuarioId, dados)
    res.json({ success: true, message: 'Calendario selecionado' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

// =====================================================
// Eventos
// =====================================================

/**
 * POST /api/v1/conexoes/google/eventos
 * Cria evento no Google Calendar
 */
router.post('/eventos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = CriarEventoGoogleSchema.parse(req.body)
    const result = await googleService.criarEvento(organizacaoId, usuarioId, dados)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * PATCH /api/v1/conexoes/google/eventos/:event_id
 * Atualiza evento no Google Calendar
 */
router.patch('/eventos/:event_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id
    const eventId = req.params.event_id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const dados = CriarEventoGoogleSchema.partial().parse(req.body)
    const result = await googleService.atualizarEvento(organizacaoId, usuarioId, eventId, dados)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

/**
 * DELETE /api/v1/conexoes/google/eventos/:event_id
 * Cancela evento no Google Calendar
 */
router.delete('/eventos/:event_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id
    const eventId = req.params.event_id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    await googleService.cancelarEvento(organizacaoId, usuarioId, eventId)
    res.json({ success: true, message: 'Evento cancelado' })
  } catch (error) {
    next(error)
  }
})

// =====================================================
// Configuracoes
// =====================================================

/**
 * PATCH /api/v1/conexoes/google/config
 * Atualiza configuracoes da conexao
 */
router.patch('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizacaoId = req.user?.organizacao_id
    const usuarioId = req.user?.id

    if (!organizacaoId || !usuarioId) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const config = AtualizarConfigGoogleSchema.parse(req.body)
    await googleService.atualizarConfig(organizacaoId, usuarioId, config)
    res.json({ success: true, message: 'Configuracoes atualizadas' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    }
    next(error)
  }
})

export default router
