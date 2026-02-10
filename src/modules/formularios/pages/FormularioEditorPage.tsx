/**
 * AIDEV-NOTE: Página de edição do formulário com tabs
 * Tabs: Campos | Configurações | Lógica | ...
 * Campos: Paleta (esquerda) | Preview (centro) | Config/Estilos (direita)
 * Estilos integrados no preview com click-to-edit inline
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PanelLeft, PanelRight, Loader2, LayoutGrid, Settings2, Share2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormulario } from '../hooks/useFormularios'
import { useConfigPopup, useSalvarConfigPopup } from '../hooks/useFormularioConfig'
import {
  useCamposFormulario,
  useCriarCampo,
  useAtualizarCampo,
  useExcluirCampo,
  useReordenarCampos,
} from '../hooks/useFormularioCampos'
import { useEstilosFormulario, useSalvarEstilos } from '../hooks/useFormularioEstilos'
import { ESTILO_PADRAO } from '../services/formularios.api'
import { EditorHeader } from '../components/editor/EditorHeader'
import { CamposPaleta } from '../components/campos/CamposPaleta'
import { CampoConfigPanel } from '../components/campos/CampoConfigPanel'
import { FormPreview } from '../components/editor/FormPreview'
import { type SelectedElement } from '../components/estilos/EstiloPreviewInterativo'
import { EstiloPopover } from '../components/estilos/EstiloPopover'
import { EstiloContainerForm } from '../components/estilos/EstiloContainerForm'
import { EstiloCamposForm } from '../components/estilos/EstiloCamposForm'
import { BotaoConfigPanel } from '../components/config/BotaoConfigPanel'
import { PopupLayoutSelector, type PopupTemplate } from '../components/config/PopupLayoutSelector'
import { EditorTabsCompartilhar } from '../components/editor/EditorTabsCompartilhar'
import { EditorTabsConfig } from '../components/editor/EditorTabsConfig'
import { EditorTabsAnalytics } from '../components/editor/EditorTabsAnalytics'
import type { CampoFormulario } from '../services/formularios.api'

type EditorTab = 'campos' | 'config' | 'compartilhar' | 'analytics'

const TABS: { key: EditorTab; label: string; icon: React.ElementType }[] = [
  { key: 'campos', label: 'Campos', icon: LayoutGrid },
  { key: 'config', label: 'Configurações', icon: Settings2 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'compartilhar', label: 'Compartilhar', icon: Share2 },
]

export function FormularioEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: formulario, isLoading: loadingForm } = useFormulario(id || null)
  const { data: campos = [], isLoading: loadingCampos } = useCamposFormulario(id || null)
  const { data: configPopup } = useConfigPopup(formulario?.tipo === 'popup' ? (id || null) : null)
  const criarCampo = useCriarCampo(id || '')
  const atualizarCampo = useAtualizarCampo(id || '')
  const excluirCampo = useExcluirCampo(id || '')
  const reordenarCampos = useReordenarCampos(id || '')

  // Estilos state
  const { data: estilos } = useEstilosFormulario(id || null)
  const salvarEstilos = useSalvarEstilos(id || '')
  const [container, setContainer] = useState(ESTILO_PADRAO.container)
  const [cabecalho, setCabecalho] = useState(ESTILO_PADRAO.cabecalho)
  const [camposEstilo, setCamposEstilo] = useState(ESTILO_PADRAO.campos)
  const [botao, setBotao] = useState(ESTILO_PADRAO.botao)
  const [pagina, setPagina] = useState(ESTILO_PADRAO.pagina)
  const [cssCustomizado, setCssCustomizado] = useState('')

  // Config botoes - local state for immediate reactivity
  const [localConfigBotoes, setLocalConfigBotoes] = useState<any>(null)
  const configBotoes = localConfigBotoes ?? (formulario?.config_botoes as any) ?? null

  // Popup layout - local state for immediate reactivity
  const salvarConfigPopup = useSalvarConfigPopup(id || '')
  const [localPopupTemplate, setLocalPopupTemplate] = useState<PopupTemplate>('so_campos')
  const [localPopupImagemUrl, setLocalPopupImagemUrl] = useState<string | null>(null)

  // Sync from server when formulario/configPopup changes
  useEffect(() => {
    if (formulario?.config_botoes) {
      setLocalConfigBotoes(formulario.config_botoes as any)
    }
  }, [formulario?.config_botoes])

  useEffect(() => {
    if (configPopup) {
      setLocalPopupTemplate((configPopup.popup_imagem_posicao as PopupTemplate) || 'so_campos')
      setLocalPopupImagemUrl(configPopup.popup_imagem_url || null)
    }
  }, [configPopup])

  useEffect(() => {
    if (estilos) {
      setContainer(estilos.container || ESTILO_PADRAO.container)
      setCabecalho(estilos.cabecalho || ESTILO_PADRAO.cabecalho)
      setCamposEstilo(estilos.campos || ESTILO_PADRAO.campos)
      setBotao(estilos.botao || ESTILO_PADRAO.botao)
      setPagina(estilos.pagina || ESTILO_PADRAO.pagina)
      setCssCustomizado(estilos.css_customizado || '')
    }
  }, [estilos])

  const [activeTab, setActiveTab] = useState<EditorTab>('campos')
  const [selectedCampoId, setSelectedCampoId] = useState<string | null>(null)
  const [showPaleta, setShowPaleta] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  // Style editing state
  const [showFinalPreview, setShowFinalPreview] = useState(false)
  const [selectedStyleElement, setSelectedStyleElement] = useState<SelectedElement>(null)
  const [showCssDrawer, setShowCssDrawer] = useState(false)
  const botaoSaveConfigRef = useRef<(() => Promise<void>) | null>(null)

  const selectedCampo = campos.find((c) => c.id === selectedCampoId)

  const handleSaveEstilos = () => {
    salvarEstilos.mutate({
      container,
      cabecalho,
      campos: camposEstilo,
      botao,
      pagina,
      css_customizado: cssCustomizado || null,
    })
  }

  const toggleFinalPreview = () => {
    setShowFinalPreview((v) => !v)
    setSelectedStyleElement(null)
    setSelectedCampoId(null)
    setShowConfig(false)
  }

  const handleDropNewCampo = useCallback(
    (e: React.DragEvent, index: number) => {
      const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
      if (!campoTipoData) return
      const tipoCampo = JSON.parse(campoTipoData)
      const label = tipoCampo.label || tipoCampo.tipo
      const nome = tipoCampo.tipo + '_' + Date.now().toString(36)
      const newCampoPayload = {
        nome, label, tipo: tipoCampo.tipo, ordem: index, obrigatorio: false, largura: 'full',
      } as Partial<CampoFormulario>

      if (campos.length === 0) {
        criarCampo.mutate(newCampoPayload)
        return
      }

      const shifted = campos.map((c) => ({
        id: c.id,
        ordem: c.ordem >= index ? c.ordem + 1 : c.ordem,
      }))
      reordenarCampos.mutate(shifted, {
        onSuccess: () => criarCampo.mutate(newCampoPayload),
      })
    },
    [criarCampo, campos, reordenarCampos]
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
    (dragId: string, targetIndex: number) => {
      const dragIdx = campos.findIndex((c) => c.id === dragId)
      if (dragIdx === -1) return
      if (dragIdx === targetIndex || dragIdx === targetIndex - 1) return
      const newCampos = [...campos]
      const [moved] = newCampos.splice(dragIdx, 1)
      const insertAt = dragIdx < targetIndex ? targetIndex - 1 : targetIndex
      newCampos.splice(insertAt, 0, moved)
      reordenarCampos.mutate(newCampos.map((c, i) => ({ id: c.id, ordem: i })))
    },
    [campos, reordenarCampos]
  )

  const handleSelectCampo = useCallback((id: string | null) => {
    setSelectedCampoId(id)
    setSelectedStyleElement(null)
    if (id) setShowConfig(true)
  }, [])

  const handleUpdateCampo = useCallback(
    (payload: Partial<CampoFormulario>) => {
      if (!selectedCampoId) return
      atualizarCampo.mutate({ campoId: selectedCampoId, payload })
    },
    [selectedCampoId, atualizarCampo]
  )

  const handleUpdateCampoLabel = useCallback(
    (campoId: string, newLabel: string) => {
      atualizarCampo.mutate({ campoId, payload: { label: newLabel } })
    },
    [atualizarCampo]
  )

  const handleUpdateBotaoTexto = useCallback(
    (tipo: 'enviar' | 'whatsapp', newTexto: string) => {
      if (tipo === 'enviar') {
        setBotao(prev => ({ ...prev, texto: newTexto }))
      } else {
        setBotao(prev => ({ ...prev, whatsapp_texto: newTexto }))
      }
      // Auto-save estilos
      setTimeout(() => {
        salvarEstilos.mutate({
          container,
          cabecalho,
          campos: camposEstilo,
          botao: tipo === 'enviar'
            ? { ...botao, texto: newTexto }
            : { ...botao, whatsapp_texto: newTexto },
          pagina,
          css_customizado: cssCustomizado || null,
        })
      }, 0)
    },
    [salvarEstilos, container, cabecalho, camposEstilo, botao, pagina, cssCustomizado]
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

  const handleSelectStyleElement = useCallback((el: SelectedElement) => {
    setSelectedStyleElement(el)
    setSelectedCampoId(null)
    setShowConfig(false)
  }, [])

  const panelTitle =
    selectedStyleElement === 'container'
      ? 'Container'
      : selectedStyleElement === 'campos'
      ? 'Campos'
      : selectedStyleElement === 'botao'
      ? 'Botão Enviar'
      : selectedStyleElement === 'botao_whatsapp'
      ? 'Botão WhatsApp'
      : ''

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
      <EditorHeader
        formulario={formulario}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => {
          setActiveTab(key as EditorTab)
          if (key !== 'campos') {
            setShowFinalPreview(false)
            setSelectedStyleElement(null)
          }
        }}
      />

      {/* Tab Content */}
      {activeTab === 'campos' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Paleta - hidden in final preview */}
            {!showFinalPreview && (
              <>
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
                    {formulario.tipo === 'popup' && (
                      <div className="mb-4 pb-3 border-b border-border">
                        <PopupLayoutSelector
                          formularioId={formulario.id}
                          template={localPopupTemplate}
                          imagemUrl={localPopupImagemUrl}
                          onChangeTemplate={(t) => {
                            setLocalPopupTemplate(t)
                            salvarConfigPopup.mutate({ popup_imagem_posicao: t })
                          }}
                          onChangeImagemUrl={(url) => {
                            setLocalPopupImagemUrl(url)
                            salvarConfigPopup.mutate({ popup_imagem_url: url, popup_imagem_posicao: localPopupTemplate })
                          }}
                        />
                      </div>
                    )}
                    <CamposPaleta />
                  </div>
                </div>
              </>
            )}

            {/* Preview */}
            <div className="flex-1 overflow-hidden">
              <FormPreview
                formulario={formulario}
                campos={campos}
                selectedCampoId={showFinalPreview ? null : selectedCampoId}
                onSelectCampo={showFinalPreview ? () => {} : handleSelectCampo}
                onRemoveCampo={handleRemoveCampo}
                onMoveCampo={handleMoveCampo}
                onReorderCampo={handleReorderCampo}
                onDropNewCampo={handleDropNewCampo}
                estiloContainer={container}
                estiloCampos={camposEstilo}
                estiloBotao={botao}
                estiloCabecalho={cabecalho}
                selectedStyleElement={showFinalPreview ? undefined : selectedStyleElement}
                onSelectStyleElement={showFinalPreview ? undefined : handleSelectStyleElement}
                onToggleFinalPreview={toggleFinalPreview}
                showFinalPreview={showFinalPreview}
                onToggleCss={() => setShowCssDrawer((v) => !v)}
                showCssDrawer={showCssDrawer}
                onSaveEstilos={handleSaveEstilos}
                isSaving={salvarEstilos.isPending}
                paginaBackgroundColor={pagina.background_color}
                cssCustomizado={cssCustomizado}
                configBotoes={configBotoes}
                popupLayout={formulario.tipo === 'popup' ? {
                  template: localPopupTemplate,
                  imagemUrl: localPopupImagemUrl,
                } : null}
                onUpdateCampoLabel={handleUpdateCampoLabel}
                onUpdateBotaoTexto={handleUpdateBotaoTexto}
              />
            </div>

            {/* Config panel - hidden in final preview */}
            {!showFinalPreview && selectedCampo && !selectedStyleElement && (
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

            {/* Style panel - hidden in final preview */}
            {!showFinalPreview && selectedStyleElement && (
              <EstiloPopover
                open={!!selectedStyleElement}
                onClose={() => setSelectedStyleElement(null)}
                titulo={panelTitle}
                onSave={handleSaveEstilos}
                isSaving={salvarEstilos.isPending}
                onSaveConfig={(selectedStyleElement === 'botao' || selectedStyleElement === 'botao_whatsapp') ? async () => { await botaoSaveConfigRef.current?.() } : undefined}
              >
                {selectedStyleElement === 'container' && (
                  <EstiloContainerForm value={container} onChange={setContainer} />
                )}
                {selectedStyleElement === 'campos' && (
                  <EstiloCamposForm value={camposEstilo} onChange={setCamposEstilo} />
                )}
                {selectedStyleElement === 'botao' && (
                  <BotaoConfigPanel
                    formularioId={formulario.id}
                    tipo="botao"
                    estiloBotao={botao}
                    onChangeEstilo={setBotao}
                    onConfigChange={setLocalConfigBotoes}
                    onRegisterSave={(fn) => { botaoSaveConfigRef.current = fn }}
                  />
                )}
                {selectedStyleElement === 'botao_whatsapp' && (
                  <BotaoConfigPanel
                    formularioId={formulario.id}
                    tipo="botao_whatsapp"
                    estiloBotao={botao}
                    onChangeEstilo={setBotao}
                    onConfigChange={setLocalConfigBotoes}
                    onRegisterSave={(fn) => { botaoSaveConfigRef.current = fn }}
                  />
                )}
              </EstiloPopover>
            )}

            {/* Mobile overlay */}
            {!showFinalPreview && (showPaleta || showConfig) && (
              <div
                className="lg:hidden fixed inset-0 bg-foreground/20 z-10"
                onClick={() => { setShowPaleta(false); setShowConfig(false) }}
              />
            )}
          </div>

          {/* CSS Drawer */}
          {showCssDrawer && !showFinalPreview && (
            <div className="border-t border-border bg-background p-3 shrink-0 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">CSS Customizado (Avançado)</Label>
                <button
                  onClick={() => setShowCssDrawer(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              </div>
              <Textarea
                value={cssCustomizado}
                onChange={(e) => setCssCustomizado(e.target.value)}
                rows={4}
                placeholder=".form-container { /* seus estilos */ }"
                className="font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="flex-1 overflow-hidden">
          <EditorTabsConfig formulario={formulario} />
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
    </div>
  )
}
