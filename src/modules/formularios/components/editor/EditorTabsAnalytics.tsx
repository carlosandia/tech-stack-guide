/**
 * AIDEV-NOTE: Tab Analytics do editor de formulário - UI aprimorada
 */

import { Loader2, BarChart3 } from 'lucide-react'
import { useMetricasFormulario, useFunilConversao, useDesempenhoCampos } from '../../hooks/useFormularioAnalytics'
import { useCamposFormulario } from '../../hooks/useFormularioCampos'
import { MetricasResumoCards } from '../analytics/MetricasResumoCards'
import { FunilConversaoChart } from '../analytics/FunilConversaoChart'
import { DesempenhoCamposTable } from '../analytics/DesempenhoCamposTable'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsAnalytics({ formulario }: Props) {
  const { data: metricas, isLoading: loadingMetricas } = useMetricasFormulario(formulario.id)
  const { data: funil, isLoading: loadingFunil } = useFunilConversao(formulario.id)
  const { data: desempenho = [], isLoading: loadingDesempenho } = useDesempenhoCampos(formulario.id)
  const { data: campos = [] } = useCamposFormulario(formulario.id)

  const isLoading = loadingMetricas || loadingFunil || loadingDesempenho

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasAnyData = (metricas?.total_visualizacoes ?? 0) > 0 || (metricas?.total_submissoes ?? 0) > 0

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground">
            {hasAnyData
              ? 'Acompanhe o desempenho e identifique gargalos'
              : 'Os dados aparecerão quando o formulário receber interações'}
          </p>
        </div>
      </div>

      {/* Métricas principais */}
      {metricas && <MetricasResumoCards metricas={metricas} />}

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {funil && <FunilConversaoChart funil={funil} />}
        <DesempenhoCamposTable desempenho={desempenho} campos={campos} />
      </div>
    </div>
  )
}
