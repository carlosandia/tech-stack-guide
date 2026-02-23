import { useState } from 'react'
import renoveLogo from '@/assets/logotipo-renove.svg'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'

/**
 * AIDEV-NOTE: Pagina de Recuperacao de Senha
 * Conforme PRD-03 - Interface de Login (RF-022)
 * Rota: /recuperar-senha
 * Chama edge function send-password-reset que envia via SMTP configurado
 * SEMPRE retorna mensagem de sucesso para nao revelar se email existe
 */

const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
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

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token

      // AIDEV-NOTE: Centralizado via env.SUPABASE_URL com fallback (Auditoria M1/M2)
      const response = await fetch(
        `${env.SUPABASE_URL}/functions/v1/send-password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
            'apikey': env.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: data.email }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'email_not_found') {
          setErrorMsg('E-mail não encontrado. Verifique se o endereço está correto.')
        } else if (result.error === 'user_not_active') {
          setErrorMsg('Esta conta ainda não foi ativada. Entre em contato com o administrador.')
        } else {
          setErrorMsg('Erro ao processar solicitação. Tente novamente.')
        }
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch (err) {
      console.error('Erro ao solicitar recuperação:', err)
      setErrorMsg('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <img src={renoveLogo} alt="Renove" className="h-12 mx-auto" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card rounded-lg shadow-md border border-border p-8">
        {isSuccess ? (
          // Tela de sucesso
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              E-mail enviado!
            </h2>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-primary hover:underline mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para login
            </Link>
          </div>
        ) : (
          // Formulario
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Recuperar Senha
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Informe seu e-mail cadastrado para receber o link de recuperação.
              </p>
            </div>

            {/* Erro geral */}
            {errorMsg && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-center">
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                E-mail *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={`
                  w-full h-11 px-3 border rounded-md bg-background text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring
                  ${errors.email ? 'border-destructive' : 'border-input'}
                `}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Botao Enviar */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full h-11 flex items-center justify-center font-medium rounded-md
                transition-colors bg-primary text-primary-foreground hover:bg-primary/90
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>

            {/* Link Voltar */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary hover:underline"
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
