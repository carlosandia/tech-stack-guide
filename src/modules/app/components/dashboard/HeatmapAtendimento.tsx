/**
 * AIDEV-NOTE: Heatmap de Pico de Atendimento (PRD-18)
 * Mostra volume de conversas recebidas por hora x dia da semana
 * Grid CSS customizado com escala de cores do design system
 */

import { useState, useMemo } from 'react'
import { Flame, MessageSquare, Clock } from 'lucide-react'
import type { FunilQuery } from '../../types/relatorio.types'
import { useHeatmapAtendimento } from '../../hooks/useRelatorioFunil'
import { useConfigTenant } from '@/modules/configuracoes/hooks/useConfigTenant'

type CanalFiltro = 'todos' | 'whatsapp' | 'instagram'
type TipoFiltro = 'todos' | 'individual' | 'grupo'

interface Props {
  query: FunilQuery
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
// Mostra horas de 06h a 23h (horário comercial estendido)
const HORAS = Array.from({ length: 18 }, (_, i) => i + 6)

const CANAL_OPTIONS: { value: CanalFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
]

const TIPO_OPTIONS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Ambos' },
  { value: 'individual', label: 'Individual' },
  { value: 'grupo', label: 'Grupo' },
]

// AIDEV-NOTE: 6 níveis de intensidade usando tokens semânticos
function getHeatColor(value: number, max: number, dentroHorario: boolean): string {
  if (max === 0 || value === 0) return dentroHorario ? 'bg-muted/30' : 'bg-muted/10'
  const ratio = value / max
  if (ratio <= 0.15) return 'bg-primary/10'
  if (ratio <= 0.3) return 'bg-primary/20'
  if (ratio <= 0.5) return 'bg-primary/35'
  if (ratio <= 0.7) return 'bg-primary/55'
  if (ratio <= 0.85) return 'bg-primary/75'
  return 'bg-primary'
}

function getTextColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'text-muted-foreground/50'
  const ratio = value / max
  if (ratio > 0.7) return 'text-primary-foreground'
  return 'text-foreground'
}

// AIDEV-NOTE: Parse "HH:MM" para número inteiro da hora
function parseHora(str: string | null | undefined, fallback: number): number {
  if (!str) return fallback
  const parts = str.split(':')
  const h = parseInt(parts[0], 10)
  return isNaN(h) ? fallback : h
}

const DIAS_NOMES_CURTOS: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' }

