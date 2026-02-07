/**
 * AIDEV-NOTE: Header do Modal de Detalhes (RF-14.1)
 * Título + Badge qualificação + Stepper de etapas clicáveis
 */

import { Check, ChevronRight, X } from 'lucide-react'
import type { Oportunidade, EtapaFunil } from '../../services/negocios.api'

interface DetalhesHeaderProps {
  oportunidade: Oportunidade
  etapas: EtapaFunil[]
  onMoverEtapa: (etapaId: string, tipoEtapa: string) => void
  onClose: () => void
}

function getQualificacaoLabel(op: Oportunidade): { label: string; className: string } | null {
  if (op.qualificado_sql) return { label: 'SQL', className: 'bg-primary/10 text-primary' }
  if (op.qualificado_mql) return { label: 'MQL', className: 'bg-warning-muted text-warning-foreground' }
  return { label: 'Lead', className: 'bg-muted text-muted-foreground' }
}

export function DetalhesHeader({ oportunidade, etapas, onMoverEtapa, onClose }: DetalhesHeaderProps) {
  const qualificacao = getQualificacaoLabel(oportunidade)
  const etapaAtualIdx = etapas.findIndex(e => e.id === oportunidade.etapa_id)

  return (
    <div className="flex-shrink-0 border-b border-border">
      {/* Título + Badge + Close */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {oportunidade.titulo}
          </h2>
          {qualificacao && (
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${qualificacao.className}`}>
              {qualificacao.label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-all duration-200 flex-shrink-0"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Stepper de Etapas */}
      <div className="px-4 sm:px-6 pb-3 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {etapas.map((etapa, idx) => {
            const isAtual = etapa.id === oportunidade.etapa_id
            const isPassed = idx < etapaAtualIdx
            const isGanho = etapa.tipo === 'ganho'
            const isPerda = etapa.tipo === 'perda'

            return (
              <div key={etapa.id} className="flex items-center">
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 mx-0.5 flex-shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => onMoverEtapa(etapa.id, etapa.tipo)}
                  disabled={isAtual}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${isAtual
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isPassed
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : isGanho
                          ? 'bg-success-muted text-success-foreground hover:bg-success-muted/80'
                          : isPerda
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                    }
                    ${isAtual ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  title={isAtual ? 'Etapa atual' : `Mover para ${etapa.nome}`}
                >
                  {isPassed ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${isAtual ? 'bg-primary-foreground' : 'border border-current'}`}
                      style={!isAtual && !isGanho && !isPerda ? { borderColor: etapa.cor || undefined } : undefined}
                    />
                  )}
                  <span>{etapa.nome}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
