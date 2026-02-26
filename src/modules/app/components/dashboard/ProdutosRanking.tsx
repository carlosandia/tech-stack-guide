/**
 * AIDEV-NOTE: Ranking de Produtos Mais Vendidos (PRD-18)
 * Lista visual com barras proporcionais e medalhas top 3
 */

import { Package, HelpCircle } from 'lucide-react'
import type { ProdutoRankingItem } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ProdutosRankingProps {
  data: ProdutoRankingItem[]
}

function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs" side="top">
        {children}
      </PopoverContent>
    </Popover>
  )
}

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}k`
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const medalhas = ['🥇', '🥈', '🥉']

export default function ProdutosRanking({ data }: ProdutosRankingProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Produtos Mais Vendidos</h3>
          <TooltipInfo>
            <p>Ranking dos produtos com maior volume de vendas no período.</p>
          </TooltipInfo>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum produto vendido no período selecionado.
        </p>
      </div>
    )
  }

  const maxQuantidade = Math.max(...data.map((p) => p.quantidade))

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Produtos Mais Vendidos</h3>
        <TooltipInfo>
          <p>Ranking dos produtos com maior volume de vendas no período.</p>
        </TooltipInfo>
      </div>

      <div className="space-y-3">
        {data.map((produto, index) => {
          const percent = maxQuantidade > 0 ? (produto.quantidade / maxQuantidade) * 100 : 0
          return (
            <div key={produto.nome} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm w-6 text-center shrink-0">
                    {index < 3 ? medalhas[index] : `${index + 1}º`}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">{produto.nome}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span>{produto.quantidade} un.</span>
                  <span className="font-medium text-foreground">{formatarMoeda(produto.receita)}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 ml-8" style={{ width: 'calc(100% - 2rem)' }}>
                <div
                  className="bg-primary/70 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
