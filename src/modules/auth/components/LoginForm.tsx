import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * AIDEV-NOTE: Formulario de login
 * Conforme PRD-03 - Interface de Login (RF-021)
 * Titulo: "Informe seus dados abaixo"
 * Campos: Email, Senha
 * Checkbox: "Lembrar por 30 dias"
 */

// Schema de validacao
const loginSchema = z.object({
  email: z.string().email('Informe um e-mail valido'),
  senha: z.string().min(1, 'Senha obrigatoria'),
  lembrar: z.boolean().optional().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  // Carrega preferencia de "lembrar" do localStorage
  const defaultLembrar = localStorage.getItem('rememberMe') === 'true'

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
      lembrar: defaultLembrar,
    },
    mode: 'onChange',
  })

  const email = watch('email')
  const senha = watch('senha')
  const isButtonDisabled = !email || !senha || isLoading

  const handleFormSubmit = async (data: LoginFormData) => {
    // Salva preferencia de "lembrar"
    localStorage.setItem('rememberMe', data.lembrar ? 'true' : 'false')
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Titulo */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Informe seus dados abaixo
        </h2>
      </div>

      {/* Erro global */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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
            focus:outline-none focus:ring-2 focus:ring-primary
            ${errors.email ? 'border-red-500' : 'border-gray-300'}
          `}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Campo Senha */}
      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
          Senha *
        </label>
        <div className="relative">
          <input
            id="senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('senha')}
            className={`
              w-full h-11 px-3 pr-10 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.senha ? 'border-red-500' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.senha && (
          <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
        )}
      </div>

      {/* Checkbox Lembrar */}
      <div className="flex items-center">
        <input
          id="lembrar"
          type="checkbox"
          {...register('lembrar')}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="lembrar" className="ml-2 block text-sm text-gray-700">
          Lembrar por 30 dias
        </label>
      </div>

      {/* Botao Entrar */}
      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`
          w-full h-11 flex items-center justify-center font-medium rounded-md
          transition-colors
          ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>

      {/* Link Esqueci senha */}
      <div className="text-center">
        <Link
          to="/recuperar-senha"
          className="text-sm text-primary hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  )
}
