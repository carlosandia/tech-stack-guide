/**
 * AIDEV-NOTE: Configuração do nó Delay — suporta modo relativo (duração) e agendado (data/hora)
 */

interface DelayConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function DelayConfig({ data, onUpdate }: DelayConfigProps) {
  const modo = (data.modo_delay as string) || 'relativo'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Configurar Delay</label>
        <p className="text-xs text-muted-foreground mb-3">Quanto tempo aguardar antes de continuar</p>
      </div>

      {/* Modo do delay */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
        <select
          value={modo}
          onChange={e => onUpdate({ ...data, modo_delay: e.target.value })}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="relativo">Aguardar duração</option>
          <option value="agendado">Agendar para data/hora</option>
        </select>
      </div>

      {modo === 'relativo' ? (
        <>
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
        </>
      ) : (
        <>
          {/* Data agendada */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <input
              type="date"
              value={(data.data_agendada as string) || ''}
              onChange={e => onUpdate({ ...data, data_agendada: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Hora agendada */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hora</label>
            <input
              type="time"
              value={(data.hora_agendada as string) || ''}
              onChange={e => onUpdate({ ...data, hora_agendada: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            O fluxo continuará na data e hora selecionadas (fuso do tenant).
          </p>
        </>
      )}
    </div>
  )
}
