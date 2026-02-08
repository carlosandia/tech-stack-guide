/**
 * AIDEV-NOTE: Modal para seleção de pipeline antes de criar oportunidade
 * Conforme PRD-07 - O usuário escolhe em qual pipeline deseja criar a oportunidade
 */

import { useState, useEffect } from 'react'
import { Loader2, GitBranch } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface PipelineOption {
  id: string
  nome: string
  cor: string | null
  descricao: string | null
  etapa_entrada_id: string | null
}

interface SelecionarPipelineModalProps {
  onClose: () => void
  onSelect: (funilId: string, etapaEntradaId: string) => void
}

export function SelecionarPipelineModal({ onClose, onSelect }: SelecionarPipelineModalProps) {
  const [pipelines, setPipelines] = useState<PipelineOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionando, setSelecionando] = useState<string | null>(null)

  useEffect(() => {
    async function carregarPipelines() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Usuário não autenticado'); onClose(); return }

        const { data: usr } = await supabase
          .from('usuarios')
          .select('organizacao_id')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (!usr?.organizacao_id) { toast.error('Organização não encontrada'); onClose(); return }

        const { data: funis, error } = await supabase
          .from('funis')
          .select('id, nome, cor, descricao')
          .eq('organizacao_id', usr.organizacao_id)
          .eq('ativo', true)
          .is('deletado_em', null)
          .order('criado_em', { ascending: true })

        if (error) throw error

        if (!funis?.length) {
          toast.error('Nenhum funil configurado. Configure um funil em Negócios primeiro.')
          onClose()
          return
        }

        // Se só tem 1 pipeline, selecionar diretamente
        if (funis.length === 1) {
          await selecionarPipeline(funis[0].id)
          return
        }

        setPipelines(funis.map(f => ({
          ...f,
          etapa_entrada_id: null,
        })))
      } catch {
        toast.error('Erro ao carregar pipelines')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    carregarPipelines()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selecionarPipeline = async (funilId: string) => {
    setSelecionando(funilId)
    try {
      const { data: etapas, error } = await supabase
        .from('etapas_funil')
        .select('id')
        .eq('funil_id', funilId)
        .eq('ativo', true)
        .is('deletado_em', null)
        .order('ordem', { ascending: true })
        .limit(1)

      if (error) throw error

      if (!etapas?.length) {
        toast.error('Nenhuma etapa configurada neste funil.')
        setSelecionando(null)
        return
      }

      onSelect(funilId, etapas[0].id)
    } catch {
      toast.error('Erro ao carregar etapas do funil')
      setSelecionando(null)
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Selecionar Pipeline"
      description="Escolha em qual pipeline criar a oportunidade"
      icon={GitBranch}
      variant="create"
      size="sm"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {pipelines.map((pipeline) => (
              <button
                key={pipeline.id}
                onClick={() => selecionarPipeline(pipeline.id)}
                disabled={!!selecionando}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left disabled:opacity-50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pipeline.cor || '#3B82F6' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{pipeline.nome}</p>
                  {pipeline.descricao && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{pipeline.descricao}</p>
                  )}
                </div>
                {selecionando === pipeline.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </ModalBase>
  )
}
