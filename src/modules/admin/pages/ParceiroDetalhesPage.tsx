import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  List,
  DollarSign,
  Settings,
  Pause,
  Play,
  Loader2,
  Trophy,
  Plus,
  Copy,
  Check,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useParceiro,
  useIndicacoesParceiro,
  useComissoesParceiro,
  useStatusMetaParceiro,
  useUpdateParceiro,
  useAplicarGratuidade,
  useMarcarComissaoPaga,
} from '../hooks/useParceiros'
import { AtualizarParceiroSchema, type AtualizarParceiroData } from '../schemas/parceiro.schema'
import { formatCurrency } from '@/lib/formatters'
import { ComissaoMesModal } from '../components/ComissaoMesModal'

/**
 * AIDEV-NOTE: ParceiroDetalhesPage — detalhe do parceiro com 3 tabs + card de meta
 * Segue padrao de OrganizacaoDetalhesPage (border-b-2 + TABS as const + useState<TabId>)
 */

const parceirStatusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-amber-100 text-amber-700',
  inativo: 'bg-muted text-muted-foreground',
}

const parceirStatusLabels: Record<string, string> = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  inativo: 'Inativo',
}

const comissaoStatusColors: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  pago: 'bg-green-100 text-green-700',
  cancelado: 'bg-muted text-muted-foreground',
}

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

type TabId = 'indicados' | 'comissoes' | 'configuracao'

const TABS = [
  { id: 'indicados' as const, label: 'Indicados', icon: List },
  { id: 'comissoes' as const, label: 'Comissões', icon: DollarSign },
  { id: 'configuracao' as const, label: 'Configuração', icon: Settings },
]

function ParceiroDetalhesPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('indicados')
  const [comissaoModalOpen, setComissaoModalOpen] = useState(false)
  const [copiadoUrl, setCopiadoUrl] = useState(false)
  const [copiadoCodigo, setCopiadoCodigo] = useState(false)
  const [confirmarGratuidade, setConfirmarGratuidade] = useState(false)
  const [gratuidadeValidade, setGratuidadeValidade] = useState('')

  const { data: parceiro, isLoading, error } = useParceiro(id)
  const { data: indicacoes } = useIndicacoesParceiro(id)
  const { data: comissoesPagina } = useComissoesParceiro(id)
  const statusMeta = useStatusMetaParceiro(id)
  const updateParceiro = useUpdateParceiro()
  const aplicarGratuidade = useAplicarGratuidade()
  const marcarPaga = useMarcarComissaoPaga()

  const configForm = useForm<AtualizarParceiroData>({
    resolver: zodResolver(AtualizarParceiroSchema),
    values: {
      percentual_comissao: parceiro?.percentual_comissao ?? undefined,
    },
  })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  const handleSuspender = () => {
    const motivo = prompt('Informe o motivo da suspensão:')
    if (motivo) {
      updateParceiro.mutate({ id, data: { status: 'suspenso', motivo_suspensao: motivo } })
    }
  }

  const handleReativar = () => {
    updateParceiro.mutate({ id, data: { status: 'ativo' } })
  }

  const handleSalvarConfig = configForm.handleSubmit((data) => {
    updateParceiro.mutate({ id, data })
  })

  const handleAplicarGratuidade = () => {
    aplicarGratuidade.mutate({
      parceiro_id: id,
      gratuidade_valida_ate: gratuidadeValidade
        ? new Date(gratuidadeValidade).toISOString()
        : null,
    })
    setConfirmarGratuidade(false)
    setGratuidadeValidade('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-4" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !parceiro) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar parceiro</p>
      </div>
    )
  }

  const orgNome = parceiro.organizacao?.nome ?? '—'
  const totalPendente =
    (comissoesPagina?.comissoes ?? [])
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.valor_comissao), 0)

  return (
    <div className="space-y-6">
      {/* Modal Gerar Comissões */}
      <ComissaoMesModal
        isOpen={comissaoModalOpen}
        onClose={() => setComissaoModalOpen(false)}
        parceiroId={id}
        nomeEmpresa={orgNome}
      />

      {/* Modal Confirmar Gratuidade */}
      {confirmarGratuidade && createPortal(
        <>
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" onClick={() => setConfirmarGratuidade(false)} />
          <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto bg-card rounded-lg border border-border shadow-xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-foreground mb-2">Aplicar Gratuidade</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Defina a data de validade da gratuidade. Deixe em branco para validade indefinida.
              </p>
              <input
                type="date"
                value={gratuidadeValidade}
                onChange={(e) => setGratuidadeValidade(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm mb-4 bg-background"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setConfirmarGratuidade(false)
                    setGratuidadeValidade('')
                  }}
                  className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAplicarGratuidade}
                  disabled={aplicarGratuidade.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {aplicarGratuidade.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{orgNome}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parceirStatusColors[parceiro.status]}`}
                >
                  {parceirStatusLabels[parceiro.status]}
                </span>
              </div>
              {parceiro.usuario && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Admin: {parceiro.usuario.nome} • {parceiro.usuario.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {parceiro.status === 'ativo' && (
              <button
                onClick={handleSuspender}
                disabled={updateParceiro.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                Suspender
              </button>
            )}
            {parceiro.status === 'suspenso' && (
              <button
                onClick={handleReativar}
                disabled={updateParceiro.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Reativar
              </button>
            )}
          </div>
        </div>

        {/* Info row: código + link */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Código</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(parceiro.codigo_indicacao)
                setCopiadoCodigo(true)
                setTimeout(() => setCopiadoCodigo(false), 2000)
              }}
              className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted hover:bg-accent text-foreground text-xs font-mono rounded-md transition-colors group"
              title="Clique para copiar"
            >
              {parceiro.codigo_indicacao}
              {copiadoCodigo ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex-shrink-0">Link</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/parceiro/${parceiro.codigo_indicacao}`)
                setCopiadoUrl(true)
                setTimeout(() => setCopiadoUrl(false), 2000)
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent rounded-md transition-colors min-w-0 group"
              title="Clique para copiar"
            >
              <code className="text-xs text-muted-foreground group-hover:text-foreground truncate">
                {window.location.origin}/parceiro/{parceiro.codigo_indicacao}
              </code>
              {copiadoUrl ? (
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card de Meta de Gratuidade */}
      {statusMeta.programaAtivo && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Meta do Programa de Parceiros</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statusMeta.descricao}</p>
              </div>
            </div>
            {statusMeta.cumpriuMeta && (
              <button
                onClick={() => setConfirmarGratuidade(true)}
                disabled={aplicarGratuidade.isPending}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {aplicarGratuidade.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trophy className="w-4 h-4" />
                )}
                Aplicar Gratuidade
              </button>
            )}
          </div>

          {/* Barra de progresso HTML/Tailwind */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{statusMeta.indicadosAtuais} indicado(s) ativo(s)</span>
              <span>Meta: {statusMeta.indicadosNecessarios}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  statusMeta.cumpriuMeta ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${statusMeta.percentualProgresso}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'indicados' && (indicacoes?.length ?? 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                  {indicacoes?.length}
                </span>
              )}
              {tab.id === 'comissoes' && totalPendente > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {formatCurrency(totalPendente)}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Indicados */}
      {activeTab === 'indicados' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {!indicacoes?.length ? (
            <div className="p-8 text-center">
              <List className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma organização indicada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status da Org</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data da Indicação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">% Comissão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {indicacoes.map((ind) => (
                    <tr key={ind.id} className="hover:bg-accent/50">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {ind.organizacao?.nome ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {ind.organizacao?.plano ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground capitalize">
                          {ind.organizacao?.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(ind.criado_em)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {ind.percentual_comissao_snapshot}%
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            ind.status === 'ativa'
                              ? 'bg-green-100 text-green-700'
                              : ind.status === 'inativa'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ind.status === 'ativa' ? 'Ativa' : ind.status === 'inativa' ? 'Inativa' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Comissões */}
      {activeTab === 'comissoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Histórico de Comissões</h3>
            <button
              onClick={() => setComissaoModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Gerar Comissões
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {!comissoesPagina?.comissoes.length ? (
              <div className="p-8 text-center">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma comissão gerada ainda</p>
                <button
                  onClick={() => setComissaoModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Gerar primeira comissão
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Período</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Assinatura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {comissoesPagina.comissoes.map((com) => {
                        const orgNomeComissao =
                          (com.indicacao as unknown as { organizacao?: { nome: string } } | null)
                            ?.organizacao?.nome ?? '—'
                        return (
                          <tr key={com.id} className="hover:bg-accent/50">
                            <td className="px-6 py-4 text-sm text-foreground">
                              {MESES[com.periodo_mes - 1]}/{com.periodo_ano}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">{orgNomeComissao}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {formatCurrency(com.valor_assinatura)}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {com.percentual_aplicado}%
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                              {formatCurrency(com.valor_comissao)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${comissaoStatusColors[com.status]}`}
                              >
                                {com.status === 'pendente' ? 'Pendente' : com.status === 'pago' ? 'Pago' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {com.status === 'pendente' && (
                                <button
                                  onClick={() => marcarPaga.mutate(com.id)}
                                  disabled={marcarPaga.isPending}
                                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                                >
                                  Marcar como Pago
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total pendente */}
                {totalPendente > 0 && (
                  <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-end">
                    <span className="text-sm text-muted-foreground mr-2">Total pendente:</span>
                    <span className="text-sm font-semibold text-amber-700">
                      {formatCurrency(totalPendente)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Configuração */}
      {activeTab === 'configuracao' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <form onSubmit={handleSalvarConfig} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                % de Comissão Individual
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="Usar padrão do programa"
                {...configForm.register('percentual_comissao', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                className="w-full max-w-xs px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar o padrão configurado no programa.
              </p>
            </div>

            <button
              type="submit"
              disabled={updateParceiro.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {updateParceiro.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </form>

          {/* Informações readonly */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data de adesão</p>
                <p className="font-medium text-foreground mt-0.5">
                  {formatDate(parceiro.aderiu_em)}
                </p>
              </div>
              {parceiro.gratuidade_aplicada_em && (
                <div>
                  <p className="text-muted-foreground">Gratuidade aplicada em</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatDate(parceiro.gratuidade_aplicada_em)}
                  </p>
                </div>
              )}
              {parceiro.gratuidade_valida_ate && (
                <div>
                  <p className="text-muted-foreground">Gratuidade válida até</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatDate(parceiro.gratuidade_valida_ate)}
                  </p>
                </div>
              )}
              {parceiro.suspenso_em && (
                <div>
                  <p className="text-muted-foreground">Suspenso em</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatDate(parceiro.suspenso_em)}
                  </p>
                </div>
              )}
              {parceiro.motivo_suspensao && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Motivo da suspensão</p>
                  <p className="font-medium text-foreground mt-0.5">{parceiro.motivo_suspensao}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParceiroDetalhesPage
