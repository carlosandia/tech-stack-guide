/**
 * AIDEV-NOTE: Componente de ranking de equipe
 * Conforme PRD-05 - Ranking de desempenho
 */

import { Trophy } from 'lucide-react'
import type { RankingItem } from '../../services/configuracoes.api'

interface Props {
  ranking: RankingItem[]
  loading?: boolean
}

const MEDALHAS = ['🥇', '🥈', '🥉']

export function RankingList({ ranking, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (!ranking.length) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum dado de ranking disponível</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Ranking do Período</h3>
      </div>
      <div className="divide-y divide-border">
        {ranking.map((item, idx) => (
          <div key={item.usuario_id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
            <span className="w-8 text-center text-lg">
              {idx < 3 ? MEDALHAS[idx] : (
                <span className="text-sm font-medium text-muted-foreground">{item.posicao}.</span>
              )}
            </span>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.avatar_url ? (
                <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {item.usuario_nome?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.usuario_nome}</p>
              {item.equipe_nome && (
                <p className="text-xs text-muted-foreground truncate">{item.equipe_nome}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold ${
                item.percentual_meta >= 100 ? 'text-[hsl(var(--success-foreground))]' :
                item.percentual_meta < 50 ? 'text-destructive' : 'text-foreground'
              }`}>
                {Math.round(item.percentual_meta)}%
              </p>
              {item.variacao !== 0 && (
                <p className={`text-xs ${item.variacao > 0 ? 'text-[hsl(var(--success-foreground))]' : 'text-destructive'}`}>
                  {item.variacao > 0 ? '↑' : '↓'} {Math.abs(item.variacao)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
