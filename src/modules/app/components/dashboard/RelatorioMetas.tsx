/**
 * AIDEV-NOTE: Componente de Indicadores de Metas e Performance (PRD-18)
 * Exibe resumo de metas, metas da empresa, rankings e performance de vendedores
 */

import { Target, Trophy, TrendingUp, AlertTriangle, Users, Medal, Crown, HelpCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { RelatorioMetasDashboard } from '../../types/relatorio.types'

interface RelatorioMetasProps {
  data: RelatorioMetasDashboard
}

// ─── Helpers ───────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`
  return `R$${value.toFixed(0)}`
}

function formatMetricValue(value: number, metrica: string): string {
  if (metrica.includes('receita') || metrica.includes('valor') || metrica.includes('faturamento')) {
    return formatCurrency(value)
  }
  return value.toLocaleString('pt-BR')
}

function getProgressColor(percentual: number): string {
  if (percentual >= 100) return 'bg-emerald-500'
  if (percentual >= 70) return 'bg-primary'
  if (percentual >= 40) return 'bg-amber-500'
  return 'bg-destructive'
}

function getProgressBg(percentual: number): string {
  if (percentual >= 100) return 'bg-emerald-500/10'
  if (percentual >= 70) return 'bg-primary/10'
  if (percentual >= 40) return 'bg-amber-500/10'
  return 'bg-destructive/10'
}

function getStatusBadge(percentual: number): { label: string; className: string } {
  if (percentual >= 100) return { label: 'Atingiu', className: 'bg-emerald-500/10 text-emerald-700' }
  if (percentual >= 70) return { label: 'No caminho', className: 'bg-primary/10 text-primary' }
  if (percentual >= 40) return { label: 'Atenção', className: 'bg-amber-500/10 text-amber-700' }
  return { label: 'Em risco', className: 'bg-destructive/10 text-destructive' }
}

function getMedalIcon(posicao: number) {
  if (posicao === 1) return <Crown className="w-4 h-4 text-amber-500" />
  if (posicao === 2) return <Medal className="w-4 h-4 text-gray-400" />
  if (posicao === 3) return <Medal className="w-4 h-4 text-amber-700" />
  return <span className="w-4 h-4 text-xs text-muted-foreground font-medium flex items-center justify-center">{posicao}</span>
}

