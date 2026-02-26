/**
 * AIDEV-NOTE: Widget de Invest Mode com canais dinâmicos (PRD-18 Fase 2)
 * Permite adicionar qualquer canal (Meta Ads, Google Ads, origens do tenant, nome livre)
 */

import { useState, useEffect, useMemo } from 'react'
import { DollarSign, TrendingUp, Loader2, Pencil, Trash2, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useSalvarInvestimento, useRemoverInvestimento } from '../../hooks/useRelatorioFunil'
import { useOrigensAtivas } from '@/modules/configuracoes/hooks/useOrigens'
import type { RelatorioFunilResponse, SalvarInvestimentoPayload } from '../../types/relatorio.types'

interface InvestModeWidgetProps {
  data: RelatorioFunilResponse
}

interface CanalItem {
  canal: string
  label: string
  valor: string
}

// AIDEV-NOTE: Canais pré-definidos que sempre aparecem na lista
const CANAIS_PREDEFINIDOS = [
  { canal: 'meta_ads', label: 'Meta Ads' },
  { canal: 'google_ads', label: 'Google Ads' },
]

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function canalToLabel(canal: string): string {
  const predefinido = CANAIS_PREDEFINIDOS.find(c => c.canal === canal)
  if (predefinido) return predefinido.label
  // Capitaliza primeira letra
  return canal.charAt(0).toUpperCase() + canal.slice(1).replace(/_/g, ' ')
}

export default function InvestModeWidget({ data }: InvestModeWidgetProps) {
  const [canais, setCanais] = useState<CanalItem[]>([])
  const [open, setOpen] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [buscaCanal, setBuscaCanal] = useState('')
  const mutation = useSalvarInvestimento()
  const removerMutation = useRemoverInvestimento()
  const { data: origens } = useOrigensAtivas()

  const investMode = data.invest_mode
  const isAtivo = investMode.ativo
  const mostrarFormulario = !isAtivo || modoEdicao

  // Lista de canais disponíveis (pré-definidos + origens do tenant)
  const canaisDisponiveis = useMemo(() => {
    const lista = [...CANAIS_PREDEFINIDOS]
    if (origens) {
      for (const o of origens) {
        if (!lista.find(c => c.canal === o.slug)) {
          lista.push({ canal: o.slug, label: o.nome })
        }
      }
    }
    // Excluir canais já adicionados
    const jaAdicionados = new Set(canais.map(c => c.canal))
    return lista.filter(c => !jaAdicionados.has(c.canal))
  }, [origens, canais])

  const totalInvestido = canais.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)

  const handleAdicionarCanal = (canal: string, label: string) => {
    setCanais(prev => [...prev, { canal, label, valor: '' }])
    setSeletorAberto(false)
    setBuscaCanal('')
  }

  const handleAdicionarCanalLivre = () => {
    if (!buscaCanal.trim()) return
    const slug = buscaCanal.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    if (canais.find(c => c.canal === slug)) return
    handleAdicionarCanal(slug, buscaCanal.trim())
  }

  const handleRemoverCanal = (index: number) => {
    setCanais(prev => prev.filter((_, i) => i !== index))
  }

  const handleValorChange = (index: number, valor: string) => {
    setCanais(prev => prev.map((c, i) => i === index ? { ...c, valor } : c))
  }

  const handleSalvar = () => {
    const payload: SalvarInvestimentoPayload = {
      periodo_inicio: data.periodo.inicio.slice(0, 10),
      periodo_fim: data.periodo.fim.slice(0, 10),
      canais: canais
        .filter(c => parseFloat(c.valor) > 0)
        .map(c => ({ canal: c.canal, valor: parseFloat(c.valor) || 0 })),
    }
    if (payload.canais.length === 0) return
    mutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        setModoEdicao(false)
      },
    })
  }

  const handleRemover = () => {
    removerMutation.mutate({
      periodo_inicio: data.periodo.inicio.slice(0, 10),
      periodo_fim: data.periodo.fim.slice(0, 10),
    }, {
      onSuccess: () => {
        setOpen(false)
        setModoEdicao(false)
        setCanais([])
      },
    })
  }

  const handleEditar = () => {
    setModoEdicao(true)
    if (investMode.ativo) {
      const items: CanalItem[] = Object.entries(investMode.canais).map(([canal, valor]) => ({
        canal,
        label: canalToLabel(canal),
        valor: valor > 0 ? String(valor) : '',
      }))
      setCanais(items.length > 0 ? items : [])
    }
  }

  // Ao abrir sem investimento, iniciar vazio
  useEffect(() => {
    if (open && !isAtivo && !modoEdicao) {
      setCanais([])
    }
  }, [open, isAtivo, modoEdicao])

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setModoEdicao(false); setSeletorAberto(false) } }}>
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
          Investimento
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-4" align="end" side="bottom">
        {mostrarFormulario ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {modoEdicao ? 'Editar investimento' : 'Informar investimento'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.periodo.label} — Informe para calcular CPL, CAC e ROMI
            </p>

            {/* Lista de canais adicionados */}
            <div className="space-y-2">
              {canais.map((canal, index) => (
                <div key={canal.canal} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground min-w-[80px] truncate" title={canal.label}>
                    {canal.label}
                  </span>
                  <div className="flex-1 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={canal.valor}
                      onChange={(e) => handleValorChange(index, e.target.value)}
                      className="h-8 text-sm pl-8"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoverCanal(index)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Botão adicionar canal */}
            <Popover open={seletorAberto} onOpenChange={setSeletorAberto}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar canal
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start" side="bottom">
                <Command>
                  <CommandInput
                    placeholder="Buscar ou digitar canal..."
                    value={buscaCanal}
                    onValueChange={setBuscaCanal}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {buscaCanal.trim() ? (
                        <button
                          onClick={handleAdicionarCanalLivre}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-primary hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Criar "{buscaCanal.trim()}"
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground p-2">Nenhum canal encontrado</p>
                      )}
                    </CommandEmpty>
                    {canaisDisponiveis.length > 0 && (
                      <CommandGroup>
                        {canaisDisponiveis.map(c => (
                          <CommandItem
                            key={c.canal}
                            value={c.label}
                            onSelect={() => handleAdicionarCanal(c.canal, c.label)}
                            className="text-xs"
                          >
                            {c.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Total */}
            {canais.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">{formatarMoeda(totalInvestido)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSalvar}
                disabled={mutation.isPending || canais.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Salvar
              </button>
              {modoEdicao && (
                <button
                  onClick={() => setModoEdicao(false)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ) : (
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
                { label: 'Custo/R. Agendada', valor: investMode.custo_por_reuniao_agendada ? formatarMoeda(investMode.custo_por_reuniao_agendada) : '—' },
                { label: 'Custo/R. Realizada', valor: investMode.custo_por_reuniao_realizada ? formatarMoeda(investMode.custo_por_reuniao_realizada) : '—' },
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

            {/* Breakdown por canal */}
            {investMode.canais && Object.keys(investMode.canais).length > 1 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Por canal</p>
                <div className="space-y-1">
                  {Object.entries(investMode.canais).map(([canal, valor]) => (
                    <div key={canal} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{canalToLabel(canal)}</span>
                      <span className="font-medium text-foreground">{formatarMoeda(valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEditar}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 border border-border rounded-lg transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Editar investimento
              </button>
              <button
                onClick={handleRemover}
                disabled={removerMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-destructive hover:text-destructive/80 py-1.5 border border-destructive/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {removerMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Remover
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
