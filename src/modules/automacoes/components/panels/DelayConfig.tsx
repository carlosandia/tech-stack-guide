/**
 * AIDEV-NOTE: Configuração do nó Delay
 */

interface DelayConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function DelayConfig({ data, onUpdate }: DelayConfigProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Configurar Delay</label>
        <p className="text-xs text-muted-foreground mb-3">Quanto tempo aguardar antes de continuar</p>
      </div>

      {/* Duração */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Duração</label>
        <input
          type="number"
          min={1}
          value={(data.duracao as number) || ''}
          onChange={e => onUpdate({ ...data, duracao: parseInt(e.target.value) || 0 })}
          placeholder="Ex: 30"
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Unidade */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Unidade</label>
        <select
          value={(data.unidade as string) || 'minutos'}
          onChange={e => onUpdate({ ...data, unidade: e.target.value })}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="minutos">Minutos</option>
          <option value="horas">Horas</option>
          <option value="dias">Dias</option>
        </select>
      </div>
    </div>
  )
}
