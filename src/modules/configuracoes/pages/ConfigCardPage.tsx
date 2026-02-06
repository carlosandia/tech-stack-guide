/**
 * AIDEV-NOTE: Página de Personalização de Cards Kanban
 * Conforme PRD-05 - Personalização de Cards
 * Layout: Campos selecionados (esquerda) + Preview (direita) + Ações Rápidas (baixo)
 */

import { useState, useEffect } from 'react'
import {
  Loader2,
  Save,
  LayoutGrid,
  DollarSign,
  User,
  Building2,
  Phone,
  Mail,
  UserCircle,
  CalendarDays,
  CheckSquare,
  Tag,
  Plus,
  Trash2,
  GripVertical,
  MessageCircle,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useConfigCard, useAtualizarConfigCard } from '../hooks/useRegras'
import { useCampos } from '../hooks/useCampos'
import { KanbanCardPreview } from '../components/cards/KanbanCardPreview'

// =====================================================
// Campos padrão disponíveis
// =====================================================

const CAMPOS_PADRAO = [
  { key: 'valor', label: 'Valor Estimado', descricao: 'Valor estimado da oportunidade', icon: DollarSign, cor: 'text-success-foreground bg-success-muted' },
  { key: 'contato', label: 'Contato', descricao: 'Nome do contato principal', icon: User, cor: 'text-primary bg-primary/10' },
  { key: 'empresa', label: 'Empresa', descricao: 'Empresa vinculada', icon: Building2, cor: 'text-primary bg-primary/10' },
  { key: 'telefone', label: 'Telefone', descricao: 'Número de telefone do contato', icon: Phone, cor: 'text-primary bg-primary/10' },
  { key: 'email', label: 'Email', descricao: 'Email do contato', icon: Mail, cor: 'text-primary bg-primary/10' },
  { key: 'owner', label: 'Responsável', descricao: 'Responsável pela oportunidade', icon: UserCircle, cor: 'text-primary bg-primary/10' },
  { key: 'data_criacao', label: 'Data de Criação', descricao: 'Quando a oportunidade foi criada', icon: CalendarDays, cor: 'text-muted-foreground bg-muted' },
  { key: 'previsao_fechamento', label: 'Previsão de Fechamento', descricao: 'Data prevista para fechar', icon: CalendarDays, cor: 'text-warning-foreground bg-warning-muted' },
  { key: 'tarefas_pendentes', label: 'Tarefas Pendentes', descricao: 'Badge com número de tarefas', icon: CheckSquare, cor: 'text-warning-foreground bg-warning-muted' },
  { key: 'tags', label: 'Tags/Segmentações', descricao: 'Tags e segmentações do lead', icon: Tag, cor: 'text-primary bg-primary/10' },
]

const CAMPOS_DEFAULT_VISIVEIS = ['valor', 'contato', 'empresa', 'owner', 'previsao_fechamento', 'tarefas_pendentes', 'tags']

// =====================================================
// Ações rápidas disponíveis
// =====================================================

