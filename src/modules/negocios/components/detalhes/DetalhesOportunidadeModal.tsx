/**
 * AIDEV-NOTE: Modal de Detalhes da Oportunidade (RF-14)
 * Layout: Header + 3 blocos (Campos | Abas | Histórico)
 * Desktop: 3 colunas | Mobile: stack vertical
 * Z-index conforme Design System 10.5
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader2, ClipboardList, LayoutList, Clock } from 'lucide-react'
import { useOportunidade, useExcluirOportunidade, useAvaliarQualificacao } from '../../hooks/useOportunidadeDetalhes'
import { negociosApi, type EtapaFunil, type Oportunidade } from '../../services/negocios.api'
import { DetalhesHeader } from './DetalhesHeader'
import { DetalhesCampos } from './DetalhesCampos'
import { DetalhesAbas } from './DetalhesAbas'
import { DetalhesHistorico } from './DetalhesHistorico'
import { useMoverEtapa } from '../../hooks/useKanban'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DetalhesOportunidadeModalProps {
  oportunidadeId: string
  funilId: string
  etapas: EtapaFunil[]
  onClose: () => void
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
  abaInicial?: string
}

export function DetalhesOportunidadeModal({
  oportunidadeId,
  funilId: _funilId,
  etapas,
  onClose,
  onDropGanhoPerda,
  abaInicial,
}: DetalhesOportunidadeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { data: oportunidade, isLoading } = useOportunidade(oportunidadeId)
  const moverEtapa = useMoverEtapa()
  const excluirOportunidade = useExcluirOportunidade()
  const avaliarQualificacao = useAvaliarQualificacao()

  // Avaliar qualificação MQL ao abrir o modal
  useEffect(() => {
    if (oportunidadeId) {
      avaliarQualificacao.mutate(oportunidadeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oportunidadeId])

  // Buscar membros para dropdown de responsável
  const { data: membros } = useQuery({
    queryKey: ['membros_tenant'],
    queryFn: () => negociosApi.listarMembros(),
    staleTime: 60 * 1000,
  })

  // ESC to close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [onClose])

  const queryClient = useQueryClient()

  const handleMoverEtapa = useCallback((etapaId: string, tipoEtapa: string) => {
    if (!oportunidade) return
    if (oportunidade.etapa_id === etapaId) return

    // Se ganho/perda, abrir modal de motivos
    if (tipoEtapa === 'ganho' || tipoEtapa === 'perda') {
      onDropGanhoPerda(oportunidade, etapaId, tipoEtapa as 'ganho' | 'perda')
      return
    }

    // AIDEV-NOTE: Optimistic update — atualizar etapa_id no cache local imediatamente
    queryClient.setQueryData(['oportunidade', oportunidade.id], (old: any) => {
      if (!old) return old
      return { ...old, etapa_id: etapaId }
    })

    // Mover normalmente
    moverEtapa.mutate(
      { oportunidadeId: oportunidade.id, etapaDestinoId: etapaId },
      {
        onError: () => {
          // Rollback
          queryClient.setQueryData(['oportunidade', oportunidade.id], (old: any) => {
            if (!old) return old
            return { ...old, etapa_id: oportunidade.etapa_id }
          })
          toast.error('Erro ao mover oportunidade')
        },
        onSuccess: () => toast.success('Oportunidade movida'),
      }
    )
  }, [oportunidade, moverEtapa, onDropGanhoPerda, queryClient])

  const handleExcluir = useCallback(() => {
    if (!oportunidade) return
    excluirOportunidade.mutate(oportunidade.id, {
      onSuccess: () => {
        toast.success('Oportunidade excluída')
        onClose()
      },
      onError: () => toast.error('Erro ao excluir oportunidade'),
    })
  }, [oportunidade, excluirOportunidade, onClose])

  const [mobileSection, setMobileSection] = useState<'dados' | 'atividades' | 'historico'>('atividades')

  const MOBILE_SECTIONS = [
    { id: 'dados' as const, label: 'Dados', icon: ClipboardList },
    { id: 'atividades' as const, label: 'Atividades', icon: LayoutList },
    { id: 'historico' as const, label: 'Histórico', icon: Clock },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className="
            pointer-events-auto
            bg-background border border-border shadow-lg
            flex flex-col
            w-full h-full
            sm:w-[calc(100%-16px)] sm:max-w-5xl lg:max-w-7xl
            sm:max-h-[90vh] sm:h-auto
            sm:rounded-lg
            animate-enter
          "
        >
          {isLoading || !oportunidade ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header com stepper */}
              <DetalhesHeader
                oportunidade={oportunidade}
                etapas={etapas}
                onMoverEtapa={handleMoverEtapa}
                onClose={onClose}
                onExcluir={handleExcluir}
                excluindo={excluirOportunidade.isPending}
              />

              {/* Mobile section tabs */}
              <div className="flex-shrink-0 lg:hidden border-b border-border bg-muted/30">
                <div className="flex">
                  {MOBILE_SECTIONS.map(section => {
                    const Icon = section.icon
                    const isActive = mobileSection === section.id
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setMobileSection(section.id)}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5
                          text-xs font-medium border-b-2 transition-all duration-200
                          min-h-[44px]
                          ${isActive
                            ? 'border-primary text-primary bg-background'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Body: Desktop 3 cols | Mobile sectioned */}
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col lg:flex-row lg:gap-3 lg:p-3">
                {/* Bloco 1: Campos */}
                <div className={`
                  lg:w-[280px] lg:flex-shrink-0 lg:border border-border lg:rounded-lg bg-card overflow-y-auto p-4
                  ${mobileSection === 'dados' ? 'flex-1' : 'hidden lg:block'}
                `}>
                  <DetalhesCampos
                    oportunidade={oportunidade}
                    membros={membros || []}
                  />
                </div>

                {/* Bloco 2: Abas */}
                <div className={`
                  flex-1 min-w-0 flex flex-col overflow-hidden lg:border border-border lg:rounded-lg bg-card
                  ${mobileSection === 'atividades' ? 'flex-1' : 'hidden lg:flex'}
                `}>
                  <DetalhesAbas
                    oportunidadeId={oportunidade.id}
                    usuarioAtualId={undefined}
                    emailContato={oportunidade.contato?.email}
                    abaInicial={abaInicial}
                  />
                </div>

                {/* Bloco 3: Histórico */}
                <div className={`
                  lg:w-[260px] lg:flex-shrink-0 lg:border border-border lg:rounded-lg bg-card overflow-y-auto p-4
                  ${mobileSection === 'historico' ? 'flex-1' : 'hidden lg:block'}
                `}>
                  <DetalhesHistorico oportunidadeId={oportunidade.id} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
