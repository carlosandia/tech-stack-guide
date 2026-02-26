/**
 * AIDEV-NOTE: Painel de configuração de exibição do dashboard.
 * Popover com switches para cada bloco configurável.
 */

import { Settings2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import type { DashboardDisplayConfig, SectionId } from '../../hooks/useDashboardDisplay'

interface Props {
  config: DashboardDisplayConfig
  onToggle: (id: SectionId) => void
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'metas', label: 'Indicadores de metas' },
  { id: 'funil', label: 'Funil de conversão' },
  { id: 'reunioes', label: 'Indicadores de reuniões' },
  { id: 'kpis-principais', label: 'Principais' },
  { id: 'canal', label: 'Por canal de origem' },
  { id: 'motivos', label: 'Motivos de ganho e perda' },
]

export default function DashboardDisplayConfig({ config, onToggle }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
          title="Configurar exibição"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Exibição
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" side="bottom">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Exibição</span>
        </div>
        <div className="space-y-1">
          {SECTIONS.map((s) => (
            <label
              key={s.id}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <span className="text-sm text-foreground">{s.label}</span>
              <Switch
                checked={config[s.id]}
                onCheckedChange={() => onToggle(s.id)}
              />
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
