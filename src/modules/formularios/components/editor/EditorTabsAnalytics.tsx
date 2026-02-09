/**
 * AIDEV-NOTE: Tab Analytics do editor de formulário
 */

import { Loader2 } from 'lucide-react'
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
      {metricas && <MetricasResumoCards metricas={metricas} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {funil && <FunilConversaoChart funil={funil} />}
        <DesempenhoCamposTable desempenho={desempenho} campos={campos} />
      </div>
    </div>
  )
}
