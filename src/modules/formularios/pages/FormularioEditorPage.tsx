/**
 * AIDEV-NOTE: Página de edição do formulário com tabs
 * Tabs: Campos | Estilos (e futuras tabs)
 * Campos: Paleta (esquerda) | Preview (centro) | Config (direita)
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PanelLeft, PanelRight, Loader2, LayoutGrid, Paintbrush, Settings2, Share2, Zap, BarChart3, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFormulario } from '../hooks/useFormularios'
import {
  useCamposFormulario,
  useCriarCampo,
  useAtualizarCampo,
  useExcluirCampo,
  useReordenarCampos,
} from '../hooks/useFormularioCampos'
import { EditorHeader } from '../components/editor/EditorHeader'
import { CamposPaleta } from '../components/campos/CamposPaleta'
import { CampoConfigPanel } from '../components/campos/CampoConfigPanel'
import { FormPreview } from '../components/editor/FormPreview'
import { EditorTabsEstilos } from '../components/editor/EditorTabsEstilos'
import { EditorTabsCompartilhar } from '../components/editor/EditorTabsCompartilhar'
import { EditorTabsConfig } from '../components/editor/EditorTabsConfig'
import { EditorTabsLogica } from '../components/editor/EditorTabsLogica'
import { EditorTabsAnalytics } from '../components/editor/EditorTabsAnalytics'
import { EditorTabsAB } from '../components/editor/EditorTabsAB'
import type { CampoFormulario } from '../services/formularios.api'

type EditorTab = 'campos' | 'estilos' | 'config' | 'logica' | 'compartilhar' | 'analytics' | 'ab'

const TABS: { key: EditorTab; label: string; icon: React.ElementType }[] = [
  { key: 'campos', label: 'Campos', icon: LayoutGrid },
  { key: 'estilos', label: 'Estilos', icon: Paintbrush },
  { key: 'config', label: 'Configurações', icon: Settings2 },
  { key: 'logica', label: 'Lógica', icon: Zap },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'ab', label: 'A/B Testing', icon: FlaskConical },
  { key: 'compartilhar', label: 'Compartilhar', icon: Share2 },
]

export function FormularioEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: formulario, isLoading: loadingForm } = useFormulario(id || null)
  const { data: campos = [], isLoading: loadingCampos } = useCamposFormulario(id || null)
  const criarCampo = useCriarCampo(id || '')
  const atualizarCampo = useAtualizarCampo(id || '')
  const excluirCampo = useExcluirCampo(id || '')
  const reordenarCampos = useReordenarCampos(id || '')

  const [activeTab, setActiveTab] = useState<EditorTab>('campos')
  const [selectedCampoId, setSelectedCampoId] = useState<string | null>(null)
  const [showPaleta, setShowPaleta] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  const selectedCampo = campos.find((c) => c.id === selectedCampoId)

  const handleDropNewCampo = useCallback(
    (e: React.DragEvent, index: number) => {
      const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
      if (!campoTipoData) return
      const tipoCampo = JSON.parse(campoTipoData)
      const label = tipoCampo.label || tipoCampo.tipo
      const nome = tipoCampo.tipo + '_' + Date.now().toString(36)
      criarCampo.mutate({
        nome, label, tipo: tipoCampo.tipo, ordem: index, obrigatorio: false, largura: 'full',
      } as Partial<CampoFormulario>)
    },
    [criarCampo]
  )

  const handleMoveCampo = useCallback(
    (campoId: string, direcao: 'up' | 'down') => {
      const index = campos.findIndex((c) => c.id === campoId)
      if (index === -1) return
      const newIndex = direcao === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= campos.length) return
      const newCampos = [...campos]
      const [moved] = newCampos.splice(index, 1)
      newCampos.splice(newIndex, 0, moved)
      reordenarCampos.mutate(newCampos.map((c, i) => ({ id: c.id, ordem: i })))
    },
    [campos, reordenarCampos]
  )

  const handleReorderCampo = useCallback(
    (dragId: string, dropId: string) => {
      if (dragId === dropId) return
      const dragIdx = campos.findIndex((c) => c.id === dragId)
      const dropIdx = campos.findIndex((c) => c.id === dropId)
      if (dragIdx === -1 || dropIdx === -1) return
      const newCampos = [...campos]
      const [moved] = newCampos.splice(dragIdx, 1)
      newCampos.splice(dropIdx, 0, moved)
      reordenarCampos.mutate(newCampos.map((c, i) => ({ id: c.id, ordem: i })))
    },
    [campos, reordenarCampos]
  )

  const handleSelectCampo = useCallback((id: string | null) => {
    setSelectedCampoId(id)
    if (id) setShowConfig(true)
  }, [])

  const handleUpdateCampo = useCallback(
    (payload: Partial<CampoFormulario>) => {
      if (!selectedCampoId) return
      atualizarCampo.mutate({ campoId: selectedCampoId, payload })
    },
    [selectedCampoId, atualizarCampo]
  )

  const handleRemoveCampo = useCallback(
    (campoId: string) => {
      excluirCampo.mutate(campoId)
      if (selectedCampoId === campoId) {
        setSelectedCampoId(null)
        setShowConfig(false)
      }
    },
    [excluirCampo, selectedCampoId]
  )

  if (loadingForm || loadingCampos) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!formulario) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">Formulário não encontrado</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/formularios')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorHeader formulario={formulario} />

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border bg-card">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'campos' && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile toggle buttons */}
          <div className="lg:hidden absolute top-2 left-2 z-10 flex gap-1">
            <Button
              variant={showPaleta ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => { setShowPaleta(!showPaleta); if (!showPaleta) setShowConfig(false) }}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            {selectedCampo && (
              <Button
                variant={showConfig ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => { setShowConfig(!showConfig); if (!showConfig) setShowPaleta(false) }}
              >
                <PanelRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Paleta */}
          <div
            className={cn(
              'border-r border-border bg-card overflow-y-auto flex-shrink-0 transition-all duration-200',
              'hidden lg:block lg:w-64',
              showPaleta && 'block absolute inset-y-0 left-0 w-64 z-20 shadow-lg lg:relative lg:shadow-none'
            )}
          >
            <div className="p-3">
              <CamposPaleta />
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-hidden">
            <FormPreview
              formulario={formulario}
              campos={campos}
              selectedCampoId={selectedCampoId}
              onSelectCampo={handleSelectCampo}
              onRemoveCampo={handleRemoveCampo}
              onMoveCampo={handleMoveCampo}
              onReorderCampo={handleReorderCampo}
              onDropNewCampo={handleDropNewCampo}
            />
          </div>

          {/* Config panel */}
          {selectedCampo && (
            <div
              className={cn(
                'border-l border-border bg-card overflow-y-auto flex-shrink-0 transition-all duration-200',
                'hidden lg:block lg:w-72',
                showConfig && 'block absolute inset-y-0 right-0 w-72 z-20 shadow-lg lg:relative lg:shadow-none'
              )}
            >
              <div className="p-3">
                <CampoConfigPanel
                  campo={selectedCampo}
                  onUpdate={handleUpdateCampo}
                  onClose={() => { setSelectedCampoId(null); setShowConfig(false) }}
                />
              </div>
            </div>
          )}

          {/* Mobile overlay */}
          {(showPaleta || showConfig) && (
            <div
              className="lg:hidden fixed inset-0 bg-foreground/20 z-10"
              onClick={() => { setShowPaleta(false); setShowConfig(false) }}
            />
          )}
        </div>
      )}

      {activeTab === 'estilos' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsEstilos formulario={formulario} />
        </div>
      )}

      {activeTab === 'config' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsConfig formulario={formulario} />
        </div>
      )}

      {activeTab === 'logica' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsLogica formulario={formulario} />
        </div>
      )}

      {activeTab === 'compartilhar' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsCompartilhar formulario={formulario} />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsAnalytics formulario={formulario} />
        </div>
      )}

      {activeTab === 'ab' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsAB formulario={formulario} />
        </div>
      )}
    </div>
  )
}
