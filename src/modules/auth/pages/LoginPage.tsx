import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '@/providers/AuthProvider'
import { authApi } from '../services/auth.api'
import { setAccessToken, setRefreshToken } from '@/lib/api'
import { env } from '@/config/env'

/**
 * AIDEV-NOTE: Pagina de Login
 * Conforme PRD-03 - Interface de Login (RF-021)
 * Rota: /login
 * Redirecionamento por role:
 * - super_admin → /admin
 * - admin/member → /app
 */

// URLs de politica e termos (configuraveis via env)
const PRIVACY_URL = import.meta.env.VITE_PRIVACY_POLICY_URL || ''
const TERMS_URL = import.meta.env.VITE_TERMS_OF_SERVICE_URL || ''

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, role, loading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mensagem de sucesso apos reset de senha
  const successMessage = searchParams.get('success')

  // Redireciona se ja autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectTo = role === 'super_admin' ? '/admin' : '/app'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, role, authLoading, navigate])

  const handleLogin = async (data: { email: string; senha: string; lembrar?: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login({
        email: data.email,
        senha: data.senha,
        lembrar: data.lembrar,
      })

      if (response.success && response.data) {
        // Salva tokens
        setAccessToken(response.data.access_token)
        setRefreshToken(response.data.refresh_token)

        // Redireciona baseado no role
        const userRole = response.data.usuario.role
        const redirectTo = userRole === 'super_admin' ? '/admin' : '/app'

        // Força reload para atualizar estado de autenticacao
        window.location.href = redirectTo
      }
    } catch (err: unknown) {
      // Mensagem generica para nao revelar se email existe
      setError('E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logo.svg"
          alt="CRM Renove"
          className="h-14"
          onError={(e) => {
            // Fallback se logo nao existir
            e.currentTarget.style.display = 'none'
          }}
        />
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          CRM Renove
        </h1>
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              {successMessage === 'password_reset'
                ? 'Senha alterada com sucesso! Faca login com sua nova senha.'
                : successMessage}
            </p>
          </div>
        )}

        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Links de Politica e Termos */}
      {(PRIVACY_URL || TERMS_URL) && (
        <div className="mt-6 text-xs text-gray-500">
          {PRIVACY_URL && (
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              Politica de Privacidade
            </a>
          )}
          {PRIVACY_URL && TERMS_URL && (
            <span className="mx-2">•</span>
          )}
          {TERMS_URL && (
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              Termos de Servico
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default LoginPage
