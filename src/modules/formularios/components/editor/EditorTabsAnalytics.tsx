/**
 * AIDEV-NOTE: Tab Analytics do editor de formulário
 */

import { Loader2, Info } from 'lucide-react'
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

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-full">
      <div className="border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Acompanhe o desempenho do formulário</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Visualize métricas de conversão, abandonos por campo e tempo médio de preenchimento.
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
              Ex: "Ver abandonos por campo" · "Comparar taxa de conversão" · "Identificar gargalos"
            </p>
          </div>
        </div>
      </div>

      {metricas && <MetricasResumoCards metricas={metricas} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {funil && <FunilConversaoChart funil={funil} />}
        <DesempenhoCamposTable desempenho={desempenho} campos={campos} />
      </div>
    </div>
  )
}
