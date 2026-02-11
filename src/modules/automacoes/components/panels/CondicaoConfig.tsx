/**
 * AIDEV-NOTE: Configuração do nó Condição com suporte a múltiplas regras AND
 * Cada regra tem campo + operador + valor
 */

import { Plus, Trash2 } from 'lucide-react'
import { CAMPOS_CONDICAO } from '../../schemas/automacoes.schema'

interface CondicaoRegra {
  campo: string
  operador: string
  valor: string
}

interface CondicaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

const OPERADORES = [
  { value: 'igual', label: 'Igual a' },
  { value: 'diferente', label: 'Diferente de' },
  { value: 'contem', label: 'Contém' },
  { value: 'maior', label: 'Maior que' },
  { value: 'menor', label: 'Menor que' },
  { value: 'vazio', label: 'Está vazio' },
  { value: 'nao_vazio', label: 'Não está vazio' },
]

function parseRegras(data: Record<string, unknown>): CondicaoRegra[] {
  const regras = data.regras as CondicaoRegra[] | undefined
  if (Array.isArray(regras) && regras.length > 0) return regras

  // Retrocompatibilidade: migrar campo/operador/valor antigos para regras[]
  if (data.campo) {
    return [{
      campo: (data.campo as string) || '',
      operador: (data.operador as string) || '',
      valor: (data.valor as string) || '',
    }]
  }

  return [{ campo: '', operador: '', valor: '' }]
}

// AIDEV-NOTE: Agrupa CAMPOS_CONDICAO por "grupo" para exibir optgroups
const gruposCampos = CAMPOS_CONDICAO.reduce((acc, c) => {
  if (!acc[c.grupo]) acc[c.grupo] = []
  acc[c.grupo].push(c)
  return acc
}, {} as Record<string, typeof CAMPOS_CONDICAO[number][]>)

export function CondicaoConfig({ data, onUpdate }: CondicaoConfigProps) {
  const regras = parseRegras(data)

  const updateRegra = (index: number, patch: Partial<CondicaoRegra>) => {
    const novas = regras.map((r, i) => i === index ? { ...r, ...patch } : r)
    const primeira = novas[0]
    const campoInfo = CAMPOS_CONDICAO.find(c => c.value === primeira.campo)
    onUpdate({
      ...data,
      regras: novas,
      // Manter campos legados para compatibilidade com o CondicaoNode label
      campo: primeira.campo,
      operador: primeira.operador,
      valor: primeira.valor,
      label: campoInfo?.label || '',
    })
  }

  const adicionarRegra = () => {
    const novas = [...regras, { campo: '', operador: '', valor: '' }]
    onUpdate({ ...data, regras: novas })
  }

  const removerRegra = (index: number) => {
    if (regras.length <= 1) return
    const novas = regras.filter((_, i) => i !== index)
    const primeira = novas[0]
    const campoInfo = CAMPOS_CONDICAO.find(c => c.value === primeira.campo)
    onUpdate({
      ...data,
      regras: novas,
      campo: primeira.campo,
      operador: primeira.operador,
      valor: primeira.valor,
      label: campoInfo?.label || '',
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Configurar Condição</label>
        <p className="text-xs text-muted-foreground mb-3">
          {regras.length > 1
            ? `Todas as ${regras.length} regras devem ser verdadeiras (AND)`
            : 'Define qual critério deve ser avaliado'}
        </p>
      </div>

      {regras.map((regra, index) => {
        const showValor = Boolean(regra.operador) && regra.operador !== 'vazio' && regra.operador !== 'nao_vazio'

        return (
          <div key={index} className="space-y-3">
            {index > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-white px-2">E (AND)</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <div className="relative border border-border/60 rounded-md p-3 space-y-3 bg-muted/20">
              {regras.length > 1 && (
                <button
                  onClick={() => removerRegra(index)}
                  className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remover regra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Campo</label>
                <select
                  value={regra.campo}
                  onChange={e => updateRegra(index, { campo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(gruposCampos).map(([grupo, campos]) => (
                    <optgroup key={grupo} label={grupo}>
                      {campos.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Operador</label>
                <select
                  value={regra.operador}
                  onChange={e => updateRegra(index, { operador: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {OPERADORES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {showValor && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Valor</label>
                  <input
                    type="text"
                    value={regra.valor}
                    onChange={e => updateRegra(index, { valor: e.target.value })}
                    placeholder="Digite o valor..."
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Botão adicionar regra AND */}
      <button
        onClick={adicionarRegra}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-2"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar condição (AND)
      </button>
    </div>
  )
}
