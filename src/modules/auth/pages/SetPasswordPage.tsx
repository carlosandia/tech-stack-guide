import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff, Check, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

/**
 * AIDEV-NOTE: Pagina de Definicao de Senha para Admins Convidados
 * Conforme PRD-14 - Sistema de Email Personalizado
 * 
 * Fluxo:
 * 1. Admin recebe email de convite
 * 2. Clica no link que redireciona para esta pagina
 * 3. Token é validado automaticamente
 * 4. Admin define sua senha
 * 5. Redireciona para login com sucesso
 */

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Minimo 8 caracteres',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Pelo menos 1 letra maiuscula',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'number',
    label: 'Pelo menos 1 numero',
    test: (p) => /\d/.test(p),
  },
]

export function SetPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Verificar token ao carregar
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // IMPORTANTE: verificar hash PRIMEIRO, antes de checar sessao existente
        // Senao, se o superadmin estiver logado, mostra o email dele ao inves do convidado
        const hashParams = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        // Verificar parametros de erro primeiro
        const errorParam = hashParams.get('error')
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (errorParam || errorCode) {
          console.error('[SetPassword] Erro no token:', errorParam || errorCode, errorDescription)
          
          // IMPORTANTE: fazer signOut para nao mostrar email do usuario logado (ex: superadmin)
          await supabase.auth.signOut()

          const isExpired = errorParam === 'access_denied' || errorDescription?.includes('expired')
          if (isExpired) {
            setError('O link de convite expirou. Solicite ao administrador que reenvie o convite.')
          } else {
            setError(decodeURIComponent(errorDescription || 'Token invalido ou expirado.'))
          }
          setLoading(false)
          return
        }

        if (accessToken && (type === 'invite' || type === 'magiclink')) {
          console.log('[SetPassword] Processando token de convite...')
          
          // Fazer logout de qualquer sessao existente antes de setar a do convidado
          await supabase.auth.signOut()

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (error) {
            console.error('[SetPassword] Erro ao validar token:', error)
            setError('Token invalido ou expirado. Solicite um novo convite.')
            setLoading(false)
            return
          }

          if (data.user) {
            console.log('[SetPassword] Token validado:', data.user.email)
            setUserEmail(data.user.email || null)
            setTokenValid(true)
            
            // Limpar hash da URL
            window.history.replaceState(null, '', window.location.pathname)
          }
          setLoading(false)
          return
        }

        // Sem hash params - verificar sessao existente (fallback)
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('[SetPassword] Sessao encontrada:', session.user.email)
          setUserEmail(session.user.email || null)
          setTokenValid(true)
          setLoading(false)
          return
        }

        // Nenhum token e nenhuma sessao
        setError('Link invalido. Solicite um novo convite ao administrador.')
      } catch (err) {
        console.error('[SetPassword] Erro:', err)
        setError('Erro ao processar o link. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  // Validar requisitos de senha
  const passwordMeetsRequirements = PASSWORD_REQUIREMENTS.every((req) =>
    req.test(password)
  )
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordMeetsRequirements || !passwordsMatch) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        console.error('[SetPassword] Erro ao definir senha:', error)
        setError(error.message)
        return
      }

      // Atualizar status do usuario para 'ativo' via query direta
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.id) {
        await supabase
          .from('usuarios')
          .update({ status: 'ativo' })
          .eq('auth_id', user.id)
      }

      console.log('[SetPassword] Senha definida com sucesso!')
      setSuccess(true)

      // Fazer logout e redirecionar para login
      await supabase.auth.signOut()
      
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Senha definida com sucesso! Faca login para continuar.' } 
        })
      }, 2000)

    } catch (err) {
      console.error('[SetPassword] Erro:', err)
      setError('Erro ao definir senha. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted to-muted/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    )
  }

  // Erro de token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted to-muted/50 p-4">
        <div className="w-full max-w-md bg-card rounded-lg border border-border p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Link Invalido
            </h1>
            <p className="text-muted-foreground">
              {error || 'O link de convite e invalido ou expirou.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted to-muted/50 p-4">
        <div className="w-full max-w-md bg-card rounded-lg border border-border p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Senha Definida!
            </h1>
            <p className="text-muted-foreground">
              Redirecionando para o login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Formulario principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted to-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Defina sua Senha
            </h1>
            {userEmail && (
              <p className="text-sm text-muted-foreground mt-2">
                {userEmail}
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full h-11 px-4 pr-12 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Requisitos de Senha */}
            <div className="space-y-2">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(password)
                const hasInput = password.length > 0
                return (
                  <div
                    key={req.id}
                    className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                      met
                        ? 'text-success-foreground'
                        : hasInput
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {met ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 shrink-0" />
                    )}
                    {req.label}
                  </div>
                )
              })}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="w-full h-11 px-4 pr-12 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1.5 text-sm text-destructive">
                  As senhas nao coincidem
                </p>
              )}
              {passwordsMatch && (
                <p className="mt-1.5 text-sm text-success-foreground flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Senhas coincidem
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!passwordMeetsRequirements || !passwordsMatch || submitting}
              className="w-full h-11 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Definir Senha'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Ja tem uma conta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline"
          >
            Fazer login
          </button>
        </p>
      </div>
    </div>
  )
}

export default SetPasswordPage
