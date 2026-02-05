import { Lock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

/**
 * AIDEV-NOTE: Página de bloqueio para usuários de organizações bloqueadas
 * Exibida quando cortesia é revogada e organização fica com status 'bloqueada'
 */

export function BlockedPage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  const handleVerPlanos = () => {
    navigate('/planos')
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ícone */}
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-destructive" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Acesso Suspenso
          </h1>
          <p className="text-muted-foreground">
            O acesso da sua organização foi temporariamente suspenso.
          </p>
        </div>

        {/* Informações */}
        <div className="bg-card border border-border rounded-lg p-4 text-left space-y-3">
          <p className="text-sm text-muted-foreground">
            Para continuar utilizando o CRM, é necessário escolher um plano e realizar o pagamento.
          </p>
          <p className="text-sm text-muted-foreground">
            Todos os seus dados estão seguros e serão restaurados assim que a assinatura for ativada.
          </p>
        </div>

        {/* Conta logada */}
        {user && (
          <p className="text-xs text-muted-foreground">
            Logado como: <span className="font-medium">{user.email}</span>
          </p>
        )}

        {/* Ações */}
        <div className="space-y-3">
          <button
            onClick={handleVerPlanos}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ver Planos Disponíveis
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
