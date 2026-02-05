 import { useState, useEffect } from 'react'
 import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../services/admin.api'
 import { useToolbar } from '../contexts/ToolbarContext'
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
   XCircle,
   ChevronDown,
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

 type Periodo = '7d' | '30d' | '60d' | '90d'
 
 const periodoLabels: Record<Periodo, string> = {
   '7d': 'últimos 7 dias',
   '30d': 'últimos 30 dias',
   '60d': 'últimos 60 dias',
   '90d': 'últimos 90 dias',
 }
 
 export function DashboardPage() {
   const { setSubtitle } = useToolbar()
   const [periodo, setPeriodo] = useState<Periodo>('30d')
 
   const { data: metricas, isLoading, error } = useQuery({
     queryKey: ['admin', 'metricas', 'resumo', periodo],
     queryFn: () => adminApi.obterMetricasResumo(periodo),
   })
 
   useEffect(() => {
     setSubtitle(
       <span className="inline-flex items-center gap-1">
         Visão geral dos{' '}
         <span className="relative inline-flex items-center">
           <select
             value={periodo}
             onChange={(e) => setPeriodo(e.target.value as Periodo)}
             className="appearance-none bg-transparent border-b border-muted-foreground/40 text-foreground font-medium cursor-pointer hover:border-primary focus:outline-none focus:border-primary pr-5 py-0.5 transition-colors"
           >
             {Object.entries(periodoLabels).map(([key, label]) => (
               <option key={key} value={key}>
                 {label}
               </option>
             ))}
           </select>
           <ChevronDown className="w-3.5 h-3.5 absolute right-0 pointer-events-none text-muted-foreground" />
         </span>
       </span>
     )
     return () => {
       setSubtitle(null)
     }
   }, [setSubtitle, periodo])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar metricas</p>
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
      {/* Cards de metricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tenants Ativos */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Ativos</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-foreground">
              {metricas?.tenants.total || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Organizacoes</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-green-600">{metricas?.tenants.ativos || 0} ativos</span>
            <span className="text-yellow-600">{metricas?.tenants.trial || 0} trial</span>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(metricas?.financeiro.mrr || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">MRR</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            {metricas?.financeiro.variacao_mrr && metricas.financeiro.variacao_mrr >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+{metricas.financeiro.variacao_mrr}% vs mes anterior</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-destructive">{metricas?.financeiro.variacao_mrr || 0}% vs mes anterior</span>
              </>
            )}
          </div>
        </div>

        {/* Usuarios */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-muted-foreground">Usuarios</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-foreground">
              {metricas?.usuarios.total || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total de usuarios</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-primary">{metricas?.usuarios.ativos_hoje || 0} hoje</span>
            <span className="text-muted-foreground">{metricas?.usuarios.ativos_7d || 0} (7d)</span>
          </div>
        </div>

        {/* Novos Tenants */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs text-muted-foreground">Crescimento</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-foreground">
              +{metricas?.tenants.novos_7d || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Novos (7 dias)</p>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            +{metricas?.tenants.novos_30d || 0} nos ultimos 30 dias
          </div>
        </div>
      </div>

      {/* Secao inferior */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribuicao por Plano */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Distribuicao por Plano
          </h2>
          <div className="space-y-3">
            {metricas?.distribuicao_planos.map((item) => (
              <div key={item.plano} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{item.plano}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.quantidade} ({item.percentual.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!metricas?.distribuicao_planos || metricas.distribuicao_planos.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum tenant cadastrado</p>
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Alertas</h2>
          <div className="space-y-3">
            {metricas?.alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alerta.tipo === 'error'
                    ? 'bg-destructive/10'
                    : alerta.tipo === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-primary/5'
                }`}
              >
                {alerta.tipo === 'error' ? (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                ) : alerta.tipo === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    alerta.tipo === 'error'
                      ? 'text-destructive'
                      : alerta.tipo === 'warning'
                      ? 'text-yellow-700'
                      : 'text-primary'
                  }`}
                >
                  {alerta.mensagem}
                </p>
              </div>
            ))}
            {(!metricas?.alertas || metricas.alertas.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
