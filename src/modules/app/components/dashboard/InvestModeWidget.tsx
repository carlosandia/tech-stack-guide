/**
 * AIDEV-NOTE: Widget de Invest Mode (PRD-18 Fase 2)
 * Ícone compacto nos filtros → abre Popover com formulário ou métricas
 */

import { useState } from 'react'
import { DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSalvarInvestimento } from '../../hooks/useRelatorioFunil'
import type { RelatorioFunilResponse, SalvarInvestimentoPayload } from '../../types/relatorio.types'

interface InvestModeWidgetProps {
  data: RelatorioFunilResponse
}

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function InvestModeWidget({ data }: InvestModeWidgetProps) {
  const [metaAds, setMetaAds] = useState('')
  const [googleAds, setGoogleAds] = useState('')
  const [outros, setOutros] = useState('')
  const [open, setOpen] = useState(false)
  const mutation = useSalvarInvestimento()

  const investMode = data.invest_mode

  const handleSalvar = () => {
    const payload: SalvarInvestimentoPayload = {
      periodo_inicio: data.periodo.inicio.slice(0, 10),
      periodo_fim: data.periodo.fim.slice(0, 10),
      meta_ads: parseFloat(metaAds) || 0,
      google_ads: parseFloat(googleAds) || 0,
      outros: parseFloat(outros) || 0,
    }
    mutation.mutate(payload, {
      onSuccess: () => setOpen(false),
    })
  }

  const isAtivo = investMode.ativo

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
            isAtivo
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
          title={isAtivo ? 'Métricas de investimento ativas' : 'Configurar investimento (CPL, CAC, ROMI)'}
        >
          <DollarSign className="w-3.5 h-3.5" />
          {isAtivo ? 'ROI' : 'Investimento'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-4" align="end" side="bottom">
        {isAtivo ? (
          /* Métricas de investimento ativas */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">Métricas de Investimento</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Investido', valor: formatarMoeda(investMode.total_investido) },
                { label: 'CPL', valor: investMode.cpl ? formatarMoeda(investMode.cpl) : '—' },
                { label: 'Custo/MQL', valor: investMode.cpmql ? formatarMoeda(investMode.cpmql) : '—' },
                { label: 'Custo/SQL', valor: investMode.custo_por_sql ? formatarMoeda(investMode.custo_por_sql) : '—' },
                { label: 'Custo/Reunião', valor: investMode.custo_por_reuniao ? formatarMoeda(investMode.custo_por_reuniao) : '—' },
                { label: 'CAC', valor: investMode.cac ? formatarMoeda(investMode.cac) : '—' },
                {
                  label: 'ROMI',
                  valor: investMode.romi !== null ? `${investMode.romi}%` : '—',
                  color: investMode.romi !== null && investMode.romi > 0 ? 'text-emerald-500' : 'text-destructive',
                },
              ].map((m) => (
                <div key={m.label} className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <p className={`text-sm font-bold ${'color' in m && m.color ? m.color : 'text-foreground'}`}>{m.valor}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {}}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-1 transition-colors"
            >
              Editar investimento
            </button>
          </div>
        ) : (
          /* Formulário para informar investimento */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Informar investimento
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.periodo.label} — Informe para calcular CPL, CAC e ROMI
            </p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Meta Ads (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={metaAds}
                  onChange={(e) => setMetaAds(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Google Ads (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={googleAds}
                  onChange={(e) => setGoogleAds(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Outros (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={outros}
                  onChange={(e) => setOutros(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSalvar}
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Salvar e calcular
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
