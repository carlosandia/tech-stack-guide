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
          {/* AIDEV-NOTE: GAP 3 — Sub-modo: data fixa vs dia da semana */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Agendar por</label>
            <select
              value={(data.sub_modo as string) || 'data_fixa'}
              onChange={e => onUpdate({ ...data, sub_modo: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="data_fixa">Data fixa</option>
              <option value="dia_semana">Dia da semana</option>
            </select>
          </div>

          {(data.sub_modo as string) === 'dia_semana' ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Dia da semana</label>
                <select
                  value={(data.dia_semana as string) ?? ''}
                  onChange={e => onUpdate({ ...data, dia_semana: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  <option value="1">Segunda-feira</option>
                  <option value="2">Terça-feira</option>
                  <option value="3">Quarta-feira</option>
                  <option value="4">Quinta-feira</option>
                  <option value="5">Sexta-feira</option>
                  <option value="6">Sábado</option>
                  <option value="0">Domingo</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Horário</label>
                <input
                  type="time"
                  value={(data.horario as string) || ''}
                  onChange={e => onUpdate({ ...data, horario: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                O fluxo continuará no próximo dia da semana selecionado, no horário definido.
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data</label>
                <input
                  type="date"
                  value={(data.data_agendada as string) || ''}
                  onChange={e => onUpdate({ ...data, data_agendada: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
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
        </>
      )}
    </div>
  )
}
