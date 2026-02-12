/**
 * AIDEV-NOTE: Configuração do nó Trigger
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TRIGGER_TIPOS, TRIGGER_CATEGORIAS } from '../../schemas/automacoes.schema'

interface TriggerConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function TriggerConfig({ data, onUpdate }: TriggerConfigProps) {
  const currentTipo = data.trigger_tipo as string
  // Primeira categoria expandida por padrão
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set([TRIGGER_CATEGORIAS[0]?.key])
  )

  const toggleCat = (key: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Gatilho</label>
        <p className="text-xs text-muted-foreground mb-2">Quando esta automação deve ser ativada?</p>
      </div>

      {TRIGGER_CATEGORIAS.map(cat => {
        const triggers = TRIGGER_TIPOS.filter(t => t.categoria === cat.key)
        if (triggers.length === 0) return null
        const isExpanded = expandedCats.has(cat.key)
        return (
          <div key={cat.key}>
            <button
              type="button"
              onClick={() => toggleCat(cat.key)}
              className="flex items-center gap-1 w-full text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
            {isExpanded && (
              <div className="space-y-1">
                {triggers.map(t => (
                  <button
                    key={t.tipo}
                    onClick={() => onUpdate({ ...data, trigger_tipo: t.tipo })}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${currentTipo === t.tipo
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'hover:bg-accent text-foreground border border-transparent'
                      }
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
