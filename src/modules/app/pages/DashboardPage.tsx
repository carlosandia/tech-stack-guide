import { useEffect, forwardRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useAppToolbar } from '../contexts/AppToolbarContext'
import { useRelatorioFunil, useFunis } from '../hooks/useRelatorioFunil'
import DashboardFilters from '../components/dashboard/DashboardFilters'
import FunilConversao from '../components/dashboard/FunilConversao'
import KPIsEstrategicos from '../components/dashboard/KPIsEstrategicos'
import BreakdownCanal from '../components/dashboard/BreakdownCanal'
import InvestModeWidget from '../components/dashboard/InvestModeWidget'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import { AlertCircle } from 'lucide-react'
import type { Periodo } from '../types/relatorio.types'

/**
 * AIDEV-NOTE: Dashboard analítico do CRM (PRD-18)
 * Substituiu o placeholder anterior com dados reais via Supabase RPC
 */

const DashboardPage = forwardRef<HTMLDivElement>(function DashboardPage(_props, ref) {
  const { user } = useAuth()
  const { setSubtitle } = useAppToolbar()

  // Estado dos filtros
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [funilId, setFunilId] = useState<string | undefined>()
  const [dataInicio, setDataInicio] = useState<string>()
  const [dataFim, setDataFim] = useState<string>()

  useEffect(() => {
    setSubtitle('Relatório de funil')
    return () => setSubtitle('')
  }, [setSubtitle])

  // Queries
  const { data: funis = [] } = useFunis()
  const {
    data: relatorio,
    isLoading,
    isError,
    error,
  } = useRelatorioFunil({
    periodo,
    funil_id: funilId,
    data_inicio: periodo === 'personalizado' ? dataInicio : undefined,
    data_fim: periodo === 'personalizado' ? dataFim : undefined,
  })

  const handleDatasChange = (inicio: string, fim: string) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }

  // Loading
  if (isLoading) {
    return (
      <div ref={ref}>
        <DashboardSkeleton />
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div ref={ref} className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            Erro ao carregar relatório
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
        </div>
      </div>
    )
  }

  if (!relatorio) return null

  return (
    <div ref={ref} className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Olá, {user?.nome || 'Usuário'} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {relatorio.periodo.label}
          </p>
        </div>
        <DashboardFilters
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          funilId={funilId}
          onFunilChange={setFunilId}
          funis={funis}
          dataInicio={dataInicio}
          dataFim={dataFim}
          onDatasChange={handleDatasChange}
        />
      </div>

      {/* Funil de Conversão */}
      <FunilConversao data={relatorio} />

      {/* Invest Mode */}
      <InvestModeWidget data={relatorio} />

      {/* KPIs Estratégicos */}
      <KPIsEstrategicos data={relatorio} />

      {/* Breakdown por Canal */}
      <BreakdownCanal data={relatorio.breakdown_canal} />
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
