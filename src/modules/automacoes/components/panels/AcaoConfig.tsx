/**
 * AIDEV-NOTE: Configuração do nó Ação
 */

import { ACAO_TIPOS } from '../../schemas/automacoes.schema'

interface AcaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function AcaoConfig({ data, onUpdate }: AcaoConfigProps) {
  const currentTipo = data.tipo as string

  const categorias = [...new Set(ACAO_TIPOS.map(a => a.categoria))]

  const catLabels: Record<string, string> = {
    notificacao: 'Notificação',
    crm: 'CRM',
    controle: 'Controle',
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Ação</label>
        <p className="text-xs text-muted-foreground mb-2">O que deve acontecer?</p>
      </div>

      {categorias.map(cat => {
        const acoes = ACAO_TIPOS.filter(a => a.categoria === cat && a.tipo !== 'aguardar')
        if (acoes.length === 0) return null
        return (
          <div key={cat}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {catLabels[cat] || cat}
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
