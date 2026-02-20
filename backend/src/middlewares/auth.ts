import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import type { UserRole } from '../schemas/common.js'

/**
 * AIDEV-NOTE: Middleware de autenticacao
 * Valida JWT do Supabase e extrai informacoes do usuario
 * Nunca processe JWT manualmente - use supabase.auth.getUser()
 */

// Extende Request para incluir dados do usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
        tenantId: string | null
        organizacao_id: string | null // Alias para tenantId (compatibilidade PRD-05)
      }
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticacao nao fornecido',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer '

    // Valida token com Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        error: 'Token invalido ou expirado',
      })
    }

    // AIDEV-NOTE: SEGURANCA - Busca role EXCLUSIVAMENTE da tabela usuarios
    // A tabela usuarios e a fonte da verdade para roles
    // NUNCA usar user_metadata como fallback - pode ser manipulado/desatualizado
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, role, organizacao_id, status')
      .eq('auth_id', user.id)
      .is('deletado_em', null)
      .single()

    // AIDEV-NOTE: SEGURANCA - Se usuario nao existe na tabela, rejeita acesso
    // Isso previne acesso por usuarios deletados ou que nao completaram onboarding
    if (userError || !usuario) {
      console.warn(`[Auth] Usuario com auth_id ${user.id} nao encontrado na tabela usuarios`)
      return res.status(403).json({
        error: 'Usuario nao encontrado no sistema',
        message: 'Sua conta pode ter sido desativada. Entre em contato com o administrador.',
      })
    }

    // AIDEV-NOTE: SEGURANCA - Verificar status do usuario
    if (usuario.status !== 'ativo') {
      console.warn(`[Auth] Usuario ${usuario.id} com status ${usuario.status} tentou acessar`)
      return res.status(403).json({
        error: 'Conta inativa',
        message: 'Sua conta esta inativa ou pendente de ativacao.',
      })
    }

    // AIDEV-NOTE: req.user.id e o ID da tabela usuarios, NAO do auth.users
    // Isso facilita operacoes de audit e relacionamentos
    req.user = {
      id: usuario.id,
      email: user.email!,
      role: usuario.role as UserRole,
      tenantId: usuario.organizacao_id,
      organizacao_id: usuario.organizacao_id, // Alias para compatibilidade com services PRD-05
    }

    next()
  } catch (err) {
    console.error('Erro no middleware de autenticacao:', err)
    return res.status(500).json({
      error: 'Erro interno de autenticacao',
    })
  }
}

// Middleware para verificar role minimo
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario nao autenticado',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado. Role insuficiente.',
      })
    }

    next()
  }
}

// Middleware para verificar tenant
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario nao autenticado',
    })
  }

  // Super admin nao precisa de tenant
  if (req.user.role === 'super_admin') {
    return next()
  }

  if (!req.user.tenantId) {
    return res.status(403).json({
      error: 'Usuario nao pertence a nenhuma organizacao',
    })
  }

  next()
}
