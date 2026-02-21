/**
 * AIDEV-NOTE: Página de Metas e Objetivos (Admin Only)
 * Conforme PRD-05 - Seção 3.3.3 Metas Hierárquicas
 * Visão de empresa, equipe e individual com barras de progresso e ranking
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Target, Building2, Users, User, Trash2, Pencil, Zap } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useMetas, useMetasEmpresa, useCriarMeta, useAtualizarMeta, useExcluirMeta, useDistribuirMeta, useRanking } from '../hooks/useMetas'
import { useEquipes, useUsuarios } from '../hooks/useEquipe'
import { MetaFormModal } from '../components/metas/MetaFormModal'
import { MetaProgressBar } from '../components/metas/MetaProgressBar'
import { RankingList } from '../components/metas/RankingList'
import { getMetricaLabel } from '../schemas/metas.schema'
import type { MetaComProgresso } from '../services/configuracoes.api'

type TabMeta = 'empresa' | 'equipe' | 'individual'

const TABS: Array<{ key: TabMeta; label: string; icon: React.ElementType }> = [
  { key: 'empresa', label: 'Empresa', icon: Building2 },
  { key: 'equipe', label: 'Equipes', icon: Users },
  { key: 'individual', label: 'Individual', icon: User },
]

export function MetasPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [tabAtiva, setTabAtiva] = useState<TabMeta>('empresa')
  const [modalOpen, setModalOpen] = useState(false)
  const [metaEditando, setMetaEditando] = useState<MetaComProgresso | null>(null)

  const { data: metasData, isLoading: loadingMetas } = useMetas(
    tabAtiva !== 'empresa' ? { tipo: tabAtiva } : undefined
  )
  const { data: empresaData, isLoading: loadingEmpresa } = useMetasEmpresa()
  const { data: rankingData, isLoading: loadingRanking } = useRanking()
  const { data: equipesData } = useEquipes()
  const { data: usuariosData } = useUsuarios()

  const criarMeta = useCriarMeta()
  const atualizarMeta = useAtualizarMeta()
  const excluirMeta = useExcluirMeta()
  const distribuirMeta = useDistribuirMeta()

  const equipes = equipesData?.equipes || []
  const usuarios = usuariosData?.usuarios || []
  const ranking = rankingData?.ranking || []

  useEffect(() => {
    setSubtitle('Defina metas para empresa, equipes e membros individuais com acompanhamento em tempo real')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setMetaEditando(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      ) : null
    )
    return () => { setSubtitle(null); setActions(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (metaEditando) {
        await atualizarMeta.mutateAsync({ id: metaEditando.id, payload: values })
      } else {
        await criarMeta.mutateAsync(values)
      }
      setModalOpen(false)
      setMetaEditando(null)
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta? Metas filhas também serão excluídas.')) return
    try {
      await excluirMeta.mutateAsync(id)
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  const handleDistribuir = async (id: string, nivel: 'equipe' | 'individual') => {
    if (!confirm(`Distribuir meta igualmente para ${nivel === 'equipe' ? 'equipes' : 'membros'}?`)) return
    try {
      await distribuirMeta.mutateAsync({
        id,
        payload: { tipo_distribuicao: 'igual', nivel_destino: nivel },
      })
    } catch (err) {
      console.error('Erro ao distribuir:', err)
    }
  }

  const isLoading = tabAtiva === 'empresa' ? loadingEmpresa : loadingMetas
  const metas: MetaComProgresso[] = tabAtiva === 'empresa'
    ? (empresaData?.metas || [])
    : (metasData?.metas || [])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setTabAtiva(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                tabAtiva === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Resumo da Empresa */}
      {tabAtiva === 'empresa' && empresaData?.resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de Metas', value: empresaData.resumo.total_metas },
            { label: 'Metas Atingidas', value: empresaData.resumo.metas_atingidas },
            { label: 'Média Atingimento', value: `${Math.round(empresaData.resumo.media_atingimento)}%` },
            { label: 'Em Risco', value: empresaData.resumo.metas_em_risco },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Metas */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : metas.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma meta configurada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie metas para acompanhar o desempenho da equipe
              </p>
              {isAdmin && (
                <button
                  onClick={() => { setMetaEditando(null); setModalOpen(true) }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeira Meta
                </button>
              )}
            </div>
          ) : (
            metas.map(meta => (
              <MetaCard
                key={meta.id}
                meta={meta}
                isAdmin={isAdmin}
                onEdit={() => { setMetaEditando(meta); setModalOpen(true) }}
                onDelete={() => handleExcluir(meta.id)}
                onDistribuir={(nivel) => handleDistribuir(meta.id, nivel)}
              />
            ))
          )}
        </div>

        {/* Ranking */}
        <div>
          <RankingList ranking={ranking} loading={loadingRanking} />
        </div>
      </div>

      {/* Modal */}
      <MetaFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setMetaEditando(null) }}
        onSubmit={handleSubmit}
        meta={metaEditando}
        equipes={equipes}
        usuarios={usuarios}
        loading={criarMeta.isPending || atualizarMeta.isPending}
        defaultTipo={tabAtiva}
      />
    </div>
  )
}

// =====================================================
// Card de Meta individual
// =====================================================

function MetaCard({
  meta,
  isAdmin,
  onEdit,
  onDelete,
  onDistribuir,
}: {
  meta: MetaComProgresso
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
  onDistribuir: (nivel: 'equipe' | 'individual') => void
}) {
  const tipoIcons: Record<string, React.ElementType> = {
    empresa: Building2,
    equipe: Users,
    individual: User,
  }
  const Icon = tipoIcons[meta.tipo] || Target

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {meta.nome || getMetricaLabel(meta.metrica)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {meta.tipo === 'empresa' ? 'Meta Global' :
               meta.tipo === 'equipe' ? `Equipe: ${meta.equipe_nome || '—'}` :
               `Membro: ${meta.usuario_nome || '—'}`}
              {' · '}{meta.periodo}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {(meta.tipo === 'empresa' || meta.tipo === 'equipe') && (
              <button
                onClick={() => onDistribuir(meta.tipo === 'empresa' ? 'equipe' : 'individual')}
                title="Distribuir meta"
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <MetaProgressBar meta={meta} />

      {!meta.ativa && (
        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          Inativa
        </span>
      )}
    </div>
  )
}

export default MetasPage
