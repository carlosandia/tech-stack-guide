/**
 * AIDEV-NOTE: Configuração do nó Trigger
 */

import { TRIGGER_TIPOS, TRIGGER_CATEGORIAS } from '../../schemas/automacoes.schema'

interface TriggerConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function TriggerConfig({ data, onUpdate }: TriggerConfigProps) {
  const currentTipo = data.trigger_tipo as string

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Gatilho</label>
        <p className="text-xs text-muted-foreground mb-2">Quando esta automação deve ser ativada?</p>
      </div>

      {TRIGGER_CATEGORIAS.map(cat => {
        const triggers = TRIGGER_TIPOS.filter(t => t.categoria === cat.key)
        if (triggers.length === 0) return null
        return (
          <div key={cat.key}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{cat.label}</p>
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
          </div>
        )
      })}
    </div>
  )
}
