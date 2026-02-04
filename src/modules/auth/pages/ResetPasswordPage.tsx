import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { authApi } from '../services/auth.api'

/**
 * AIDEV-NOTE: Pagina de Redefinicao de Senha
 * Conforme PRD-03 - Interface de Login (RF-022)
 * Rota: /redefinir-senha?token=xxx
 * Valida token antes de permitir redefinicao
 */

const resetPasswordSchema = z
  .object({
    nova_senha: z
      .string()
      .min(8, 'Minimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiuscula')
      .regex(/[0-9]/, 'Deve conter pelo menos 1 numero'),
    confirmar_senha: z.string(),
  })
  .refine((data) => data.nova_senha === data.confirmar_senha, {
    message: 'Senhas nao conferem',
    path: ['confirmar_senha'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Requisitos de senha para checklist
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'Minimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Pelo menos 1 letra maiuscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Pelo menos 1 numero', test: (p: string) => /[0-9]/.test(p) },
]

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  // Verifica se token existe
  useEffect(() => {
    if (!token) {
      setError('Link invalido ou expirado. Solicite novo link.')
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      await authApi.resetPassword({
        token,
        nova_senha: data.nova_senha,
        confirmar_senha: data.confirmar_senha,
      })

      // Redireciona para login com mensagem de sucesso
      navigate('/login?success=password_reset', { replace: true })
    } catch (err: unknown) {
      setError('Link invalido ou expirado. Solicite novo link.')
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logo.svg"
          alt="CRM Renove"
          className="h-14"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          CRM Renove
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Redefinir Senha
            </h2>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Campo Nova Senha */}
          <div>
            <label htmlFor="nova_senha" className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                id="nova_senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
              {...register('nova_senha')}
              className={`
                w-full h-11 px-3 pr-10 border rounded-md
                focus:outline-none focus:ring-2 focus:ring-primary
                ${errors.nova_senha ? 'border-red-500' : 'border-gray-300'}
              `}
                disabled={isLoading || !token}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Checklist de Requisitos */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Requisitos</p>
            {passwordChecks.map((check) => (
              <div key={check.key} className="flex items-center text-sm">
                {check.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className={check.passed ? 'text-green-600' : 'text-gray-500'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          {/* Campo Confirmar Senha */}
          <div>
            <label htmlFor="confirmar_senha" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                id="confirmar_senha"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
              {...register('confirmar_senha')}
              className={`
                w-full h-11 px-3 pr-10 border rounded-md
                focus:outline-none focus:ring-2 focus:ring-primary
                ${errors.confirmar_senha ? 'border-red-500' : 'border-gray-300'}
              `}
                disabled={isLoading || !token}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-red-600">Senhas nao conferem</span>
                  </>
                )
              )}
            </div>
          </div>

          {/* Botao Redefinir */}
          <button
            type="submit"
            disabled={isLoading || !token || !passwordChecks.every(c => c.passed) || !passwordsMatch}
            className={`
              w-full h-11 flex items-center justify-center font-medium rounded-md
              transition-colors
              ${
                isLoading || !token || !passwordChecks.every(c => c.passed) || !passwordsMatch
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
      </div>

      {/* Link para solicitar novo link */}
      {error && (
        <div className="mt-4 text-center">
          <Link
            to="/recuperar-senha"
            className="text-sm text-primary hover:underline"
          >
            Solicitar novo link de recuperacao
          </Link>
        </div>
      )}
    </div>
  )
}

export default ResetPasswordPage
