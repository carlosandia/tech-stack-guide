import { useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useAppToolbar } from '../contexts/AppToolbarContext'
import {
  Briefcase,
  Users,
  CheckSquare,
  TrendingUp,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Dashboard do CRM para Admin e Member
 * Placeholder com cards de resumo e acesso rápido
 * Será expandido conforme PRDs futuros
 */

function DashboardPage() {
  const { user } = useAuth()
  const { setSubtitle } = useAppToolbar()

  useEffect(() => {
    setSubtitle('Visão geral do seu CRM')
    return () => setSubtitle('')
  }, [setSubtitle])

  const cards = [
    {
      title: 'Negócios Ativos',
      value: '—',
      description: 'Em andamento no funil',
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Contatos',
      value: '—',
      description: 'Total cadastrados',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Tarefas Pendentes',
      value: '—',
      description: 'Para hoje e atrasadas',
      icon: CheckSquare,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Receita do Mês',
      value: '—',
      description: 'Negócios ganhos',
      icon: TrendingUp,
      color: 'text-violet-600 bg-violet-50',
    },
  ]

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Saudação */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Olá, {user?.nome || 'Usuário'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está o resumo do seu CRM
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Placeholder para conteúdo futuro */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <Briefcase className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">
          Módulos em desenvolvimento
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Os módulos de Contatos, Negócios, Conversas e Tarefas serão implementados nas próximas fases.
          Acesse Configurações para personalizar seu CRM.
        </p>
      </div>
    </div>
  )
}

export default DashboardPage
