/**
 * AIDEV-NOTE: Página de edição do formulário com tabs
 * Tabs: Campos | Configurações | Lógica | ...
 * Campos: Paleta (esquerda) | Preview (centro) | Config/Estilos (direita)
 * Estilos integrados no preview com click-to-edit inline
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, LayoutGrid, Settings2, Share2, BarChart3, Plus, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormulario } from '../hooks/useFormularios'
import { useConfigPopup, useSalvarConfigPopup, useConfigNewsletter, useSalvarConfigNewsletter } from '../hooks/useFormularioConfig'
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
import { CamposPaleta, type TipoCampoPaleta } from '../components/campos/CamposPaleta'
import { CampoSidebarPanel } from '../components/campos/CampoSidebarPanel'
import { FormPreview } from '../components/editor/FormPreview'
import { type SelectedElement } from '../components/estilos/EstiloPreviewInterativo'
import { EstiloPopover } from '../components/estilos/EstiloPopover'
import { EstiloContainerForm } from '../components/estilos/EstiloContainerForm'
import { EstiloCamposForm } from '../components/estilos/EstiloCamposForm'
import { BotaoConfigPanel } from '../components/config/BotaoConfigPanel'
import { PopupLayoutSelector, type PopupTemplate } from '../components/config/PopupLayoutSelector'
import { NewsletterLayoutSelector } from '../components/config/NewsletterLayoutSelector'
import type { NewsletterTemplate } from '../services/formularios.api'
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
  const { data: configNewsletter } = useConfigNewsletter(formulario?.tipo === 'newsletter' ? (id || null) : null)
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
  const salvarConfigNewsletter = useSalvarConfigNewsletter(id || '')
  const [localPopupTemplate, setLocalPopupTemplate] = useState<PopupTemplate>('so_campos')
  const [localPopupImagemUrl, setLocalPopupImagemUrl] = useState<string | null>(null)
  const [localPopupImagemLink, setLocalPopupImagemLink] = useState<string | null>(null)

  // Newsletter layout - local state for immediate reactivity
  const [localNewsletterTemplate, setLocalNewsletterTemplate] = useState<NewsletterTemplate>('simples')
  const [localNewsletterImagemUrl, setLocalNewsletterImagemUrl] = useState<string | null>(null)
  const [localNewsletterImagemLink, setLocalNewsletterImagemLink] = useState<string | null>(null)

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
      setLocalPopupImagemLink((configPopup as any).popup_imagem_link || null)
    }
  }, [configPopup])

  useEffect(() => {
    if (configNewsletter) {
      setLocalNewsletterTemplate((configNewsletter.newsletter_layout as NewsletterTemplate) || 'simples')
      setLocalNewsletterImagemUrl(configNewsletter.newsletter_imagem_url || null)
      setLocalNewsletterImagemLink(configNewsletter.newsletter_imagem_link || null)
    }
  }, [configNewsletter])

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

  // AIDEV-NOTE: Auto-save estilos com debounce de 1s
  const estilosInitialized = useRef(false)
  const estilosDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Skip until estilos are loaded from server
    if (!estilos) return
    if (!estilosInitialized.current) {
      estilosInitialized.current = true
      return
    }

    if (estilosDebounceRef.current) clearTimeout(estilosDebounceRef.current)
    estilosDebounceRef.current = setTimeout(() => {
      salvarEstilos.mutate({
        container,
        cabecalho,
        campos: camposEstilo,
        botao,
        pagina,
        css_customizado: cssCustomizado || null,
      })
    }, 1000)

    return () => {
      if (estilosDebounceRef.current) clearTimeout(estilosDebounceRef.current)
    }
  }, [container, cabecalho, camposEstilo, botao, pagina, cssCustomizado])

  const [activeTab, setActiveTab] = useState<EditorTab>('campos')
  const [selectedCampoId, setSelectedCampoId] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  // Mobile overlays
  const [mobilePaletaOpen, setMobilePaletaOpen] = useState(false)
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false)

  // Style editing state
  const [showFinalPreview, setShowFinalPreview] = useState(false)
  const [selectedStyleElement, setSelectedStyleElement] = useState<SelectedElement>(null)
  const [showCssDrawer, setShowCssDrawer] = useState(false)
  const botaoSaveConfigRef = useRef<(() => Promise<void>) | null>(null)

  const selectedCampo = campos.find((c) => c.id === selectedCampoId)

  // Use configBotoes directly - no derivation from campos
  const effectiveConfigBotoes = configBotoes ? { ...configBotoes } : { tipo_botao: 'enviar' }

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

      // AIDEV-NOTE: Criar campo imediatamente (optimistic) — reordenar em paralelo
      if (campos.length > 0) {
        const shifted = campos.map((c) => ({
          id: c.id,
          ordem: c.ordem >= index ? c.ordem + 1 : c.ordem,
        }))
        reordenarCampos.mutate(shifted)
      }
      criarCampo.mutate(newCampoPayload)
    },
    [criarCampo, campos, reordenarCampos]
  )

  // AIDEV-NOTE: Adicionar campo ao clicar no + da paleta (adiciona no final)
  const handleAddCampoFromPaleta = useCallback(
    (tipoCampo: TipoCampoPaleta) => {
      const label = tipoCampo.label || tipoCampo.tipo
      const nome = tipoCampo.tipo + '_' + Date.now().toString(36)
      const index = campos.length
      criarCampo.mutate({
        nome, label, tipo: tipoCampo.tipo, ordem: index, obrigatorio: false, largura: 'full',
      } as Partial<CampoFormulario>)
    },
    [criarCampo, campos]
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
    (dragId: string, targetOrdem: number) => {
      const draggedCampo = campos.find((c) => c.id === dragId)
      if (!draggedCampo) return
      // Se já está na posição correta, ignorar
      if (draggedCampo.ordem === targetOrdem || draggedCampo.ordem === targetOrdem - 1) return

      const without = campos.filter((c) => c.id !== dragId)
      const insertAt = without.findIndex((c) => c.ordem >= targetOrdem)
      const newCampos = [...without]
      if (insertAt === -1) {
        newCampos.push(draggedCampo)
      } else {
        newCampos.splice(insertAt, 0, draggedCampo)
      }
      reordenarCampos.mutate(newCampos.map((c, i) => ({ id: c.id, ordem: i })))
    },
    [campos, reordenarCampos]
  )

  // AIDEV-NOTE: Handlers para drag-and-drop dentro de blocos de colunas
  const handleDropNewCampoInColuna = useCallback(
    (e: React.DragEvent, index: number, paiCampoId: string, colunaIndice: number) => {
      const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
      if (!campoTipoData) return
      const tipoCampo = JSON.parse(campoTipoData)
      const label = tipoCampo.label || tipoCampo.tipo
      const nome = tipoCampo.tipo + '_' + Date.now().toString(36)

      // Get children of this column to shift their ordem
      const colChildren = campos
        .filter(c => c.pai_campo_id === paiCampoId && c.coluna_indice === colunaIndice)
        .sort((a, b) => a.ordem - b.ordem)

      const shifted = colChildren
        .filter(c => c.ordem >= index)
        .map(c => ({ id: c.id, ordem: c.ordem + 1 }))

      const newPayload = {
        nome, label, tipo: tipoCampo.tipo, ordem: index, obrigatorio: false, largura: 'full',
        pai_campo_id: paiCampoId, coluna_indice: colunaIndice,
      } as Partial<CampoFormulario>

      // AIDEV-NOTE: Criar campo imediatamente (optimistic) — reordenar em paralelo
      if (shifted.length > 0) {
        reordenarCampos.mutate(shifted)
      }
      criarCampo.mutate(newPayload)
    },
    [campos, criarCampo, reordenarCampos]
  )

  const handleReorderCampoInColuna = useCallback(
    (dragId: string, targetIndex: number, paiCampoId: string, colunaIndice: number) => {
      const colChildren = campos
        .filter(c => c.pai_campo_id === paiCampoId && c.coluna_indice === colunaIndice)
        .sort((a, b) => a.ordem - b.ordem)

      const dragIdx = colChildren.findIndex(c => c.id === dragId)
      if (dragIdx === -1 || dragIdx === targetIndex || dragIdx === targetIndex - 1) return

      const newOrder = [...colChildren]
      const [moved] = newOrder.splice(dragIdx, 1)
      const insertAt = dragIdx < targetIndex ? targetIndex - 1 : targetIndex
      newOrder.splice(insertAt, 0, moved)
      reordenarCampos.mutate(newOrder.map((c, i) => ({ id: c.id, ordem: i })))
    },
    [campos, reordenarCampos]
  )

  const handleMoveCampoToColuna = useCallback(
    (campoId: string, paiCampoId: string, colunaIndice: number) => {
      const colChildren = campos
        .filter(c => c.pai_campo_id === paiCampoId && c.coluna_indice === colunaIndice)
        .sort((a, b) => a.ordem - b.ordem)

      const newOrdem = colChildren.length
      atualizarCampo.mutate({
        campoId,
        payload: { pai_campo_id: paiCampoId, coluna_indice: colunaIndice, ordem: newOrdem },
      })
    },
    [campos, atualizarCampo]
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

  // AIDEV-NOTE: Callback para atualizar campo específico por ID (usado em "Aplicar em todos")
  const handleUpdateCampoById = useCallback(
    (campoId: string, payload: Partial<CampoFormulario>) => {
      atualizarCampo.mutate({ campoId, payload })
    },
    [atualizarCampo]
  )

  const handleUpdateCampoLabel = useCallback(
    (campoId: string, newLabel: string) => {
      atualizarCampo.mutate({ campoId, payload: { label: newLabel } })
    },
    [atualizarCampo]
  )

  const handleUpdateCampoPlaceholder = useCallback(
    (campoId: string, newPlaceholder: string) => {
      atualizarCampo.mutate({ campoId, payload: { placeholder: newPlaceholder } })
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
      // AIDEV-NOTE: Desselecionar ANTES de excluir — desmonta CampoConfigPanel e cancela debounce pendente
      if (selectedCampoId === campoId) {
        setSelectedCampoId(null)
        setShowConfig(false)
      }
      excluirCampo.mutate(campoId)
    },
    [excluirCampo, selectedCampoId]
  )

  // AIDEV-NOTE: Duplicar campo com todas as configurações
  const handleDuplicateCampo = useCallback(
    (campoId: string) => {
      const original = campos.find((c) => c.id === campoId)
      if (!original) return

      const nome = original.tipo + '_' + Date.now().toString(36)
      const newOrdem = original.ordem + 1

      // Shift campos abaixo
      const shifted = campos
        .filter((c) => c.ordem >= newOrdem && c.id !== campoId)
        .map((c) => ({ id: c.id, ordem: c.ordem + 1 }))

      if (shifted.length > 0) {
        reordenarCampos.mutate(shifted)
      }

      const { id: _id, criado_em: _c, atualizado_em: _a, formulario_id: _f, ...rest } = original
      criarCampo.mutate({
        ...rest,
        nome,
        label: `${original.label} (cópia)`,
        ordem: newOrdem,
      } as Partial<CampoFormulario>)
    },
    [campos, criarCampo, reordenarCampos]
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
        <Button variant="outline" size="sm" onClick={() => navigate('/formularios')}>
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
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {/* Paleta - hidden in final preview */}
            {!showFinalPreview && (
              <>
                {/* Desktop paleta - only visible on lg+ */}
                <div
                  className="border-r border-border bg-card overflow-y-auto flex-shrink-0 transition-all duration-200 hidden lg:block lg:w-[272px]"
                >
                  <div className="p-3">
                    {formulario.tipo === 'popup' && (
                      <div className="mb-4 pb-3 border-b border-border">
                        <PopupLayoutSelector
                          formularioId={formulario.id}
                          template={localPopupTemplate}
                          imagemUrl={localPopupImagemUrl}
                          imagemLink={localPopupImagemLink}
                          onChangeTemplate={(t) => {
                            setLocalPopupTemplate(t)
                            salvarConfigPopup.mutate({ popup_imagem_posicao: t })
                          }}
                          onChangeImagemUrl={(url) => {
                            setLocalPopupImagemUrl(url)
                            salvarConfigPopup.mutate({ popup_imagem_url: url, popup_imagem_posicao: localPopupTemplate })
                          }}
                          onChangeImagemLink={(link) => {
                            setLocalPopupImagemLink(link)
                            salvarConfigPopup.mutate({ popup_imagem_link: link } as any)
                          }}
                        />
                      </div>
                    )}
                    {formulario.tipo === 'newsletter' && (
                      <div className="mb-4 pb-3 border-b border-border">
                        <NewsletterLayoutSelector
                          formularioId={formulario.id}
                          template={localNewsletterTemplate}
                          imagemUrl={localNewsletterImagemUrl}
                          imagemLink={localNewsletterImagemLink}
                          onChangeTemplate={(t) => {
                            setLocalNewsletterTemplate(t)
                            salvarConfigNewsletter.mutate({ newsletter_layout: t })
                          }}
                          onChangeImagemUrl={(url) => {
                            setLocalNewsletterImagemUrl(url)
                            salvarConfigNewsletter.mutate({ newsletter_imagem_url: url, newsletter_layout: localNewsletterTemplate })
                          }}
                          onChangeImagemLink={(link) => {
                            setLocalNewsletterImagemLink(link)
                            salvarConfigNewsletter.mutate({ newsletter_imagem_link: link })
                          }}
                        />
                      </div>
                    )}
                    <CamposPaleta
                      onAddCampo={handleAddCampoFromPaleta}
                    />
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
                onDuplicateCampo={handleDuplicateCampo}
                onMoveCampo={handleMoveCampo}
                onReorderCampo={handleReorderCampo}
                onDropNewCampo={handleDropNewCampo}
                onDropNewCampoInColuna={handleDropNewCampoInColuna}
                onReorderCampoInColuna={handleReorderCampoInColuna}
                onMoveCampoToColuna={handleMoveCampoToColuna}
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
                configBotoes={effectiveConfigBotoes}
                popupLayout={formulario.tipo === 'popup' ? {
                  template: localPopupTemplate,
                  imagemUrl: localPopupImagemUrl,
                  imagemLink: localPopupImagemLink,
                } : null}
                newsletterLayout={formulario.tipo === 'newsletter' ? {
                  template: localNewsletterTemplate,
                  imagemUrl: localNewsletterImagemUrl,
                  imagemLink: localNewsletterImagemLink,
                } : null}
                onUpdateCampoLabel={handleUpdateCampoLabel}
                onUpdateCampoPlaceholder={handleUpdateCampoPlaceholder}
                onUpdateBotaoTexto={handleUpdateBotaoTexto}
              />
            </div>

            {/* Config panel - hidden in final preview */}
            {!showFinalPreview && selectedCampo && !selectedStyleElement && (
              <CampoSidebarPanel
                campo={selectedCampo}
                onUpdate={handleUpdateCampo}
                onClose={() => { setSelectedCampoId(null); setShowConfig(false) }}
                showConfig={showConfig}
                estiloCampos={camposEstilo}
                onChangeEstiloCampos={setCamposEstilo}
                allCampos={campos}
                onUpdateCampoById={handleUpdateCampoById}
                onDuplicate={selectedCampoId ? () => handleDuplicateCampo(selectedCampoId) : undefined}
                onRemove={selectedCampoId ? () => handleRemoveCampo(selectedCampoId) : undefined}
              />
            )}

            {/* Style panel - hidden in final preview */}
            {!showFinalPreview && selectedStyleElement && (
              <EstiloPopover
                open={!!selectedStyleElement}
                onClose={() => setSelectedStyleElement(null)}
                titulo={panelTitle}
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

            {/* Mobile overlay for style panel */}
            {!showFinalPreview && selectedStyleElement && (
              <div
                className="lg:hidden fixed inset-0 bg-foreground/20 z-10"
                onClick={() => setSelectedStyleElement(null)}
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

          {/* Mobile bottom bar - only on campos tab */}
          {!showFinalPreview && (
            <div className="lg:hidden flex items-center gap-2 p-2 border-t border-border bg-card shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={() => setMobilePaletaOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Campos
              </Button>
              <Button
                variant={selectedCampo ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-9 text-xs"
                disabled={!selectedCampo}
                onClick={() => selectedCampo && setMobileConfigOpen(true)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Configurar
              </Button>
            </div>
          )}

          {/* Mobile paleta overlay */}
          {mobilePaletaOpen && (
            <div className="lg:hidden fixed inset-0 z-30 bg-card flex flex-col animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Adicionar Campo</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobilePaletaOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {formulario.tipo === 'popup' && (
                  <div className="mb-4 pb-3 border-b border-border">
                    <PopupLayoutSelector
                      formularioId={formulario.id}
                      template={localPopupTemplate}
                      imagemUrl={localPopupImagemUrl}
                      imagemLink={localPopupImagemLink}
                      onChangeTemplate={(t) => {
                        setLocalPopupTemplate(t)
                        salvarConfigPopup.mutate({ popup_imagem_posicao: t })
                      }}
                      onChangeImagemUrl={(url) => {
                        setLocalPopupImagemUrl(url)
                        salvarConfigPopup.mutate({ popup_imagem_url: url, popup_imagem_posicao: localPopupTemplate })
                      }}
                      onChangeImagemLink={(link) => {
                        setLocalPopupImagemLink(link)
                        salvarConfigPopup.mutate({ popup_imagem_link: link } as any)
                      }}
                    />
                  </div>
                )}
                {formulario.tipo === 'newsletter' && (
                  <div className="mb-4 pb-3 border-b border-border">
                    <NewsletterLayoutSelector
                      formularioId={formulario.id}
                      template={localNewsletterTemplate}
                      imagemUrl={localNewsletterImagemUrl}
                      imagemLink={localNewsletterImagemLink}
                      onChangeTemplate={(t) => {
                        setLocalNewsletterTemplate(t)
                        salvarConfigNewsletter.mutate({ newsletter_layout: t })
                      }}
                      onChangeImagemUrl={(url) => {
                        setLocalNewsletterImagemUrl(url)
                        salvarConfigNewsletter.mutate({ newsletter_imagem_url: url, newsletter_layout: localNewsletterTemplate })
                      }}
                      onChangeImagemLink={(link) => {
                        setLocalNewsletterImagemLink(link)
                        salvarConfigNewsletter.mutate({ newsletter_imagem_link: link })
                      }}
                    />
                  </div>
                )}
                <CamposPaleta
                  onAddCampo={(tipo) => {
                    handleAddCampoFromPaleta(tipo)
                    setMobilePaletaOpen(false)
                  }}
                />
              </div>
            </div>
          )}

          {/* Mobile config overlay */}
          {mobileConfigOpen && selectedCampo && (
            <CampoSidebarPanel
              campo={selectedCampo}
              onUpdate={handleUpdateCampo}
              onClose={() => { setMobileConfigOpen(false) }}
              showConfig={true}
              estiloCampos={camposEstilo}
              onChangeEstiloCampos={setCamposEstilo}
              allCampos={campos}
              onUpdateCampoById={handleUpdateCampoById}
              onDuplicate={selectedCampoId ? () => handleDuplicateCampo(selectedCampoId) : undefined}
              onRemove={selectedCampoId ? () => handleRemoveCampo(selectedCampoId) : undefined}
              fullscreen
            />
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

export default FormularioEditorPage
