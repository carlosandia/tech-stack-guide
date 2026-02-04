import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../services/admin.api'
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  XCircle,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Dashboard do Super Admin
 * Conforme PRD-14 - Metricas da Plataforma
 *
 * Exibe:
 * - Total de tenants por status
 * - Total de usuarios
 * - MRR e variacao
 * - Distribuicao por plano
 * - Alertas
 */

export function DashboardPage() {
  const { data: metricas, isLoading, error } = useQuery({
    queryKey: ['admin', 'metricas', 'resumo'],
    queryFn: () => adminApi.obterMetricasResumo('30d'),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar metricas</p>
      </div>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard da Plataforma</h1>
        <p className="text-gray-500 mt-1">Visao geral dos ultimos 30 dias</p>
      </div>

      {/* Cards de metricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tenants Ativos */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Ativos</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {metricas?.tenants.total || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Organizacoes</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-green-600">{metricas?.tenants.ativos || 0} ativos</span>
            <span className="text-yellow-600">{metricas?.tenants.trial || 0} trial</span>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Receita</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(metricas?.financeiro.mrr || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">MRR</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            {metricas?.financeiro.variacao_mrr && metricas.financeiro.variacao_mrr >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+{metricas.financeiro.variacao_mrr}% vs mes anterior</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-red-600">{metricas?.financeiro.variacao_mrr || 0}% vs mes anterior</span>
              </>
            )}
          </div>
        </div>

        {/* Usuarios */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Usuarios</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {metricas?.usuarios.total || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total de usuarios</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-blue-600">{metricas?.usuarios.ativos_hoje || 0} hoje</span>
            <span className="text-gray-500">{metricas?.usuarios.ativos_7d || 0} (7d)</span>
          </div>
        </div>

        {/* Novos Tenants */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">Crescimento</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              +{metricas?.tenants.novos_7d || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Novos (7 dias)</p>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            +{metricas?.tenants.novos_30d || 0} nos ultimos 30 dias
          </div>
        </div>
      </div>

      {/* Secao inferior */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribuicao por Plano */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuicao por Plano
          </h2>
          <div className="space-y-3">
            {metricas?.distribuicao_planos.map((item) => (
              <div key={item.plano} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.plano}</span>
                    <span className="text-sm text-gray-500">
                      {item.quantidade} ({item.percentual.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!metricas?.distribuicao_planos || metricas.distribuicao_planos.length === 0) && (
              <p className="text-sm text-gray-500">Nenhum tenant cadastrado</p>
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="space-y-3">
            {metricas?.alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alerta.tipo === 'error'
                    ? 'bg-red-50'
                    : alerta.tipo === 'warning'
                    ? 'bg-yellow-50'
                    : 'bg-blue-50'
                }`}
              >
                {alerta.tipo === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : alerta.tipo === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    alerta.tipo === 'error'
                      ? 'text-red-700'
                      : alerta.tipo === 'warning'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}
                >
                  {alerta.mensagem}
                </p>
              </div>
            ))}
            {(!metricas?.alertas || metricas.alertas.length === 0) && (
              <p className="text-sm text-gray-500">Nenhum alerta no momento</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
