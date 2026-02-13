/**
 * AIDEV-NOTE: Indicador de Meta na toolbar do Kanban
 * Exibe barra de progresso compacta e popover com detalhes
 * Admin: vê empresa + todos os membros no ranking
 * Member: vê sua meta individual + ranking para incentivo
 */

import { useState, useMemo } from 'react'
import { Target, ChevronDown, Building2, User, Trophy } from 'lucide-react'
import {
  Popover,

  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/providers/AuthProvider'
import { useMetasEmpresa, useMetasIndividuais, useRanking } from '@/modules/configuracoes/hooks/useMetas'
import { getMetricaLabel, getMetricaUnidade } from '@/modules/configuracoes/schemas/metas.schema'
import type { MetaComProgresso, RankingItem } from '@/modules/configuracoes/services/configuracoes.api'

function formatValorMeta(valor: number, unidade: string): string {
  if (unidade === 'R$') {
    if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
    if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}K`
    return `R$ ${valor.toFixed(0)}`
  }
  if (unidade === '%') return `${valor.toFixed(0)}%`
  return String(valor)
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-success'
  if (pct >= 70) return 'bg-success'
  if (pct >= 40) return 'bg-warning'
  return 'bg-destructive'
}

function getDiasRestantesMes(): number {
  const hoje = new Date()
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return ultimoDia.getDate() - hoje.getDate()
}

function getStatusLabel(pct: number): { text: string; color: string } {
  if (pct >= 100) return { text: 'Atingida', color: 'text-success' }
  if (pct >= 70) return { text: 'No caminho', color: 'text-success' }
  if (pct >= 40) return { text: 'Atenção', color: 'text-warning' }
  return { text: 'Em risco', color: 'text-destructive' }
}

function MetaProgressItem({ meta }: { meta: MetaComProgresso }) {
  const pct = meta.progresso?.percentual_atingido || 0
  const valorAtual = meta.progresso?.valor_atual || 0
  const unidade = getMetricaUnidade(meta.metrica)
  const status = getStatusLabel(pct)
  const diasRestantes = getDiasRestantesMes()

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {meta.tipo === 'empresa' ? (
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {meta.nome || getMetricaLabel(meta.metrica)}
          </span>
        </div>
        <span className={`text-xs font-medium ${status.color} flex-shrink-0`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {getMetricaLabel(meta.metrica)}
        </span>
        <span className="text-xs font-medium text-foreground ml-auto whitespace-nowrap">
          {formatValorMeta(valorAtual, unidade)} / {formatValorMeta(meta.valor_meta, unidade)}
        </span>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[10px] text-muted-foreground">
          {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} no mês
        </span>
        <span className={`text-[10px] font-medium ${status.color}`}>
          {Math.round(pct)}% da meta
        </span>
      </div>
    </div>
  )
}

function RankingSection({ ranking, currentUserId }: { ranking: RankingItem[]; currentUserId?: string }) {
  if (!ranking?.length) {
    return (
      <div className="text-center py-6">
        <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma meta individual</p>
        <p className="text-xs text-muted-foreground mt-1">Configure metas individuais para os vendedores</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ranking.map((item) => {
        const isCurrentUser = item.usuario_id === currentUserId

        return (
          <div
            key={item.usuario_id}
            className={`flex items-center gap-3 ${isCurrentUser ? 'bg-primary/5 -mx-1 px-1 py-1 rounded-md' : ''}`}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                {item.posicao <= 3 ? ['🥇', '🥈', '🥉'][item.posicao - 1] : `${item.posicao}º`}
              </span>
              {item.avatar_url ? (
                <img src={item.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary">
                    {item.usuario_nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isCurrentUser ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                {item.usuario_nome}
                {isCurrentUser && <span className="text-[10px] text-primary ml-1">(você)</span>}
              </p>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(item.percentual_meta)}`}
                  style={{ width: `${Math.min(item.percentual_meta, 100)}%` }}
                />
              </div>
            </div>
            <span className={`text-xs font-semibold flex-shrink-0 ${getStatusLabel(item.percentual_meta).color}`}>
              {Math.round(item.percentual_meta)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function MetaToolbarIndicator() {
  const { role, user } = useAuth()
  const isAdmin = role === 'admin' || role === 'super_admin'
  const { data: empresaData } = useMetasEmpresa()
  const { data: individuaisData } = useMetasIndividuais()
  const { data: rankingData } = useRanking()

  // Admin: tabs empresa/individual | Member: tabs minha meta/ranking
  const [visao, setVisao] = useState<'empresa' | 'individual'>('empresa')

  // Meta principal para a barra compacta na toolbar
  const metaPrincipal = useMemo(() => {
    if (isAdmin) {
      // Admin vê meta da empresa
      return empresaData?.metas?.[0] || null
    }
    // Member vê sua meta individual
    const minhasMetas = individuaisData?.metas?.filter(
      (m: MetaComProgresso) => m.usuario_id === user?.id
    )
    return minhasMetas?.[0] || null
  }, [empresaData, individuaisData, isAdmin, user?.id])

  const pctPrincipal = metaPrincipal?.progresso?.percentual_atingido || 0
  const valorAtualPrincipal = metaPrincipal?.progresso?.valor_atual || 0
  const unidadePrincipal = metaPrincipal ? getMetricaUnidade(metaPrincipal.metrica) : 'R$'

  // Metas individuais do member
  const minhasMetas = useMemo(() => {
    if (!individuaisData?.metas) return []
    if (isAdmin) return individuaisData.metas
    return individuaisData.metas.filter((m: MetaComProgresso) => m.usuario_id === user?.id)
  }, [individuaisData, isAdmin, user?.id])

  const ranking = rankingData?.ranking || []

  if (!metaPrincipal && ranking.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors group"
          title="Meta de vendas"
        >
          <Target className="w-4 h-4 text-primary flex-shrink-0" />
          {metaPrincipal && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pctPrincipal)}`}
                  style={{ width: `${Math.min(pctPrincipal, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {formatValorMeta(valorAtualPrincipal, unidadePrincipal)}
              </span>
            </div>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setVisao('empresa')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
              visao === 'empresa'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAdmin ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                Empresa
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                Minha Meta
              </>
            )}
          </button>
          <button
            onClick={() => setVisao('individual')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
              visao === 'individual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAdmin ? (
              <>
                <User className="w-3.5 h-3.5" />
                Individual
              </>
            ) : (
              <>
                <Trophy className="w-3.5 h-3.5" />
                Ranking
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {visao === 'empresa' ? (
            <>
              {isAdmin ? (
                <>
                  {/* Admin: resumo + metas da empresa */}
                  {empresaData?.resumo && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Total', value: empresaData.resumo.total_metas },
                        { label: 'Atingidas', value: empresaData.resumo.metas_atingidas },
                        { label: 'Média', value: `${Math.round(empresaData.resumo.media_atingimento)}%` },
                        { label: 'Em Risco', value: empresaData.resumo.metas_em_risco },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          <p className="text-sm font-semibold text-foreground">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {empresaData?.metas?.map((meta: MetaComProgresso) => (
                    <MetaProgressItem key={meta.id} meta={meta} />
                  ))}

                  {(!empresaData?.metas || empresaData.metas.length === 0) && (
                    <div className="text-center py-6">
                      <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma meta configurada</p>
                      <p className="text-xs text-muted-foreground mt-1">Configure em Configurações → Metas</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Member: suas metas individuais */}
                  {minhasMetas.length > 0 ? (
                    minhasMetas.map((meta: MetaComProgresso) => (
                      <MetaProgressItem key={meta.id} meta={meta} />
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma meta atribuída a você</p>
                      <p className="text-xs text-muted-foreground mt-1">Peça ao administrador para definir suas metas</p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Ranking - visível para ambos */}
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-4 h-4 text-warning" />
                <h4 className="text-sm font-semibold text-foreground">Ranking do Período</h4>
              </div>

              <RankingSection ranking={ranking} currentUserId={user?.id} />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
