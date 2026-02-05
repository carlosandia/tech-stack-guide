import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
 import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

/**
 * AIDEV-NOTE: Provider central de autenticacao
 * Usa Supabase Auth diretamente (PRD-03)
 * Busca role da tabela usuarios (fonte da verdade)
 */

export type UserRole = 'super_admin' | 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  nome: string
  sobrenome?: string
  role: UserRole
  organizacao_id: string | null
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  tenantId: string | null
  role: UserRole | null
  signIn: (email: string, password: string, lembrar?: boolean) => Promise<{ error: Error | null; user?: AuthUser }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Extrai metadados do usuario
  const tenantId = user?.organizacao_id ?? null
  const role = user?.role ?? null

  // Busca dados do usuario da tabela usuarios
  const fetchUserData = useCallback(async (supabaseUser: User): Promise<AuthUser | null> => {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, email, role, organizacao_id, avatar_url')
        .eq('auth_id', supabaseUser.id)
        .single()

      if (error || !usuario) {
        console.error('Usuario nao encontrado na tabela usuarios:', error)
        // Fallback para metadata se usuario nao existe na tabela
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          nome: supabaseUser.user_metadata?.nome || 'Usuario',
          sobrenome: supabaseUser.user_metadata?.sobrenome,
          role: (supabaseUser.user_metadata?.role as UserRole) || 'member',
          organizacao_id: supabaseUser.user_metadata?.tenant_id || null,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        }
      }

      return {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome ?? undefined,
        role: usuario.role as UserRole,
        organizacao_id: usuario.organizacao_id,
        avatar_url: usuario.avatar_url ?? undefined,
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuario:', err)
      return null
    }
  }, [])

  // Inicializa auth listener
  useEffect(() => {
    // Configura listener de mudanca de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        
        if (currentSession?.user) {
          // Usa setTimeout para evitar deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user)
            setUser(userData)
            setLoading(false)
          }, 0)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    // Verifica sessao existente
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession)
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user).then((userData) => {
          setUser(userData)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserData])

  // Login
  const signIn = async (email: string, password: string, _lembrar = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (error) {
        return { error: new Error(error.message) }
      }

      if (data.user) {
        const userData = await fetchUserData(data.user)
        
        if (userData) {
          setUser(userData)
          setSession(data.session)

          // Atualiza ultimo_login na tabela usuarios
          await supabase
            .from('usuarios')
            .update({ ultimo_login: new Date().toISOString() })
            .eq('auth_id', data.user.id)

          return { error: null, user: userData }
        }
      }

      return { error: new Error('Falha na autenticação') }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignora erros de logout
    } finally {
      setUser(null)
      setSession(null)
    }
  }

  // Atualiza usuario manualmente (usado apos editar perfil)
  const refreshUser = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user)
      setUser(userData)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    tenantId,
    role,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated: !!user && !!session,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
