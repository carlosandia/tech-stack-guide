/**
 * AIDEV-NOTE: Widget de Invest Mode (PRD-18 Fase 2)
 * Banner quando desativado, formulário + métricas quando ativado
 */

import { useState } from 'react'
import { Unlock, DollarSign, TrendingUp, ChevronRight, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSalvarInvestimento } from '../../hooks/useRelatorioFunil'
import type { RelatorioFunilResponse, SalvarInvestimentoPayload } from '../../types/relatorio.types'

interface InvestModeWidgetProps {
  data: RelatorioFunilResponse
}

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function InvestModeWidget({ data }: InvestModeWidgetProps) {
  const [showForm, setShowForm] = useState(false)
  const [metaAds, setMetaAds] = useState('')
  const [googleAds, setGoogleAds] = useState('')
  const [outros, setOutros] = useState('')
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
      onSuccess: () => setShowForm(false),
    })
  }

  // Quando invest_mode ativo: exibir métricas de custo
  if (investMode.ativo) {
    const metricas = [
      { label: 'Total Investido', valor: formatarMoeda(investMode.total_investido) },
      { label: 'CPL', valor: investMode.cpl ? formatarMoeda(investMode.cpl) : '—' },
      { label: 'CAC', valor: investMode.cac ? formatarMoeda(investMode.cac) : '—' },
      {
        label: 'ROMI',
        valor: investMode.romi !== null ? `${investMode.romi}%` : '—',
        color: investMode.romi !== null && investMode.romi > 0 ? 'text-emerald-500' : 'text-red-500',
      },
    ]

    return (
      <div className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-foreground">Métricas de Investimento</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Editar investimento
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metricas.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</p>
              <p className={`text-lg font-bold ${m.color || 'text-foreground'}`}>{m.valor}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Formulário aberto
  if (showForm) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Informar investimento — {data.periodo.label}
            </span>
          </div>
          <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-xs">Meta Ads (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={metaAds}
              onChange={(e) => setMetaAds(e.target.value)}
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
            />
          </div>
        </div>
        <button
          onClick={handleSalvar}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          Salvar e calcular
        </button>
      </div>
    )
  }

  // Banner: CTA para desbloquear
  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between group hover:from-primary/10 hover:to-violet-500/10 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Unlock className="w-5 h-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">
            Desbloqueie métricas de custo
          </p>
          <p className="text-xs text-muted-foreground">
            Informe seu investimento para calcular CPL, CAC e ROMI automaticamente
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  )
}
