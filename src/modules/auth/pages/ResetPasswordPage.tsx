import { useState, useEffect } from 'react'
import renoveLogo from '@/assets/logotipo-renove.svg'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Check, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * AIDEV-NOTE: Pagina de Redefinicao de Senha
 * Conforme PRD-03 - Interface de Login (RF-022)
 * Rota: /redefinir-senha
 * 
 * Fluxo:
 * 1. Usuario clica no link do email → Supabase verifica token e redireciona aqui com sessão ativa
 * 2. Usuario define nova senha → usa supabase.auth.updateUser({ password })
 * 3. Redireciona para login com mensagem de sucesso
 */

const resetPasswordSchema = z
  .object({
    nova_senha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos 1 número'),
    confirmar_senha: z.string(),
  })
  .refine((data) => data.nova_senha === data.confirmar_senha, {
    message: 'Senhas não conferem',
    path: ['confirmar_senha'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Requisitos de senha para checklist
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Pelo menos 1 letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Pelo menos 1 número', test: (p: string) => /[0-9]/.test(p) },
]

export function ResetPasswordPage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  const novaSenha = watch('nova_senha', '')
  const confirmarSenha = watch('confirmar_senha', '')

  // Aguardar a sessão ser estabelecida pelo redirect do Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setSessionReady(true)
          setChecking(false)
        }
      }
    )

    // Também verificar sessão existente (pode já estar logado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
      setChecking(false)
    })

    // Timeout para não ficar carregando infinitamente
    const timeout = setTimeout(() => {
      setChecking(false)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.nova_senha,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Sucesso - redireciona para login
      navigate('/login?success=password_reset', { replace: true })
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Verifica requisitos de senha em tempo real
  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.test(novaSenha),
  }))

  const passwordsMatch = novaSenha === confirmarSenha && confirmarSenha.length > 0

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando link...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <img src={renoveLogo} alt="Renove" className="h-12 mx-auto" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card rounded-lg shadow-md border border-border p-8">
        {!sessionReady ? (
          // Link inválido ou expirado
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              Link inválido ou expirado
            </h2>
            <p className="text-muted-foreground">
              O link de recuperação pode ter expirado. Solicite um novo link.
            </p>
            <Link
              to="/recuperar-senha"
              className="inline-block w-full h-11 leading-[44px] text-center font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Redefinir Senha
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Defina sua nova senha abaixo.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Campo Nova Senha */}
            <div>
              <label htmlFor="nova_senha" className="block text-sm font-medium text-foreground mb-1">
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  id="nova_senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('nova_senha')}
                  className={`
                    w-full h-11 px-3 pr-10 border rounded-md bg-background text-foreground
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring
                    ${errors.nova_senha ? 'border-destructive' : 'border-input'}
                  `}
                  disabled={isLoading}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Checklist de Requisitos */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-md border border-border">
              <p className="text-sm font-medium text-foreground">Requisitos</p>
              {passwordChecks.map((check) => {
                const hasInput = novaSenha.length > 0
                return (
                  <div
                    key={check.key}
                    className={`flex items-center text-sm transition-colors duration-200 ${
                      check.passed
                        ? 'text-green-600'
                        : hasInput
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {check.passed ? (
                      <Check className="h-4 w-4 mr-2 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    <span>{check.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmar_senha" className="block text-sm font-medium text-foreground mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  id="confirmar_senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmar_senha')}
                  className={`
                    w-full h-11 px-3 pr-10 border rounded-md bg-background text-foreground
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring
                    ${errors.confirmar_senha ? 'border-destructive' : 'border-input'}
                  `}
                  disabled={isLoading}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Indicador de senhas iguais */}
              <div className="mt-2 flex items-center text-sm">
                {confirmarSenha.length > 0 && (
                  passwordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600">Senhas conferem</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive mr-2" />
                      <span className="text-destructive">Senhas não conferem</span>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Botao Redefinir */}
            <button
              type="submit"
              disabled={isLoading || !passwordChecks.every(c => c.passed) || !passwordsMatch}
              className={`
                w-full h-11 flex items-center justify-center font-medium rounded-md
                transition-colors
                ${
                  isLoading || !passwordChecks.every(c => c.passed) || !passwordsMatch
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Link para solicitar novo link */}
      {!sessionReady && (
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline"
          >
            ← Voltar para login
          </Link>
        </div>
      )}
    </div>
  )
}

export default ResetPasswordPage
