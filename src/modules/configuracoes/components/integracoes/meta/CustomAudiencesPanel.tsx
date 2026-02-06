/**
 * AIDEV-NOTE: Painel Custom Audiences (Públicos Personalizados)
 * Conforme PRD-08 Seção 4 - Gerenciamento de públicos Meta
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { metaAdsApi } from '../../../services/configuracoes.api'
import type { CustomAudience } from '../../../services/configuracoes.api'

const EVENTOS_GATILHO = [
  { value: 'lead', label: 'Novo contato criado' },
  { value: 'mql', label: 'Contato recebe badge MQL' },
  { value: 'schedule', label: 'Reunião agendada' },
  { value: 'won', label: 'Oportunidade ganha' },
  { value: 'lost', label: 'Oportunidade perdida' },
]

export function CustomAudiencesPanel() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    audience_name: '',
    ad_account_id: '',
    evento_gatilho: '',
    tipo_sincronizacao: 'evento',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['meta-ads', 'audiences'],
    queryFn: () => metaAdsApi.listarAudiences(),
  })

  const criar = useMutation({
    mutationFn: () => metaAdsApi.criarAudience(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      toast.success('Público criado com sucesso')
      setShowForm(false)
      setFormData({ audience_name: '', ad_account_id: '', evento_gatilho: '', tipo_sincronizacao: 'evento' })
    },
    onError: () => toast.error('Erro ao criar público'),
  })

  const sincronizar = useMutation({
    mutationFn: (id: string) => metaAdsApi.sincronizarAudience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      toast.success('Sincronização iniciada')
    },
    onError: () => toast.error('Erro ao sincronizar público'),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      metaAdsApi.atualizarAudience(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const audiences = data?.audiences || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Públicos Personalizados</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sincronize contatos do CRM para segmentação no Meta Ads
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Criar Público
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
          <h4 className="text-sm font-semibold text-foreground">Novo Público</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome do Público</label>
              <input
                type="text"
                value={formData.audience_name}
                onChange={(e) => setFormData((p) => ({ ...p, audience_name: e.target.value }))}
                placeholder="Ex: CRM - Leads Novos"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Conta de Anúncios</label>
              <input
                type="text"
                value={formData.ad_account_id}
                onChange={(e) => setFormData((p) => ({ ...p, ad_account_id: e.target.value }))}
                placeholder="act_123456789"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Sincronizar quando</label>
            <select
              value={formData.evento_gatilho}
              onChange={(e) => setFormData((p) => ({ ...p, evento_gatilho: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione o evento</option>
              {EVENTOS_GATILHO.map((ev) => (
                <option key={ev.value} value={ev.value}>
                  {ev.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => criar.mutate()}
              disabled={criar.isPending || !formData.audience_name || !formData.ad_account_id}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {criar.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar Público'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Audiences */}
      {audiences.length === 0 && !showForm ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhum público criado</p>
          <p className="text-xs text-muted-foreground">
            Crie públicos personalizados para sincronizar contatos com o Meta Ads
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audiences.map((aud: CustomAudience) => (
            <div
              key={aud.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{aud.audience_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Audience ID: {aud.audience_id || '—'} • Conta: {aud.ad_account_id}
                    </p>
                    {aud.evento_gatilho && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gatilho: {EVENTOS_GATILHO.find((e) => e.value === aud.evento_gatilho)?.label || aud.evento_gatilho}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-muted-foreground">
                        Usuários: <span className="font-medium text-foreground">{aud.total_usuarios || 0}</span>
                      </p>
                      {aud.ultimo_sync && (
                        <p className="text-xs text-muted-foreground">
                          Último sync: {new Date(aud.ultimo_sync).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {aud.ativo ? (
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
                  onClick={() => sincronizar.mutate(aud.id)}
                  disabled={sincronizar.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {sincronizar.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Sincronizar Agora
                </button>
                <button
                  onClick={() => toggleAtivo.mutate({ id: aud.id, ativo: !aud.ativo })}
                  className="text-xs font-medium px-2.5 py-1 rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  {aud.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
