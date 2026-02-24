/**
 * AIDEV-NOTE: Aba Distribuição da configuração de pipeline
 * Conforme PRD-07 RF-06 - Manual/Rodízio
 */

import { useState, useEffect, useMemo } from 'react'
import { Users, RefreshCw, Clock, Shield } from 'lucide-react'
import { useDistribuicao, useSalvarDistribuicao } from '../../hooks/usePipelineConfig'

interface Props {
  funilId: string
}

const DIAS_SEMANA = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

export function ConfigDistribuicao({ funilId }: Props) {
  const { data: config, isLoading } = useDistribuicao(funilId)
  const salvar = useSalvarDistribuicao(funilId)

  const [modo, setModo] = useState<string>('manual')
  const [horarioEspecifico, setHorarioEspecifico] = useState(false)
  const [horarioInicio, setHorarioInicio] = useState('09:00')
  const [horarioFim, setHorarioFim] = useState('18:00')
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5])
  const [pularInativos, setPularInativos] = useState(true)
  const [fallbackManual, setFallbackManual] = useState(true)
  const [slaAtivo, setSlaAtivo] = useState(false)
  const [slaTempoMinutos, setSlaTempoMinutos] = useState(30)
  const [slaMaxRedistribuicoes, setSlaMaxRedistribuicoes] = useState(3)
  const [slaAcaoLimite, setSlaAcaoLimite] = useState('manter_ultimo')

  // Load config
  useEffect(() => {
    if (config) {
      setModo(config.modo || 'manual')
      setHorarioEspecifico(config.horario_especifico || false)
      setHorarioInicio(config.horario_inicio || '09:00')
      setHorarioFim(config.horario_fim || '18:00')
      setDiasSemana(config.dias_semana || [1, 2, 3, 4, 5])
      setPularInativos(config.pular_inativos ?? true)
      setFallbackManual(config.fallback_manual ?? true)
      setSlaAtivo(config.sla_ativo || false)
      setSlaTempoMinutos(config.sla_tempo_minutos || 30)
      setSlaMaxRedistribuicoes(config.sla_max_redistribuicoes || 3)
      setSlaAcaoLimite(config.sla_acao_limite || 'manter_ultimo')
    }
  }, [config])

  // Detectar se há alterações pendentes
  const temAlteracoes = useMemo(() => {
    if (!config) {
      // Se não existe config salva, qualquer valor diferente do default é alteração
      return modo !== 'manual'
    }
    const arraysIguais = (a: number[], b: number[]) =>
      a.length === b.length && a.every((v, i) => v === b[i])

    return (
      modo !== (config.modo || 'manual') ||
      horarioEspecifico !== (config.horario_especifico || false) ||
      horarioInicio !== (config.horario_inicio || '09:00') ||
      horarioFim !== (config.horario_fim || '18:00') ||
      !arraysIguais([...diasSemana].sort(), [...(config.dias_semana || [1, 2, 3, 4, 5])].sort()) ||
      pularInativos !== (config.pular_inativos ?? true) ||
      fallbackManual !== (config.fallback_manual ?? true) ||
      slaAtivo !== (config.sla_ativo || false) ||
      slaTempoMinutos !== (config.sla_tempo_minutos || 30) ||
      slaMaxRedistribuicoes !== (config.sla_max_redistribuicoes || 3) ||
      slaAcaoLimite !== (config.sla_acao_limite || 'manter_ultimo')
    )
  }, [config, modo, horarioEspecifico, horarioInicio, horarioFim, diasSemana, pularInativos, fallbackManual, slaAtivo, slaTempoMinutos, slaMaxRedistribuicoes, slaAcaoLimite])

  const handleSalvar = () => {
    salvar.mutate({
      modo,
      horario_especifico: horarioEspecifico,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      dias_semana: diasSemana,
      pular_inativos: pularInativos,
      fallback_manual: fallbackManual,
      sla_ativo: slaAtivo,
      sla_tempo_minutos: slaTempoMinutos,
      sla_max_redistribuicoes: slaMaxRedistribuicoes,
      sla_acao_limite: slaAcaoLimite,
    })
  }

  const toggleDia = (dia: number) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Distribuição de Leads</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha como os leads serão atribuídos aos vendedores
        </p>
      </div>

      {/* Modo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setModo('manual')}
          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
            modo === 'manual'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30'
          }`}
        >
          <Users className={`w-6 h-6 mb-2 ${modo === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="text-sm font-medium text-foreground">Manual</div>
          <div className="text-xs text-muted-foreground mt-0.5">Atribuição manual de leads</div>
        </button>

        <button
          onClick={() => setModo('rodizio')}
          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
            modo === 'rodizio'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30'
          }`}
        >
          <RefreshCw className={`w-6 h-6 mb-2 ${modo === 'rodizio' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="text-sm font-medium text-foreground">Rodízio</div>
          <div className="text-xs text-muted-foreground mt-0.5">Distribuição automática</div>
        </button>
      </div>

      {/* Config Rodízio */}
      {modo === 'rodizio' && (
        <div className="space-y-5 border border-border rounded-lg p-4 bg-card">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Configurações Avançadas
          </h4>

          {/* Horário específico */}
          <ToggleRow
            label="Apenas em Horário Específico"
            description="Distribuir leads apenas em horários e dias específicos"
            checked={horarioEspecifico}
            onChange={setHorarioEspecifico}
          />

          {horarioEspecifico && (
            <div className="pl-4 border-l-2 border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={horarioInicio}
                  onChange={e => setHorarioInicio(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-sm text-muted-foreground">às</span>
                <input
                  type="time"
                  value={horarioFim}
                  onChange={e => setHorarioFim(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="flex gap-1.5">
                {DIAS_SEMANA.map(dia => (
                  <button
                    key={dia.value}
                    onClick={() => toggleDia(dia.value)}
                    className={`w-10 h-8 text-xs rounded-md font-medium transition-all duration-200 ${
                      diasSemana.includes(dia.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ToggleRow
            label="Pular Vendedores Inativos"
            description="Não distribuir para vendedores marcados como inativos"
            checked={pularInativos}
            onChange={setPularInativos}
          />

          <ToggleRow
            label="Fallback para Manual"
            description="Se não houver vendedores disponíveis, permitir atribuição manual"
            checked={fallbackManual}
            onChange={setFallbackManual}
          />

          {/* SLA */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              SLA de Resposta
            </h4>

            <ToggleRow
              label="Habilitar SLA"
              description="Redistribui automaticamente se vendedor não responder no prazo"
              checked={slaAtivo}
              onChange={setSlaAtivo}
            />

            {slaAtivo && (
              <div className="pl-4 space-y-3 mt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tempo Limite (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={slaTempoMinutos}
                    onChange={e => setSlaTempoMinutos(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Máx. Redistribuições</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={slaMaxRedistribuicoes}
                    onChange={e => setSlaMaxRedistribuicoes(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Após atingir limite</label>
                  <select
                    value={slaAcaoLimite}
                    onChange={e => setSlaAcaoLimite(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="manter_ultimo">Manter com último vendedor</option>
                    <option value="retornar_admin">Retornar para Admin</option>
                    <option value="desatribuir">Desatribuir (sem responsável)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Footer fixo — aparece apenas quando há alterações */}
      {temAlteracoes && (
        <div className="flex-shrink-0 pt-3 border-t border-border flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={salvar.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {salvar.isPending ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      )}
    </div>
  )
}

// Toggle Row helper component
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-all duration-200 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
