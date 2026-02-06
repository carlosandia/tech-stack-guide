/**
 * AIDEV-NOTE: Painel Lead Ads — listagem de formulários mapeados
 * Conforme PRD-08 Seção 2.3 - Interface Lead Ads
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Loader2, CheckCircle2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { metaAdsApi } from '../../../services/configuracoes.api'
import type { LeadAdForm } from '../../../services/configuracoes.api'
import { LeadAdsFormMappingModal } from './LeadAdsFormMappingModal'

interface LeadAdsPanelProps {
  integracaoId: string
}

export function LeadAdsPanel({ integracaoId }: LeadAdsPanelProps) {
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<LeadAdForm | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['meta-ads', 'lead-forms'],
    queryFn: () => metaAdsApi.listarFormularios(),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      metaAdsApi.atualizarFormulario(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'lead-forms'] })
      toast.success('Status atualizado')
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const handleEditMapping = (form: LeadAdForm) => {
    setSelectedForm(form)
    setMappingModalOpen(true)
  }

  const handleNewMapping = () => {
    setSelectedForm(null)
    setMappingModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const formularios = data?.formularios || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Formulários Lead Ads</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mapeie campos dos formulários do Facebook para o CRM
          </p>
        </div>
        <button
          onClick={handleNewMapping}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Formulário
        </button>
      </div>

      {formularios.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhum formulário mapeado</p>
          <p className="text-xs text-muted-foreground mb-4">
            Adicione formulários do Lead Ads para capturar leads automaticamente
          </p>
          <button
            onClick={handleNewMapping}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Formulário
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {formularios.map((form) => (
            <div
              key={form.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{form.form_name}</p>
                    <p className="text-xs text-muted-foreground">Form ID: {form.form_id}</p>
                    {form.pipeline_nome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pipeline: {form.pipeline_nome} → {form.etapa_nome || '—'}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-muted-foreground">
                        Leads: <span className="font-medium text-foreground">{form.leads_recebidos || 0}</span>
                      </p>
                      {form.ultimo_lead_em && (
                        <p className="text-xs text-muted-foreground">
                          Último: <span className="font-medium text-foreground">
                            {new Date(form.ultimo_lead_em).toLocaleDateString('pt-BR')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {form.ativo ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => handleEditMapping(form)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  Editar Mapeamento
                </button>
                <button
                  onClick={() => toggleAtivo.mutate({ id: form.id, ativo: !form.ativo })}
                  disabled={toggleAtivo.isPending}
                  className="text-xs font-medium px-2.5 py-1 rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  {form.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mappingModalOpen && (
        <LeadAdsFormMappingModal
          form={selectedForm}
          integracaoId={integracaoId}
          onClose={() => {
            setMappingModalOpen(false)
            setSelectedForm(null)
          }}
          onSuccess={() => {
            setMappingModalOpen(false)
            setSelectedForm(null)
            queryClient.invalidateQueries({ queryKey: ['meta-ads', 'lead-forms'] })
          }}
        />
      )}
    </div>
  )
}
