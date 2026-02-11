/**
 * AIDEV-NOTE: Configuração do nó Ação
 * Reorganizado com categorias do PRD Melhorias (Parte 7)
 */

import { ACAO_TIPOS, ACAO_CATEGORIAS } from '../../schemas/automacoes.schema'

interface AcaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function AcaoConfig({ data, onUpdate }: AcaoConfigProps) {
  const currentTipo = data.tipo as string

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Ação</label>
        <p className="text-xs text-muted-foreground mb-2">O que deve acontecer?</p>
      </div>

      {ACAO_CATEGORIAS.map(cat => {
        const acoes = ACAO_TIPOS.filter(a => a.categoria === cat.key && a.tipo !== 'aguardar')
        if (acoes.length === 0) return null
        return (
          <div key={cat.key}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {cat.label}
            </p>
            <div className="space-y-1">
              {acoes.map(a => (
                <button
                  key={a.tipo}
                  onClick={() => onUpdate({ ...data, tipo: a.tipo })}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${currentTipo === a.tipo
                      ? 'bg-green-50 text-green-700 border border-green-300'
                      : 'hover:bg-accent text-foreground border border-transparent'
                    }
                  `}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
