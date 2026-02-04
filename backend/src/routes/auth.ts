import { Router, type Request, type Response, type NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { authService } from '../services/auth.service.js'
import {
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AlterarSenhaSchema,
  AtualizarPerfilSchema,
} from '../schemas/auth.js'
import { authMiddleware } from '../middlewares/auth.js'
import { logger } from '../utils/logger.js'

/**
 * AIDEV-NOTE: Rotas de autenticacao
 * Conforme PRD-03 - Autenticacao e Autorizacao
 *
 * Endpoints:
 * POST /auth/login - Login com email/senha
 * POST /auth/refresh - Renovar access token
 * POST /auth/logout - Encerrar sessao
 * POST /auth/forgot-password - Solicitar reset de senha
 * POST /auth/reset-password - Redefinir senha com token
 * GET /perfil - Obter proprio perfil
 * PATCH /perfil - Atualizar proprio perfil
 * POST /perfil/senha - Alterar propria senha
 */

const router = Router()

// Rate limiting para login (5 tentativas/15min por IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    error: 'Muitas tentativas de login',
    message: 'Muitas tentativas de login. Aguarde 15 minutos.',
    retry_after: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
})

// Rate limiting para recuperacao de senha (3/hora por email)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    error: 'Muitas solicitacoes',
    message: 'Muitas solicitacoes de recuperacao. Aguarde 1 hora.',
    retry_after: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Helper para extrair IP e User-Agent
function getRequestMeta(req: Request) {
  return {
    ip: req.ip || req.headers['x-forwarded-for']?.toString() || undefined,
    userAgent: req.headers['user-agent'],
  }
}

// Helper para validar schema
function validateBody<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodError = err as { errors: Array<{ path: string[]; message: string }> }
        return res.status(400).json({
          error: 'Dados invalidos',
          details: zodError.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Dados invalidos' })
    }
  }
}

/**
 * POST /auth/login
 * Login com email e senha
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(LoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { ip, userAgent } = getRequestMeta(req)
      const result = await authService.login(req.body, ip, userAgent)

      res.json({
        success: true,
        data: result,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      logger.warn(`Login falhou: ${message}`)

      // Mensagem generica para nao revelar se email existe
      res.status(401).json({
        error: 'Credenciais invalidas',
        message: 'Email ou senha incorretos',
      })
    }
  }
)

/**
 * POST /auth/refresh
 * Renovar access token usando refresh token
 */
router.post(
  '/refresh',
  validateBody(RefreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body
      const result = await authService.refresh(refresh_token)

      res.json({
        success: true,
        data: result,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao renovar token'
      logger.warn(`Refresh falhou: ${message}`)

      res.status(401).json({
        error: 'Token invalido',
        message: 'Refresh token invalido ou expirado',
      })
    }
  }
)

/**
 * POST /auth/logout
 * Encerrar sessao (requer autenticacao)
 */
router.post(
  '/logout',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body
      const { ip, userAgent } = getRequestMeta(req)

      if (refresh_token && req.user) {
        await authService.logout(refresh_token, req.user.id, ip, userAgent)
      }

      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
      })
    } catch (err) {
      logger.error('Erro no logout:', err)
      // Mesmo com erro, responde sucesso para nao bloquear usuario
      res.json({
        success: true,
        message: 'Logout realizado',
      })
    }
  }
)

/**
 * POST /auth/forgot-password
 * Solicitar recuperacao de senha
 * NOTA: Sempre retorna sucesso para nao revelar se email existe
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(ForgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      await authService.forgotPassword(req.body)

      // SEMPRE retorna sucesso
      res.json({
        success: true,
        message: 'Se o email existir em nosso sistema, enviaremos um link de recuperacao.',
      })
    } catch (err) {
      logger.error('Erro ao processar recuperacao de senha:', err)
      // Mesmo com erro, retorna sucesso
      res.json({
        success: true,
        message: 'Se o email existir em nosso sistema, enviaremos um link de recuperacao.',
      })
    }
  }
)

/**
 * POST /auth/reset-password
 * Redefinir senha com token
 */
router.post(
  '/reset-password',
  validateBody(ResetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      await authService.resetPassword(req.body)

      res.json({
        success: true,
        message: 'Senha alterada com sucesso. Faca login com sua nova senha.',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha'
      logger.warn(`Reset de senha falhou: ${message}`)

      res.status(400).json({
        error: 'Token invalido',
        message: 'Link invalido ou expirado. Solicite novo link.',
      })
    }
  }
)

/**
 * GET /perfil
 * Obter dados do proprio perfil (requer autenticacao)
 */
router.get(
  '/perfil',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario nao autenticado' })
      }

      const perfil = await authService.getPerfil(req.user.id)

      res.json({
        success: true,
        data: perfil,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao obter perfil'
      logger.error('Erro ao obter perfil:', err)

      res.status(404).json({
        error: 'Nao encontrado',
        message,
      })
    }
  }
)

/**
 * PATCH /perfil
 * Atualizar proprio perfil (requer autenticacao)
 */
router.patch(
  '/perfil',
  authMiddleware,
  validateBody(AtualizarPerfilSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario nao autenticado' })
      }

      const { ip, userAgent } = getRequestMeta(req)
      await authService.atualizarPerfil(req.user.id, req.body, ip, userAgent)

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
      logger.error('Erro ao atualizar perfil:', err)

      res.status(400).json({
        error: 'Erro ao atualizar',
        message,
      })
    }
  }
)

/**
 * POST /perfil/senha
 * Alterar propria senha (requer autenticacao)
 */
router.post(
  '/perfil/senha',
  authMiddleware,
  validateBody(AlterarSenhaSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario nao autenticado' })
      }

      const { ip, userAgent } = getRequestMeta(req)
      await authService.alterarSenha(req.user.id, req.body, ip, userAgent)

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar senha'
      logger.warn(`Alteracao de senha falhou: ${message}`)

      res.status(400).json({
        error: 'Erro ao alterar senha',
        message,
      })
    }
  }
)

export default router
