import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authApi, type PerfilResponse } from '@/modules/auth/services/auth.api'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api'

/**
 * AIDEV-NOTE: Provider central de autenticacao
 * Usa JWT do backend Express (PRD-03)
 * Todas operacoes autenticadas devem usar useAuth()
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

// Evento customizado para sincronizar login entre componentes
const AUTH_STATE_CHANGE_EVENT = 'auth-state-change'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Extrai metadados do usuario
  const tenantId = user?.organizacao_id ?? null
  const role = user?.role ?? null

  // Busca perfil do usuario no backend
  const fetchUserProfile = useCallback(async (): Promise<AuthUser | null> => {
    const token = getAccessToken()
    if (!token) {
      return null
    }

    try {
      const response: PerfilResponse = await authApi.getPerfil()
      
      if (response.success && response.data) {
        const userData: AuthUser = {
          id: response.data.id,
          email: response.data.email,
          nome: response.data.nome,
          sobrenome: response.data.sobrenome,
          role: response.data.role,
          organizacao_id: response.data.organizacao?.id ?? null,
          avatar_url: response.data.foto_url,
        }
        return userData
      }
      return null
    } catch (error) {
      // Se 401, o interceptor já tentou refresh e falhou
      // Limpa tokens e retorna null
      clearTokens()
      return null
    }
  }, [])

  // Carrega usuario ao iniciar
  const initializeAuth = useCallback(async () => {
    if (initialized) return
    
    setLoading(true)
    const userData = await fetchUserProfile()
    setUser(userData)
    setLoading(false)
    setInitialized(true)
  }, [initialized, fetchUserProfile])

  // Inicializa na primeira renderizacao
  useState(() => {
    initializeAuth()
  })

  // Escuta eventos de mudanca de auth (login/logout)
  useState(() => {
    const handleAuthChange = async () => {
      const userData = await fetchUserProfile()
      setUser(userData)
    }

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange)
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange)
    }
  })

  // Login
  const signIn = async (email: string, password: string, lembrar = false) => {
    try {
      const response = await authApi.login({
        email,
        senha: password,
        lembrar,
      })

      if (response.success && response.data) {
        // Salva tokens
        setAccessToken(response.data.access_token)
        setRefreshToken(response.data.refresh_token)

        // Cria objeto de usuario a partir da resposta do login
        const userData: AuthUser = {
          id: response.data.usuario.id,
          email: response.data.usuario.email,
          nome: response.data.usuario.nome,
          sobrenome: response.data.usuario.sobrenome,
          role: response.data.usuario.role,
          organizacao_id: response.data.usuario.organizacao_id,
          avatar_url: response.data.usuario.avatar_url,
        }

        setUser(userData)

        return { error: null, user: userData }
      }

      return { error: new Error('Falha na autenticação') }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Logout
  const signOut = async () => {
    const refreshToken = getRefreshToken()
    
    try {
      await authApi.logout(refreshToken || undefined)
    } catch {
      // Ignora erros de logout no backend
    } finally {
      clearTokens()
      setUser(null)
      // Dispara evento para outros componentes
      window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT))
    }
  }

  // Atualiza usuario manualmente (usado apos editar perfil)
  const refreshUser = async () => {
    const userData = await fetchUserProfile()
    setUser(userData)
  }

  const value: AuthContextType = {
    user,
    loading,
    tenantId,
    role,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
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

// Funcao utilitaria para disparar evento de auth (usada pelo LoginPage)
export function dispatchAuthStateChange() {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT))
}
