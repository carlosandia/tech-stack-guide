/**
 * AIDEV-NOTE: Modal de mapeamento de campos Lead Ads → CRM
 * Conforme PRD-08 Seção 2.3 - Wizard de Mapeamento
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Loader2, ArrowRight } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ModalBase } from '../../ui/ModalBase'
import { metaAdsApi } from '../../../services/configuracoes.api'
import type { LeadAdForm } from '../../../services/configuracoes.api'

interface LeadAdsFormMappingModalProps {
  form: LeadAdForm | null
  integracaoId: string
  onClose: () => void
  onSuccess: () => void
}

interface FieldMapping {
  form_field: string
  crm_field: string
}

// AIDEV-NOTE: Campos CRM vêm exclusivamente da tabela campos_customizados (sistema + custom)

export function LeadAdsFormMappingModal({
  form,
  integracaoId: _integracaoId,
  onClose,
  onSuccess,
}: LeadAdsFormMappingModalProps) {
  const [selectedPageId, setSelectedPageId] = useState('')
  const [selectedFormId, setSelectedFormId] = useState(form?.form_id || '')
  const [selectedFormName, setSelectedFormName] = useState(form?.form_name || '')
  const [selectedPipelineId, setSelectedPipelineId] = useState(form?.pipeline_id || '')
  const [mappings, setMappings] = useState<FieldMapping[]>(form?.mapeamento_campos || [])

  const isEditing = !!form

  // Buscar páginas do Facebook conectadas
  const { data: paginasData, isLoading: loadingPaginas } = useQuery({
    queryKey: ['meta-ads', 'paginas'],
    queryFn: () => metaAdsApi.listarPaginas(),
    enabled: !isEditing,
  })

  // Buscar formulários da página selecionada
  const { data: formularios, isLoading: loadingForms } = useQuery({
    queryKey: ['meta-ads', 'formularios-pagina', selectedPageId],
    queryFn: () => metaAdsApi.listarFormulariosPagina(selectedPageId),
    enabled: !!selectedPageId && !isEditing,
  })

  // Buscar funis para selecionar pipeline
  const { data: funisData } = useQuery({
    queryKey: ['funis'],
    queryFn: async () => {
      const { data } = await supabase
        .from('funis')
        .select('id, nome, etapas_funil(id, nome, ordem)')
        .is('deletado_em', null)
        .order('ordem', { ascending: true })
      return data || []
    },
  })

  // Buscar campos customizados de todas as entidades
  const { data: camposCustomizados } = useQuery({
    queryKey: ['campos-customizados-todos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('campos_customizados')
        .select('id, nome, entidade, slug, sistema')
        .is('deletado_em', null)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      return data || []
    },
  })

  // AIDEV-NOTE: Lista unificada de campos CRM agrupados por entidade (fonte única: banco)
  const camposCrmAgrupados = useMemo(() => {
    const ENTIDADE_LABEL: Record<string, string> = {
      pessoa: 'Pessoa',
      empresa: 'Empresa',
      oportunidade: 'Oportunidade',
    }
    const grupos: Record<string, Array<{ value: string; label: string }>> = {}
    for (const c of camposCustomizados || []) {
      const grupoLabel = ENTIDADE_LABEL[c.entidade] || c.entidade
      if (!grupos[grupoLabel]) grupos[grupoLabel] = []
      grupos[grupoLabel].push({
        value: (c as any).sistema ? `${c.entidade}:${c.slug}` : `custom:${c.id}`,
        label: c.nome,
      })
    }
    return grupos
  }, [camposCustomizados])

  // Auto-preencher campos quando formulário é selecionado
  useEffect(() => {
    if (formularios?.formularios && selectedFormId && !isEditing) {
      const formSelecionado = formularios.formularios.find(
        (f: { id: string }) => f.id === selectedFormId
      )
      if (formSelecionado) {
        setSelectedFormName(formSelecionado.name || '')
        const fields = formSelecionado.fields || []
        setMappings(
          fields.map((f: { key: string }) => ({
            form_field: f.key,
            crm_field: autoMapField(f.key),
          }))
        )
      }
    }
  }, [selectedFormId, formularios, isEditing])

  const salvar = useMutation({
    mutationFn: () => {
      // AIDEV-NOTE: Sempre criar na etapa "Novos Negócios" (primeira etapa do funil)
      const funilSelecionado = funisData?.find((f: any) => f.id === selectedPipelineId)
      const etapas = (funilSelecionado as any)?.etapas_funil || []
      const etapaInicial = etapas.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))[0]

      const payload = {
        form_id: selectedFormId,
        form_name: selectedFormName,
        page_id: selectedPageId || form?.page_id,
        pipeline_id: selectedPipelineId,
        etapa_id: etapaInicial?.id || '',
        mapeamento_campos: mappings.filter((m) => m.crm_field),
      }
      if (isEditing && form) {
        return metaAdsApi.atualizarFormulario(form.id, payload)
      }
      return metaAdsApi.criarFormulario(payload)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Mapeamento atualizado' : 'Formulário mapeado com sucesso')
      onSuccess()
    },
    onError: () => toast.error('Erro ao salvar mapeamento'),
  })

  const updateMapping = (index: number, crmField: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, crm_field: crmField } : m))
    )
  }

  return (
    <ModalBase
      onClose={onClose}
      title={isEditing ? 'Editar Mapeamento' : 'Configurar Formulário Lead Ads'}
      description="Mapeie os campos do formulário para o CRM"
      icon={FileText}
      variant="create"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => salvar.mutate()}
            disabled={salvar.isPending || !selectedFormId || !selectedPipelineId}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {salvar.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Salvar Alterações'
            ) : (
              'Salvar Configuração'
            )}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Destino do Lead (primeiro a escolher) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Destino do Lead</h4>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Pipeline</label>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione</option>
              {(funisData || []).map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Leads serão criados automaticamente na etapa "Novos Negócios"
            </p>
          </div>
        </div>

        {/* Seleção de Página e Formulário (apenas ao criar) */}
        {!isEditing && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Página do Facebook</label>
              {loadingPaginas ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Carregando páginas...</span>
                </div>
              ) : (
                <select
                  value={selectedPageId}
                  onChange={(e) => {
                    setSelectedPageId(e.target.value)
                    setSelectedFormId('')
                    setMappings([])
                  }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione uma página</option>
                  {(paginasData?.paginas || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPageId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Formulário Lead Ads</label>
                {loadingForms ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Carregando formulários...</span>
                  </div>
                ) : (
                  <select
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione um formulário</option>
                    {(formularios?.formularios || []).map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mapeamento de Campos */}
        {mappings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Mapeamento de Campos</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 bg-muted text-xs font-medium text-muted-foreground">
                <span>Campo do Formulário</span>
                <span />
                <span>Campo do CRM</span>
              </div>
              {mappings.map((m, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2 border-t border-border"
                >
                  <span className="text-sm text-foreground truncate">{m.form_field}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={m.crm_field}
                    onChange={(e) => updateMapping(i, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Ignorar —</option>
                    {Object.entries(camposCrmAgrupados).map(([grupo, campos]) => (
                      <optgroup key={grupo} label={grupo}>
                        {campos.map((cf) => (
                          <option key={cf.value} value={cf.value}>
                            {cf.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  )
}

/** Auto-mapeia campos comuns do Lead Ads para campos do CRM (usando formato entidade:campo) */
function autoMapField(fieldKey: string): string {
  const map: Record<string, string> = {
    full_name: 'pessoa:nome',
    first_name: 'pessoa:nome',
    last_name: 'pessoa:sobrenome',
    email: 'pessoa:email',
    phone_number: 'pessoa:telefone',
    phone: 'pessoa:telefone',
    company_name: 'empresa:razao_social',
    company: 'empresa:razao_social',
    job_title: 'pessoa:cargo',
    city: 'endereco:endereco_cidade',
    state: 'endereco:endereco_estado',
  }
  return map[fieldKey.toLowerCase()] || ''
}