export default function HeatmapAtendimento({ query }: Props) {
  const [canal, setCanal] = useState<CanalFiltro>('todos')
  const [tipo, setTipo] = useState<TipoFiltro>('todos')
  const canalParam = canal === 'todos' ? undefined : canal
  const tipoParam = tipo === 'todos' ? undefined : tipo
  const { data, isLoading } = useHeatmapAtendimento(query, canalParam, tipoParam)
  const { data: configTenant } = useConfigTenant()

  // AIDEV-NOTE: Extrair horário comercial das configurações do tenant
  const horaInicio = parseHora(configTenant?.horario_comercial_inicio, 8)
  const horaFim = parseHora(configTenant?.horario_comercial_fim, 18)
  const diasUteis: number[] = configTenant?.dias_uteis ?? [1, 2, 3, 4, 5]

  const isDentroHorario = (dia: number, hora: number) =>
    diasUteis.includes(dia) && hora >= horaInicio && hora < horaFim
  const { grid, maxVal, pico } = useMemo(() => {
    const g: Record<string, number> = {}
    let mx = 0
    let picoItem: { dia: number; hora: number; total: number } | null = null

    if (data) {
      for (const item of data) {
        const key = `${item.dia_semana}-${item.hora}`
        g[key] = item.total
        if (item.total > mx) {
          mx = item.total
          picoItem = { dia: item.dia_semana, hora: item.hora, total: item.total }
        }
      }
    }

    return { grid: g, maxVal: mx, pico: picoItem }
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-muted-foreground" />
          Pico de Atendimento
        </h3>
        <div className="rounded-lg border border-border p-6 animate-pulse bg-muted/30 h-64" />
      </div>
    )
  }

  const totalGeral = data?.reduce((acc, item) => acc + item.total, 0) ?? 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-muted-foreground" />
            Pico de Atendimento
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-5.5">
            Volume de conversas recebidas por horário e dia da semana
          </p>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {CANAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCanal(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                canal === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />

          {TIPO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTipo(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tipo === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="rounded-lg border border-border bg-card p-4">
        {totalGeral === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">Nenhuma conversa recebida no período</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header das horas */}
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `48px repeat(${HORAS.length}, 1fr)` }}>
                  <div /> {/* Célula vazia - canto */}
                  {HORAS.map(h => {
                    const isStart = h === horaInicio
                    const isEnd = h === horaFim - 1
                    return (
                      <div
                        key={h}
                        className={`text-[10px] text-muted-foreground text-center font-medium py-1
                          ${isStart ? 'border-l-2 border-primary/20 rounded-tl-sm' : ''}
                          ${isEnd ? 'border-r-2 border-primary/20 rounded-tr-sm' : ''}
                        `}
                      >
                        {String(h).padStart(2, '0')}
                      </div>
                    )
                  })}
                </div>

                {/* Linhas dos dias (Seg a Dom reordenado: 1,2,3,4,5,6,0) */}
                {[1, 2, 3, 4, 5, 6, 0].map(dia => {
                  const diaUtil = diasUteis.includes(dia)
                  return (
                  <div
                    key={dia}
                    className={`grid gap-0.5 ${!diaUtil ? 'opacity-40' : ''}`}
                    style={{ gridTemplateColumns: `48px repeat(${HORAS.length}, 1fr)` }}
                  >
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center pr-2 py-0.5">
                      {DIAS_SEMANA[dia]}
                    </div>
                    {HORAS.map(hora => {
                      const val = grid[`${dia}-${hora}`] ?? 0
                      const isPico = pico && pico.dia === dia && pico.hora === hora
                      const dentro = isDentroHorario(dia, hora)
                      const isStart = hora === horaInicio
                      const isEnd = hora === horaFim - 1
                      return (
                        <div
                          key={hora}
                          className={`
                            aspect-square rounded-sm flex items-center justify-center
                            transition-colors cursor-default text-[9px] font-medium
                            ${getHeatColor(val, maxVal, dentro)}
                            ${getTextColor(val, maxVal)}
                            ${isPico ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                            ${!dentro && diaUtil ? 'opacity-40' : ''}
                            ${isStart ? 'border-l-2 border-primary/20' : ''}
                            ${isEnd ? 'border-r-2 border-primary/20' : ''}
                          `}
                          title={`${DIAS_SEMANA[dia]} ${String(hora).padStart(2, '0')}h — ${val} conversa${val !== 1 ? 's' : ''}${!dentro ? ' (fora do expediente)' : ''}`}
                        >
                          {val > 0 ? val : ''}
                        </div>
                      )
                    })}
                  </div>
                  )
                })}
              </div>
            </div>

            {/* Footer: legenda + pico */}
            <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-3 border-t border-border">
              {/* Legenda */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Menor</span>
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/15" />
                <div className="w-4 h-4 rounded-sm bg-primary/35" />
                <div className="w-4 h-4 rounded-sm bg-primary/55" />
                <div className="w-4 h-4 rounded-sm bg-primary/75" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
                <span>Maior</span>
              </div>

              {/* Pico + Horário comercial */}
              <div className="flex flex-col items-end gap-1">
                {pico && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Maior volume:</span>{' '}
                    {DIAS_SEMANA[pico.dia]} {String(pico.hora).padStart(2, '0')}h ({pico.total} conversa{pico.total !== 1 ? 's' : ''})
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Horário comercial: {String(horaInicio).padStart(2, '0')}h–{String(horaFim).padStart(2, '0')}h · {diasUteis.map(d => DIAS_NOMES_CURTOS[d]).join(', ')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
