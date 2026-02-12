import { useState, useEffect } from 'react'
import renoveLogo from '@/assets/renove-logo.png'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '@/providers/AuthProvider'

/**
 * AIDEV-NOTE: Pagina de Login
 * Conforme PRD-03 - Interface de Login (RF-021)
 * Rota: /login
 * Redirecionamento por role:
 * - super_admin → /admin
 * - admin/member → /app
 */

 // URLs de politica e termos
 // TODO: Futuramente buscar de configuracoes_globais
 const PRIVACY_URL = ''
 const TERMS_URL = ''

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, role, loading: authLoading, signIn } = useAuth()

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
      const result = await signIn(data.email, data.senha, data.lembrar)

      if (result.error) {
        // Trata erros especificos do Supabase
        const errorMessage = result.error.message
        if (errorMessage.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos')
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Confirme seu e-mail antes de fazer login')
        } else {
          setError('Erro ao fazer login. Tente novamente.')
        }
        return
      }

      if (result.user) {
        // Redireciona baseado no role
        const redirectTo = result.user.role === 'super_admin' ? '/admin' : '/app'
        navigate(redirectTo, { replace: true })
      }
    } catch {
      setError('E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img src={renoveLogo} alt="Renove" className="h-12" />
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-card rounded-lg shadow-md p-8 border border-border">
        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
            <p className="text-sm text-primary">
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
        <div className="mt-6 text-xs text-muted-foreground">
          {PRIVACY_URL && (
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground hover:underline"
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
              className="hover:text-foreground hover:underline"
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
