/**
 * AIDEV-NOTE: Página de callback OAuth Google
 * Captura code/state da URL e envia para Edge Function processar
 * Rota pública: /oauth/google/callback
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function OAuthGoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [erro] = useState<string | null>(null)

  useEffect(() => {
    const processarCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')

      if (oauthError) {
        navigate(`/configuracoes/conexoes?error=${oauthError}`, { replace: true })
        return
      }

      if (!code || !state) {
        navigate('/configuracoes/conexoes?error=missing_params', { replace: true })
        return
      }

      try {
        const { data, error } = await supabase.functions.invoke('google-auth', {
          body: {
            action: 'exchange-code',
            code,
            state,
          },
        })

        if (error || !data?.success) {
          const errorMsg = data?.error || error?.message || 'exchange_failed'
          navigate(`/configuracoes/conexoes?error=${encodeURIComponent(errorMsg)}`, { replace: true })
          return
        }

        navigate('/configuracoes/conexoes?success=google', { replace: true })
      } catch {
        navigate('/configuracoes/conexoes?error=exchange_failed', { replace: true })
      }
    }

    processarCallback()
  }, [searchParams, navigate])

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Erro na autenticação</p>
          <p className="text-sm text-muted-foreground">{erro}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Processando autenticação Google...</p>
      </div>
    </div>
  )
}
