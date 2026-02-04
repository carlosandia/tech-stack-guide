import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { authApi } from '../services/auth.api'

/**
 * AIDEV-NOTE: Pagina de Recuperacao de Senha
 * Conforme PRD-03 - Interface de Login (RF-022)
 * Rota: /recuperar-senha
 * SEMPRE retorna mensagem de sucesso para nao revelar se email existe
 */

const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail valido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)

    try {
      await authApi.forgotPassword({ email: data.email })
    } catch (err) {
      // Ignora erro - sempre mostra sucesso
    } finally {
      setIsLoading(false)
      setIsSuccess(true)
    }
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
            e.currentTarget.style.display = 'none'
          }}
        />
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          CRM Renove
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {isSuccess ? (
          // Tela de sucesso
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              Verifique seu e-mail
            </h2>
            <p className="text-gray-600">
              Se o e-mail existir em nosso sistema, enviaremos um link de recuperacao.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:underline mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para login
            </Link>
          </div>
        ) : (
          // Formulario
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                Recuperar Senha
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Informe seu e-mail cadastrado para receber o link de recuperacao.
              </p>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={`
                  w-full h-11 px-3 border rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}
                `}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Botao Enviar */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full h-11 flex items-center justify-center font-medium rounded-md
                transition-colors bg-blue-600 text-white hover:bg-blue-700
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperacao'
              )}
            </button>

            {/* Link Voltar */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
