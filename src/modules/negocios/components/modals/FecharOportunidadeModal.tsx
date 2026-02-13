/**
 * AIDEV-NOTE: Modal para fechar oportunidade como Ganho ou Perda
 * Conforme PRD-07 RF-09
 * Usa ModalBase (size="sm") com cor semântica
 * Bloqueia submit se exigir_motivo_resultado está ativo e nenhum motivo foi selecionado
 */

import { useState, useEffect } from 'react'
import { Loader2, Trophy, XCircle, AlertCircle } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { supabase } from '@/lib/supabase'
import { useFecharOportunidade } from '../../hooks/useKanban'
import { toast } from 'sonner'
import type { Oportunidade } from '../../services/negocios.api'

interface MotivoResultado {
  id: string
  nome: string
  descricao?: string | null
  cor?: string | null
}

interface FecharOportunidadeModalProps {
  oportunidade: Oportunidade
  etapaDestinoId: string
  tipo: 'ganho' | 'perda'
  funilId: string
  onClose: () => void
  onSuccess: () => void
}

export function FecharOportunidadeModal({
  oportunidade,
  etapaDestinoId,
  tipo,
  funilId,
  onClose,
  onSuccess,
}: FecharOportunidadeModalProps) {
  const [motivos, setMotivos] = useState<MotivoResultado[]>([])
  const [motivoSelecionado, setMotivoSelecionado] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [carregandoMotivos, setCarregandoMotivos] = useState(true)
  const [exigirMotivo, setExigirMotivo] = useState(false)

  const fecharOp = useFecharOportunidade()

  const isGanho = tipo === 'ganho'
  const Icon = isGanho ? Trophy : XCircle
  const titulo = isGanho ? 'Fechar como Ganho' : 'Fechar como Perdido'
  const descricao = isGanho
    ? `Parabéns! Marcar "${oportunidade.titulo}" como ganha.`
    : `Marcar "${oportunidade.titulo}" como perdida.`

  // AIDEV-NOTE: Motivo é obrigatório se exigir_motivo_resultado está ativo E existem motivos cadastrados
  const motivoObrigatorioAtivo = exigirMotivo && motivos.length > 0
  const submitBloqueado = motivoObrigatorioAtivo && !motivoSelecionado

  // Carregar motivos vinculados ao funil + config de exigir motivo
  useEffect(() => {
    async function carregarMotivos() {
      try {
        // Buscar config do funil (exigir_motivo_resultado)
        const { data: funilData } = await supabase
          .from('funis')
          .select('exigir_motivo_resultado')
          .eq('id', funilId)
          .single()

        setExigirMotivo(funilData?.exigir_motivo_resultado ?? false)

        // Buscar motivos vinculados ao funil
        const { data: vinculados } = await supabase
          .from('funis_motivos')
          .select('motivo_id')
          .eq('funil_id', funilId)
          .eq('ativo', true)

        const motivoIds = vinculados?.map(v => v.motivo_id) || []

        let query = supabase
          .from('motivos_resultado')
          .select('id, nome, descricao, cor')
          .eq('tipo', tipo)
          .eq('ativo', true)
          .is('deletado_em', null)
          .order('ordem', { ascending: true })

        if (motivoIds.length > 0) {
          query = query.in('id', motivoIds)
        }

        const { data, error } = await query

        if (error) throw error
        setMotivos(data || [])
      } catch (err) {
        console.error('Erro ao carregar motivos:', err)
      } finally {
        setCarregandoMotivos(false)
      }
    }

    carregarMotivos()
  }, [funilId, tipo])

  const handleSubmit = async () => {
    if (submitBloqueado) {
      toast.error('Selecione um motivo para continuar')
      return
    }

    fecharOp.mutate(
      {
        oportunidadeId: oportunidade.id,
        tipo,
        etapaDestinoId,
        motivoId: motivoSelecionado || undefined,
        observacoes: observacoes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao fechar oportunidade')
        },
      }
    )
  }

  return (
    <ModalBase
      onClose={onClose}
      title={titulo}
      description={descricao}
      icon={Icon}
      variant="edit"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={fecharOp.isPending || submitBloqueado}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${isGanho
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            `}
          >
            {fecharOp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGanho ? 'Marcar como Ganho' : 'Marcar como Perdido'}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-5">
        {/* Motivos */}
        {carregandoMotivos ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : motivos.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Motivo {isGanho ? 'do ganho' : 'da perda'}
              {motivoObrigatorioAtivo && (
                <span className="text-destructive ml-1">*</span>
              )}
            </label>
            <div className="space-y-2">
              {motivos.map(motivo => (
                <label
                  key={motivo.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${motivoSelecionado === motivo.id
                      ? isGanho
                        ? 'border-success bg-success/5'
                        : 'border-destructive bg-destructive/5'
                      : 'border-border hover:bg-accent'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value={motivo.id}
                    checked={motivoSelecionado === motivo.id}
                    onChange={() => setMotivoSelecionado(motivo.id)}
                    className="sr-only"
                  />
                  <div
                    className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      transition-all duration-200
                      ${motivoSelecionado === motivo.id
                        ? isGanho
                          ? 'border-success'
                          : 'border-destructive'
                        : 'border-muted-foreground/40'
                      }
                    `}
                  >
                    {motivoSelecionado === motivo.id && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isGanho ? 'bg-success' : 'bg-destructive'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {motivo.nome}
                    </span>
                    {motivo.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {motivo.descricao}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {submitBloqueado && (
              <div className="flex items-center gap-1.5 mt-2 text-destructive">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Selecione um motivo para continuar</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-xs text-muted-foreground">
              Nenhum motivo cadastrado para {isGanho ? 'ganho' : 'perda'}.
              Configure em Configurações &gt; Motivos de resultado.
            </p>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações opcionais sobre o resultado..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>
    </ModalBase>
  )
}
