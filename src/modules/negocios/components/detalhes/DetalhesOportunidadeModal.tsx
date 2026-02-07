/**
 * AIDEV-NOTE: Modal de Detalhes da Oportunidade (RF-14)
 * Layout: Header + 3 blocos (Campos | Abas | Histórico)
 * Desktop: 3 colunas | Mobile: stack vertical
 * Z-index conforme Design System 10.5
 */

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useOportunidade } from '../../hooks/useOportunidadeDetalhes'
import { negociosApi, type EtapaFunil, type Oportunidade } from '../../services/negocios.api'
import { DetalhesHeader } from './DetalhesHeader'
import { DetalhesCampos } from './DetalhesCampos'
import { DetalhesAbas } from './DetalhesAbas'
import { DetalhesHistorico } from './DetalhesHistorico'
import { useMoverEtapa } from '../../hooks/useKanban'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DetalhesOportunidadeModalProps {
  oportunidadeId: string
  funilId: string
  etapas: EtapaFunil[]
  onClose: () => void
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
}

export function DetalhesOportunidadeModal({
  oportunidadeId,
  funilId: _funilId,
  etapas,
  onClose,
  onDropGanhoPerda,
}: DetalhesOportunidadeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { data: oportunidade, isLoading } = useOportunidade(oportunidadeId)
  const moverEtapa = useMoverEtapa()

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

  const handleMoverEtapa = useCallback((etapaId: string, tipoEtapa: string) => {
    if (!oportunidade) return
    if (oportunidade.etapa_id === etapaId) return

    // Se ganho/perda, abrir modal de motivos
    if (tipoEtapa === 'ganho' || tipoEtapa === 'perda') {
      onDropGanhoPerda(oportunidade, etapaId, tipoEtapa as 'ganho' | 'perda')
      return
    }

    // Mover normalmente
    moverEtapa.mutate(
      { oportunidadeId: oportunidade.id, etapaDestinoId: etapaId },
      {
        onError: () => toast.error('Erro ao mover oportunidade'),
        onSuccess: () => toast.success('Oportunidade movida'),
      }
    )
  }, [oportunidade, moverEtapa, onDropGanhoPerda])

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
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-16px)] sm:max-w-4xl lg:max-w-6xl
            max-h-[calc(100dvh-32px)] sm:max-h-[90vh]
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
              />

              {/* Body: 3 colunas desktop, stack mobile */}
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col lg:flex-row">
                {/* Bloco 1: Campos (25%) */}
                <div className="lg:w-[260px] lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto p-4">
                  <DetalhesCampos
                    oportunidade={oportunidade}
                    membros={membros || []}
                  />
                </div>

                {/* Bloco 2: Abas (50%) */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
                  <DetalhesAbas
                    oportunidadeId={oportunidade.id}
                    usuarioAtualId={undefined}
                  />
                </div>

                {/* Bloco 3: Histórico (25%) */}
                <div className="lg:w-[240px] lg:flex-shrink-0 overflow-y-auto p-4">
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