const ACOES_DISPONIVEIS = [
  { key: 'telefone', label: 'Telefone', descricao: 'Botão click-to-call para ligar', icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', descricao: 'Abrir conversa no WhatsApp', icon: MessageCircle },
  { key: 'email', label: 'Email', descricao: 'Abrir composição de email', icon: Mail },
  { key: 'agendar', label: 'Agendar', descricao: 'Agendar uma atividade', icon: Calendar },
]

const ACOES_DEFAULT = ['telefone', 'whatsapp', 'email', 'agendar']

const MAX_CAMPOS = 6
const MIN_CAMPOS = 1

export function ConfigCardPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const { data: configCard, isLoading: loadingConfig } = useConfigCard()
  const { data: camposData } = useCampos('oportunidade')
  const atualizarConfig = useAtualizarConfigCard()

  const [camposVisiveis, setCamposVisiveis] = useState<string[]>(CAMPOS_DEFAULT_VISIVEIS)
  const [camposCustomVisiveis, setCamposCustomVisiveis] = useState<string[]>([])
  const [acoesRapidas, setAcoesRapidas] = useState<string[]>(ACOES_DEFAULT)
  const [temAlteracoes, setTemAlteracoes] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Inicializar com dados do servidor
  useEffect(() => {
    if (configCard) {
      const cv = Array.isArray(configCard.campos_visiveis) ? configCard.campos_visiveis : CAMPOS_DEFAULT_VISIVEIS
      const ccv = Array.isArray(configCard.campos_customizados_visiveis) ? configCard.campos_customizados_visiveis : []
      const ar = Array.isArray((configCard as any).acoes_rapidas) ? (configCard as any).acoes_rapidas : ACOES_DEFAULT
      setCamposVisiveis(cv)
      setCamposCustomVisiveis(ccv)
      setAcoesRapidas(ar)
    }
  }, [configCard])

  useEffect(() => {
    setSubtitle('Configure quais informações aparecem nos cards do Kanban')
    setActions(null)
    return () => { setActions(null); setSubtitle(null) }
  }, [setActions, setSubtitle])

  const totalCampos = camposVisiveis.length + camposCustomVisiveis.length

  const removerCampoPadrao = (key: string) => {
    if (!isAdmin || totalCampos <= MIN_CAMPOS) return
    setCamposVisiveis(prev => prev.filter(k => k !== key))
    setTemAlteracoes(true)
  }

  const adicionarCampoPadrao = (key: string) => {
    if (!isAdmin || totalCampos >= MAX_CAMPOS) return
    if (camposVisiveis.includes(key)) return
    setCamposVisiveis(prev => [...prev, key])
    setTemAlteracoes(true)
    setShowAddMenu(false)
  }

  const toggleAcaoRapida = (key: string) => {
    if (!isAdmin) return
    setAcoesRapidas(prev => {
      const novo = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
      setTemAlteracoes(true)
      return novo
    })
  }

  const handleSalvar = async () => {
    try {
      await atualizarConfig.mutateAsync({
        campos_visiveis: camposVisiveis,
        campos_customizados_visiveis: camposCustomVisiveis,
        acoes_rapidas: acoesRapidas,
      })
      setTemAlteracoes(false)
    } catch { /* tratado pelo React Query */ }
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const camposCustomizados = (camposData as any)?.campos?.filter((c: any) => !c.sistema) || (Array.isArray(camposData) ? camposData.filter((c: any) => !c.sistema) : [])
  const camposNaoSelecionados = CAMPOS_PADRAO.filter(c => !camposVisiveis.includes(c.key))

  return (
    <div className="space-y-8">
      {/* Layout principal: Campos + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Coluna esquerda: Campos selecionados */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header da seção */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Campos Visíveis no Card
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({totalCampos}/{MAX_CAMPOS})
              </span>
            </h3>

            {/* Botão Adicionar */}
            {isAdmin && camposNaoSelecionados.length > 0 && totalCampos < MAX_CAMPOS && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>

                {/* Dropdown de campos disponíveis */}
                {showAddMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAddMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                      {camposNaoSelecionados.map(campo => {
                        const Icon = campo.icon
                        return (
                          <button
                            key={campo.key}
                            onClick={() => adicionarCampoPadrao(campo.key)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${campo.cor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground block">{campo.label}</span>
                              <span className="text-xs text-muted-foreground">{campo.descricao}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Lista de campos selecionados */}
          <div className="space-y-2">
            {camposVisiveis.map((key) => {
              const campo = CAMPOS_PADRAO.find(c => c.key === key)
              if (!campo) return null
              const Icon = campo.icon
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-card hover:border-border transition-all duration-200 group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 cursor-grab" />
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${campo.cor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground block">{campo.label}</span>
                    <span className="text-xs text-muted-foreground">{campo.descricao}</span>
                  </div>
                  {isAdmin && totalCampos > MIN_CAMPOS && (
                    <button
                      onClick={() => removerCampoPadrao(key)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Remover campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Arraste para reordenar. Mínimo {MIN_CAMPOS} campo, máximo {MAX_CAMPOS}.
          </p>

          {/* Campos customizados */}
          {camposCustomizados.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Campos Customizados</h3>
              <div className="space-y-2">
                {camposCustomizados.map((campo: any) => (
                  <label
                    key={campo.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                      isAdmin ? 'cursor-pointer hover:bg-accent/30' : 'cursor-default'
                    } ${
                      camposCustomVisiveis.includes(campo.id)
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={camposCustomVisiveis.includes(campo.id)}
                      onChange={() => {
                        if (!isAdmin) return
                        setCamposCustomVisiveis(prev => {
                          const novo = prev.includes(campo.id)
                            ? prev.filter(k => k !== campo.id)
                            : [...prev, campo.id]
                          setTemAlteracoes(true)
                          return novo
                        })
                      }}
                      disabled={!isAdmin}
                      className="rounded border-input text-primary focus:ring-ring disabled:opacity-50"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{campo.nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">({campo.tipo})</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {camposCustomizados.length === 0 && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
              <LayoutGrid className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Nenhum campo customizado para oportunidades. Crie campos em &quot;Campos Personalizados&quot; para vê-los aqui.
              </p>
            </div>
          )}
        </div>

        {/* Coluna direita: Preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <KanbanCardPreview
              camposVisiveis={camposVisiveis}
              acoesRapidas={acoesRapidas}
            />
          </div>
        </div>
      </div>

      {/* Seção: Ações Rápidas no Footer */}
      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Ações Rápidas no Footer</h3>
        <div className="space-y-1">
          {ACOES_DISPONIVEIS.map(acao => {
            const Icon = acao.icon
            const ativa = acoesRapidas.includes(acao.key)
            return (
              <div
                key={acao.key}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{acao.label}</span>
                    <span className="text-xs text-muted-foreground">{acao.descricao}</span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => toggleAcaoRapida(acao.key)}
                  disabled={!isAdmin}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 ${
                    ativa ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      ativa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botão salvar */}
      {isAdmin && temAlteracoes && (
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={handleSalvar}
            disabled={atualizarConfig.isPending}
            className="flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {atualizarConfig.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      )}
    </div>
  )
}
