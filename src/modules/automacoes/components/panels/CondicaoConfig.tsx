/**
 * AIDEV-NOTE: Configuração do nó Condição
 */

interface CondicaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

const CAMPOS_DISPONIVEIS = [
  { value: 'contato.email', label: 'Email do contato' },
  { value: 'contato.telefone', label: 'Telefone do contato' },
  { value: 'oportunidade.valor', label: 'Valor da oportunidade' },
  { value: 'oportunidade.etapa', label: 'Etapa da oportunidade' },
  { value: 'oportunidade.funil', label: 'Funil' },
]

const OPERADORES = [
  { value: 'igual', label: 'Igual a' },
  { value: 'diferente', label: 'Diferente de' },
  { value: 'contem', label: 'Contém' },
  { value: 'maior', label: 'Maior que' },
  { value: 'menor', label: 'Menor que' },
  { value: 'vazio', label: 'Está vazio' },
  { value: 'nao_vazio', label: 'Não está vazio' },
]

export function CondicaoConfig({ data, onUpdate }: CondicaoConfigProps) {
  const campo = (data.campo as string) || ''
  const operador = (data.operador as string) || ''
  const valor = (data.valor as string) || ''
  const showValor = Boolean(operador) && operador !== 'vazio' && operador !== 'nao_vazio'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Configurar Condição</label>
        <p className="text-xs text-muted-foreground mb-3">Define qual critério deve ser avaliado</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Campo</label>
        <select
          value={campo}
          onChange={e => onUpdate({ ...data, campo: e.target.value, label: CAMPOS_DISPONIVEIS.find(c => c.value === e.target.value)?.label || '' })}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Selecione...</option>
          {CAMPOS_DISPONIVEIS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Operador</label>
        <select
          value={operador}
          onChange={e => onUpdate({ ...data, operador: e.target.value })}
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
            value={valor}
            onChange={e => onUpdate({ ...data, valor: e.target.value })}
            placeholder="Digite o valor..."
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  )
}