function getInitials(nome: string): string {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatMetricLabel(metrica: string): string {
  const map: Record<string, string> = {
    valor_vendas: 'Valor de Vendas',
    quantidade_vendas: 'Qtd. Vendas',
    receita: 'Receita',
    faturamento: 'Faturamento',
  }
  return map[metrica] || metrica.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Componente Principal ──────────────────────────────

export default function RelatorioMetas({ data }: RelatorioMetasProps) {
  const { resumo, metas_empresa, vendedores, ranking_vendedores, ranking_equipes } = data
  const metasNomes = resumo.metas_nomes ?? []

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        Indicadores de Metas
      </h3>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total de Metas - com popover listando as metas */}
        <ResumoCard
          label="Total de Metas"
          value={resumo.total_metas}
          icon={<Target className="w-4 h-4" />}
          color="text-primary"
          bg="bg-primary/10"
          helpContent={
            metasNomes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Metas configuradas no período:</p>
                <div className="space-y-1.5">
                  {metasNomes.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{m.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{formatMetricLabel(m.metrica)}</p>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${m.percentual >= 100 ? 'text-emerald-600' : m.percentual >= 40 ? 'text-foreground' : 'text-destructive'}`}>
                        {m.percentual}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma meta configurada para este período. Acesse Configurações → Metas para criar.</p>
            )
          }
        />
        <ResumoCard
          label="Atingidas"
          value={resumo.metas_atingidas}
          icon={<Trophy className="w-4 h-4" />}
          color="text-emerald-600"
          bg="bg-emerald-500/10"
          helpContent={<p className="text-xs text-muted-foreground">Metas que atingiram 100% ou mais do valor definido no período.</p>}
        />
        <ResumoCard
          label="Média Ating."
          value={`${resumo.media_atingimento}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color={resumo.media_atingimento >= 70 ? 'text-emerald-600' : resumo.media_atingimento >= 40 ? 'text-amber-600' : 'text-destructive'}
          bg={resumo.media_atingimento >= 70 ? 'bg-emerald-500/10' : resumo.media_atingimento >= 40 ? 'bg-amber-500/10' : 'bg-destructive/10'}
          progressValue={Math.min(resumo.media_atingimento, 100)}
          helpContent={<p className="text-xs text-muted-foreground">Média do percentual de atingimento de todas as metas ativas (empresa, equipe e individuais) no período selecionado.</p>}
        />
        <ResumoCard
          label="Em Risco"
          value={resumo.em_risco}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="text-destructive"
          bg="bg-destructive/10"
          helpContent={
            (() => {
              const emRisco = metasNomes.filter(m => m.percentual >= 1 && m.percentual < 40)
              if (emRisco.length === 0) {
                return <p className="text-xs text-muted-foreground">Nenhuma meta em risco no período. Metas com atingimento entre 1% e 39% aparecem aqui.</p>
              }
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Metas em risco ({emRisco.length}):</p>
                  <div className="space-y-1.5">
                    {emRisco.map((m, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{m.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{formatMetricLabel(m.metrica)}</p>
                        </div>
                        <span className="text-xs font-semibold text-destructive shrink-0">{m.percentual}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">Atingimento entre 1% e 39% — precisam de atenção.</p>
                </div>
              )
            })()
          }
        />
      </div>

      {/* Grid: Metas Empresa + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Metas da empresa - 3 colunas */}
        {metas_empresa.length > 0 && (
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Metas da Empresa</h4>
            <div className="space-y-3">
              {metas_empresa.map((meta, i) => (
                <MetaEmpresaRow key={i} meta={meta} />
              ))}
            </div>
          </div>
        )}

        {/* Rankings - 2 colunas */}
        {(ranking_vendedores.length > 0 || ranking_equipes.length > 0) && (
          <div className={`${metas_empresa.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'} bg-card border border-border rounded-xl p-4 space-y-4`}>
            {/* Top Vendedores */}
            {ranking_vendedores.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Top Vendedores</h4>
                </div>
                <div className="space-y-1.5">
                  {ranking_vendedores.map((rv) => (
                    <div key={rv.posicao} className="flex items-center gap-2 py-1">
                      {getMedalIcon(rv.posicao)}
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0 overflow-hidden">
                        {rv.avatar_url ? (
                          <img src={rv.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(rv.nome)
                        )}
                      </div>
                      <span className="text-sm text-foreground truncate flex-1">{rv.nome}</span>
                      <span className="text-xs font-semibold text-foreground">{rv.percentual_medio}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Equipes */}
            {ranking_equipes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Top Equipes</h4>
                </div>
                <div className="space-y-1.5">
                  {ranking_equipes.map((re) => (
                    <div key={re.posicao} className="flex items-center gap-2 py-1">
                      {getMedalIcon(re.posicao)}
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: re.cor || 'hsl(var(--primary))' }}
                      />
                      <span className="text-sm text-foreground truncate flex-1">{re.nome}</span>
                      <span className="text-xs text-muted-foreground">{re.total_membros} {re.total_membros === 1 ? 'membro' : 'membros'}</span>
                      <span className="text-xs font-semibold text-foreground">{re.percentual_medio}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance dos Vendedores */}
      {vendedores.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Performance dos Vendedores</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {vendedores.map((v) => (
              <VendedorCard key={v.usuario_id} vendedor={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ───────────────────────────────────

function ResumoCard({
  label,
  value,
  icon,
  color,
  bg,
  progressValue,
  helpContent,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  bg: string
  progressValue?: number
  helpContent?: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {helpContent && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-64 p-3">
                {helpContent}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <span className="text-xl font-bold text-foreground">{value}</span>
      {progressValue !== undefined && (
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(progressValue)}`}
            style={{ width: `${Math.min(progressValue, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function MetaEmpresaRow({ meta }: { meta: RelatorioMetasDashboard['metas_empresa'][0] }) {
  const pct = Math.min(meta.percentual, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{meta.nome}</span>
        <span className={`text-xs font-semibold ${meta.percentual >= 100 ? 'text-emerald-600' : 'text-foreground'}`}>
          {meta.percentual}%
        </span>
      </div>
      <div className={`w-full h-2 rounded-full ${getProgressBg(meta.percentual)} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(meta.percentual)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatMetricValue(meta.valor_atual, meta.metrica)} / {formatMetricValue(meta.valor_meta, meta.metrica)}
        </span>
      </div>
    </div>
  )
}

function VendedorCard({ vendedor }: { vendedor: RelatorioMetasDashboard['vendedores'][0] }) {
  const status = getStatusBadge(vendedor.percentual_medio)

  return (
    <div className="border border-border rounded-lg p-3 space-y-2.5 hover:border-primary/20 transition-colors">
      {/* Header: Avatar + Nome + Badge */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 overflow-hidden">
          {vendedor.avatar_url ? (
            <img src={vendedor.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(vendedor.nome)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{vendedor.nome}</p>
          {vendedor.equipe_nome && (
            <p className="text-xs text-muted-foreground truncate">{vendedor.equipe_nome}</p>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Barra de progresso média */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Meta geral</span>
          <span className="text-xs font-semibold text-foreground">{vendedor.percentual_medio}%</span>
        </div>
        <div className={`w-full h-1.5 rounded-full ${getProgressBg(vendedor.percentual_medio)} overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(vendedor.percentual_medio)}`}
            style={{ width: `${Math.min(vendedor.percentual_medio, 100)}%` }}
          />
        </div>
      </div>

      {/* Vendas e receita */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {vendedor.total_vendas} venda{vendedor.total_vendas !== 1 ? 's' : ''}
        </span>
        <span className="font-semibold text-foreground">{formatCurrency(vendedor.receita_gerada)}</span>
      </div>
    </div>
  )
}
