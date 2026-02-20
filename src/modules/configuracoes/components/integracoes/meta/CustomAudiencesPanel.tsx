/**
 * AIDEV-NOTE: Painel Custom Audiences (Públicos Personalizados)
 * Conforme PRD-08 Seção 4 - Gerenciamento de públicos Meta
 * Suporta criação de novos públicos, importação de existentes do Meta Ads
 * e vinculação de evento gatilho para sincronização automática via CAPI
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Loader2, RefreshCw, CheckCircle2, Download, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { metaAdsApi } from '../../../services/configuracoes.api'
import type { CustomAudience } from '../../../services/configuracoes.api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const EVENTOS_GATILHO = [
  { value: 'lead', label: 'Novo contato criado' },
  { value: 'mql', label: 'Contato recebe badge MQL' },
  { value: 'schedule', label: 'Reunião agendada' },
  { value: 'won', label: 'Oportunidade ganha' },
  { value: 'lost', label: 'Oportunidade perdida' },
]

interface MetaAudience {
  id: string
  name: string
  approximate_count: number
}

export function CustomAudiencesPanel() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importAccountId, setImportAccountId] = useState('')
  const [metaAudiences, setMetaAudiences] = useState<MetaAudience[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<CustomAudience | null>(null)
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
    onError: (err: Error) => toast.error(err.message || 'Erro ao criar público'),
  })

  const sincronizar = useMutation({
    mutationFn: (id: string) => metaAdsApi.sincronizarAudience(id),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      const count = result?.num_received || 0
      toast.success(`Sincronização concluída: ${count} contato(s) enviado(s)`)
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao sincronizar público'),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      metaAdsApi.atualizarAudience(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  // AIDEV-NOTE: Remover audience do Meta e do banco
  const remover = useMutation({
    mutationFn: (id: string) => metaAdsApi.removerAudience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      toast.success('Público removido com sucesso')
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao remover público'),
  })

  // AIDEV-NOTE: Vincular evento gatilho inline
  const vincularEvento = useMutation({
    mutationFn: ({ id, evento_gatilho }: { id: string; evento_gatilho: string | null }) =>
      metaAdsApi.vincularEventoAudience(id, evento_gatilho),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      toast.success('Evento gatilho atualizado')
    },
    onError: () => toast.error('Erro ao vincular evento'),
  })

  // Buscar audiences do Meta
  const buscarMeta = useMutation({
    mutationFn: (adAccountId: string) => metaAdsApi.buscarAudiencesMeta(adAccountId),
    onSuccess: (result) => {
      const existingIds = new Set((data?.audiences || []).map((a) => a.audience_id))
      const filtered = result.audiences.filter((a) => !existingIds.has(a.id))
      setMetaAudiences(filtered)
      setSelectedIds(new Set())
      if (filtered.length === 0 && result.audiences.length > 0) {
        toast.info('Todos os públicos desta conta já foram importados')
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao buscar públicos do Meta'),
  })

  // Importar selecionados
  const importar = useMutation({
    mutationFn: () => {
      const selecionados = metaAudiences
        .filter((a) => selectedIds.has(a.id))
        .map((a) => ({ ...a, ad_account_id: importAccountId }))
      return metaAdsApi.importarAudiences(selecionados)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'audiences'] })
      toast.success(`${selectedIds.size} público(s) importado(s) com sucesso`)
      setShowImport(false)
      setMetaAudiences([])
      setSelectedIds(new Set())
      setImportAccountId('')
    },
    onError: () => toast.error('Erro ao importar públicos'),
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImport(!showImport); setShowForm(false) }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Importar do Meta
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowImport(false) }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Público
          </button>
        </div>
      </div>

      {/* Painel de importação do Meta */}
      {showImport && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
          <h4 className="text-sm font-semibold text-foreground">Importar Públicos do Meta Ads</h4>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Conta de Anúncios</label>
              <input
                type="text"
                value={importAccountId}
                onChange={(e) => setImportAccountId(e.target.value)}
                placeholder="act_123456789"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => buscarMeta.mutate(importAccountId)}
              disabled={buscarMeta.isPending || !importAccountId}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {buscarMeta.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Buscar
            </button>
          </div>

          {metaAudiences.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{metaAudiences.length} público(s) disponível(eis) para importar</p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-border rounded-md p-2">
                {metaAudiences.map((aud) => (
                  <label
                    key={aud.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(aud.id)}
                      onChange={() => toggleSelect(aud.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{aud.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {aud.id} • ~{formatCount(aud.approximate_count)} usuários
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => importar.mutate()}
                  disabled={importar.isPending || selectedIds.size === 0}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {importar.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Selecionados
                </button>
                <button
                  onClick={() => { setShowImport(false); setMetaAudiences([]); setSelectedIds(new Set()) }}
                  className="text-xs font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {buscarMeta.isSuccess && metaAudiences.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum público novo encontrado nesta conta.
            </p>
          )}
        </div>
      )}

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
      {audiences.length === 0 && !showForm && !showImport ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhum público criado</p>
          <p className="text-xs text-muted-foreground">
            Crie públicos personalizados ou importe existentes do Meta Ads
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
                    {/* AIDEV-NOTE: Select inline para evento gatilho */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Gatilho:</span>
                      <select
                        value={aud.evento_gatilho || ''}
                        onChange={(e) => {
                          const val = e.target.value || null
                          vincularEvento.mutate({ id: aud.id, evento_gatilho: val })
                        }}
                        className="text-xs px-2 py-1 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Nenhum (manual)</option>
                        {EVENTOS_GATILHO.map((ev) => (
                          <option key={ev.value} value={ev.value}>
                            {ev.label}
                          </option>
                        ))}
                      </select>
                    </div>
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

              {/* AIDEV-NOTE: Aviso sobre sync manual enviando todos os contatos */}
              <p className="text-xs text-muted-foreground mt-2 italic">
                ⚠ A sincronização manual envia todos os contatos do CRM. A filtragem por evento funciona apenas na sincronização automática.
              </p>
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border">
                <button
                  onClick={() => sincronizar.mutate(aud.id)}
                  disabled={sincronizar.isPending || aud.audience_id?.startsWith('pending_')}
                  title={aud.audience_id?.startsWith('pending_') ? 'Este público precisa ser criado ou importado do Meta antes de sincronizar' : 'Sincronizar todos os contatos do CRM com este público'}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button
                  onClick={() => setDeleteTarget(aud)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AIDEV-NOTE: Dialog de confirmação de remoção */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Público Personalizado</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o público <strong>{deleteTarget?.audience_name}</strong> tanto do CRM quanto do Meta Ads. Essa ação não pode ser desfeita. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remover.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && remover.mutate(deleteTarget.id)}
              disabled={remover.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remover.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
