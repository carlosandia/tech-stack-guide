/**
 * AIDEV-NOTE: Página de Personalização de Cards Kanban
 * Conforme PRD-05 - Personalização de Cards
 * Define quais campos aparecem no card da oportunidade
 */

import { useState, useEffect } from 'react'
import { Loader2, Save, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useConfigCard, useAtualizarConfigCard } from '../hooks/useRegras'
import { useCampos } from '../hooks/useCampos'

const CAMPOS_PADRAO = [
  { key: 'valor', label: 'Valor', descricao: 'Valor estimado da oportunidade' },
  { key: 'contato', label: 'Contato', descricao: 'Nome do contato principal' },
  { key: 'empresa', label: 'Empresa', descricao: 'Empresa vinculada' },
  { key: 'telefone', label: 'Telefone', descricao: 'Telefone do contato' },
  { key: 'email', label: 'Email', descricao: 'Email do contato' },
  { key: 'owner', label: 'Responsável', descricao: 'Responsável pela oportunidade' },
  { key: 'data_criacao', label: 'Data de Criação', descricao: 'Quando a oportunidade foi criada' },
  { key: 'previsao_fechamento', label: 'Previsão de Fechamento', descricao: 'Data prevista para fechar' },
  { key: 'tarefas_pendentes', label: 'Tarefas Pendentes', descricao: 'Badge com número de tarefas' },
  { key: 'tags', label: 'Tags', descricao: 'Tags da oportunidade' },
]

const CAMPOS_DEFAULT_VISIVEIS = ['valor', 'contato', 'empresa', 'owner', 'previsao_fechamento', 'tarefas_pendentes', 'tags']

export function ConfigCardPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const { data: configCard, isLoading: loadingConfig } = useConfigCard()
  const { data: camposData } = useCampos('oportunidade')
  const atualizarConfig = useAtualizarConfigCard()

  const [camposVisiveis, setCamposVisiveis] = useState<string[]>(CAMPOS_DEFAULT_VISIVEIS)
  const [camposCustomVisiveis, setCamposCustomVisiveis] = useState<string[]>([])
  const [temAlteracoes, setTemAlteracoes] = useState(false)

  // Inicializar com dados do servidor
  useEffect(() => {
    if (configCard) {
      const cv = Array.isArray(configCard.campos_visiveis) ? configCard.campos_visiveis : CAMPOS_DEFAULT_VISIVEIS
      const ccv = Array.isArray(configCard.campos_customizados_visiveis) ? configCard.campos_customizados_visiveis : []
      setCamposVisiveis(cv)
      setCamposCustomVisiveis(ccv)
    }
  }, [configCard])

  useEffect(() => {
    setSubtitle('Defina quais campos aparecem no card da oportunidade no Kanban')
    setActions(null)
    return () => { setActions(null); setSubtitle(null) }
  }, [setActions, setSubtitle])

  const toggleCampoPadrao = (key: string) => {
    if (!isAdmin) return
    setCamposVisiveis(prev => {
      const novo = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
      setTemAlteracoes(true)
      return novo
    })
  }

  const toggleCampoCustom = (id: string) => {
    if (!isAdmin) return
    setCamposCustomVisiveis(prev => {
      const novo = prev.includes(id)
        ? prev.filter(k => k !== id)
        : [...prev, id]
      setTemAlteracoes(true)
      return novo
    })
  }

  const handleSalvar = async () => {
    try {
      await atualizarConfig.mutateAsync({
        campos_visiveis: camposVisiveis,
        campos_customizados_visiveis: camposCustomVisiveis,
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

  const camposCustomizados = camposData?.campos?.filter(c => !c.sistema) || []

  return (
    <div className="space-y-6">
      {/* Campos padrão */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Campos visíveis no card</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CAMPOS_PADRAO.map(campo => (
            <label
              key={campo.key}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                isAdmin ? 'cursor-pointer hover:bg-accent/30' : 'cursor-default'
              } ${
                camposVisiveis.includes(campo.key)
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/50'
              }`}
            >
              <input
                type="checkbox"
                checked={camposVisiveis.includes(campo.key)}
                onChange={() => toggleCampoPadrao(campo.key)}
                disabled={!isAdmin}
                className="rounded border-input text-primary focus:ring-ring disabled:opacity-50"
              />
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground">{campo.label}</span>
                <p className="text-xs text-muted-foreground">{campo.descricao}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Campos customizados */}
      {camposCustomizados.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Campos Customizados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {camposCustomizados.map(campo => (
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
                  onChange={() => toggleCampoCustom(campo.id)}
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
