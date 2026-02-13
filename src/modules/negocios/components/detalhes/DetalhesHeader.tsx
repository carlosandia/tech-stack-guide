/**
 * AIDEV-NOTE: Header do Modal de Detalhes (RF-14.1)
 * Título + Badge qualificação + Stepper de etapas clicáveis + Excluir
 */

import { useState } from 'react'
import { Check, ChevronRight, MoreVertical, Trash2, X } from 'lucide-react'
import type { Oportunidade, EtapaFunil } from '../../services/negocios.api'

interface DetalhesHeaderProps {
  oportunidade: Oportunidade
  etapas: EtapaFunil[]
  onMoverEtapa: (etapaId: string, tipoEtapa: string) => void
  onClose: () => void
  onExcluir?: () => void
  excluindo?: boolean
}

function getQualificacaoLabel(op: Oportunidade): { label: string; className: string } | null {
  if (op.qualificado_sql) return { label: 'SQL', className: 'bg-primary/10 text-primary' }
  if (op.qualificado_mql) return { label: 'MQL', className: 'bg-warning-muted text-warning-foreground' }
  return { label: 'Lead', className: 'bg-muted text-muted-foreground' }
}

export function DetalhesHeader({ oportunidade, etapas, onMoverEtapa, onClose, onExcluir, excluindo }: DetalhesHeaderProps) {
  const qualificacao = getQualificacaoLabel(oportunidade)
  const etapaAtualIdx = etapas.findIndex(e => e.id === oportunidade.etapa_id)
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  return (
    <div className="flex-shrink-0 border-b border-border">
      {/* Row 1: Título + Badge + Actions */}
      <div className="px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Título + Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-foreground truncate max-w-[160px] sm:max-w-[200px] lg:max-w-[280px]">
            {oportunidade.titulo}
          </h2>
          {qualificacao && (
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${qualificacao.className}`}>
              {qualificacao.label}
            </span>
          )}
        </div>

        {/* Stepper de Etapas — inline on desktop, second row on mobile */}
        <div className="hidden lg:flex flex-1 overflow-x-auto min-w-0">
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

        {/* Actions: menu + close */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Menu de ações */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto(prev => !prev)}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Ações"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {menuAberto && (
              <>
                <div
                  className="fixed inset-0 z-[500]"
                  onClick={() => { setMenuAberto(false); setConfirmarExclusao(false) }}
                />
                <div className="absolute right-0 top-full mt-1 z-[501] bg-popover border border-border rounded-lg shadow-lg py-1">
                  {!confirmarExclusao ? (
                    <button
                      type="button"
                      onClick={() => setConfirmarExclusao(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                      Excluir oportunidade
                    </button>
                  ) : (
                    <div className="px-3 py-2 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Tem certeza? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setConfirmarExclusao(false); setMenuAberto(false) }}
                          className="flex-1 px-2 py-1.5 text-xs rounded-md border border-border hover:bg-accent transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={excluindo}
                          onClick={() => {
                            onExcluir?.()
                            setMenuAberto(false)
                            setConfirmarExclusao(false)
                          }}
                          className="flex-1 px-2 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          {excluindo ? 'Excluindo…' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mobile stepper — second row with horizontal scroll */}
        <div className="w-full lg:hidden overflow-x-auto -mx-4 px-4 mt-1">
          <div className="flex items-center gap-1 min-w-max pb-1">
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
                      flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium
                      transition-all duration-200 whitespace-nowrap min-h-[32px]
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
    </div>
  )
}