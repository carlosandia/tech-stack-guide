/**
 * AIDEV-NOTE: Gráfico de Motivos de Ganho (PRD-18)
 * Recharts BarChart horizontal com cores dos motivos
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { HelpCircle, CheckCircle } from 'lucide-react'
import type { MotivosPerdaItem } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MotivosGanhoProps {
  data: MotivosPerdaItem[]
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const item = payload[0].payload as MotivosPerdaItem
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-md text-xs">
      <p className="font-semibold text-foreground">{item.nome}</p>
      <p className="text-muted-foreground">{item.quantidade} negócio(s) · {item.percentual}%</p>
    </div>
  )
}

export default function MotivosGanho({ data }: MotivosGanhoProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-foreground">Principais Motivos de Ganho</h3>
          <TooltipInfo>
            <p>Razões mais comuns pelas quais negócios foram ganhos no período.</p>
          </TooltipInfo>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum ganho registrado no período selecionado.
        </p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    label: `${item.nome} (${item.percentual}%)`,
  }))

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-foreground">Principais Motivos de Ganho</h3>
        <TooltipInfo>
          <p>Razões mais comuns pelas quais negócios foram ganhos no período.</p>
        </TooltipInfo>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 120)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="nome"
            width={140}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="quantidade" radius={[0, 6, 6, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
