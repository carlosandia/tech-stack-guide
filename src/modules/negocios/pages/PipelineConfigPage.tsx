/**
 * AIDEV-NOTE: Página de Configuração de Pipeline
 * Conforme PRD-07 RF-03 - Layout com sidebar + 6 abas
 * Rota: /app/negocios/pipeline/:id
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, LayoutGrid, RefreshCw, Zap, ShieldCheck, CircleDot, Loader2 } from 'lucide-react'
import { useFunilComEtapas } from '../hooks/useFunis'
import { ConfigEtapas } from '../components/config/ConfigEtapas'
import { ConfigCampos } from '../components/config/ConfigCampos'
import { ConfigDistribuicao } from '../components/config/ConfigDistribuicao'
import { ConfigAtividades } from '../components/config/ConfigAtividades'
import { ConfigQualificacao } from '../components/config/ConfigQualificacao'
import { ConfigMotivos } from '../components/config/ConfigMotivos'
import { GerenciarMembrosPipeline } from '../components/config/GerenciarMembrosPipeline'

type TabId = 'etapas' | 'campos' | 'distribuicao' | 'atividades' | 'qualificacao' | 'motivos'

interface NavItem {
  id: TabId
  label: string
  icon: typeof Layers
  group: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'etapas', label: 'Etapas', icon: Layers, group: 'CONFIGURAÇÃO' },
  { id: 'campos', label: 'Campos', icon: LayoutGrid, group: 'CONFIGURAÇÃO' },
  { id: 'distribuicao', label: 'Distribuição', icon: RefreshCw, group: 'AUTOMAÇÃO' },
  { id: 'atividades', label: 'Atividades', icon: Zap, group: 'AUTOMAÇÃO' },
  { id: 'qualificacao', label: 'Qualificação', icon: ShieldCheck, group: 'QUALIFICAÇÃO' },
  { id: 'motivos', label: 'Motivos', icon: CircleDot, group: 'QUALIFICAÇÃO' },
]

const GROUPS = ['CONFIGURAÇÃO', 'AUTOMAÇÃO', 'QUALIFICAÇÃO']

export default function PipelineConfigPage() {
  const { id: funilId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('etapas')

  const { data: funil, isLoading } = useFunilComEtapas(funilId || null)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!funil || !funilId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Pipeline não encontrada</p>
          <button
            onClick={() => navigate('/negocios')}
            className="text-sm text-primary hover:underline"
          >
            Voltar para Negócios
          </button>
        </div>
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'etapas':
        return <ConfigEtapas funilId={funilId} />
      case 'campos':
        return <ConfigCampos funilId={funilId} />
      case 'distribuicao':
        return <ConfigDistribuicao funilId={funilId} />
      case 'atividades':
        return <ConfigAtividades funilId={funilId} />
      case 'qualificacao':
        return <ConfigQualificacao funilId={funilId} />
      case 'motivos':
        return <ConfigMotivos funilId={funilId} exigirMotivo={funil.exigir_motivo_resultado ?? true} />
      default:
        return null
    }
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/negocios')}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: funil.cor || '#3B82F6' }}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">
            Configurar: {funil.nome}
          </h1>
          <p className="text-xs text-muted-foreground">
            {funil.etapas?.length || 0} etapas configuradas
          </p>
        </div>

        <GerenciarMembrosPipeline funilId={funilId} />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-56 border-r border-border bg-card flex-shrink-0 overflow-y-auto hidden md:block">
          <div className="py-3">
            {GROUPS.map(group => {
              const items = NAV_ITEMS.filter(i => i.group === group)
              return (
                <div key={group} className="mb-2">
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </span>
                  </div>
                  {items.map(item => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`
                          w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all duration-200
                          ${isActive
                            ? 'text-primary bg-primary/5 border-r-2 border-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Mobile tabs */}
        <div className="md:hidden border-b border-border bg-card flex-shrink-0 overflow-x-auto">
          <div className="flex">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-all duration-200
                    ${isActive
                      ? 'text-primary border-primary font-medium'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
          <div className="flex-1 min-h-0">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  )
}
