/**
 * AIDEV-NOTE: Tab de Estilos com edição inline no preview (click-to-edit)
 * Preview full-width com painel lateral de edição ao selecionar elemento
 */

import { useState, useEffect } from 'react'
import { Loader2, Eye, EyeOff, Save, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useEstilosFormulario, useSalvarEstilos } from '../../hooks/useFormularioEstilos'
import { EstiloContainerForm } from '../estilos/EstiloContainerForm'
import { EstiloCamposForm } from '../estilos/EstiloCamposForm'
import { EstiloBotaoForm } from '../estilos/EstiloBotaoForm'
import { EstiloPreviewInterativo, type SelectedElement } from '../estilos/EstiloPreviewInterativo'
import { EstiloPopover } from '../estilos/EstiloPopover'
import { ESTILO_PADRAO } from '../../services/formularios.api'
import type {
  EstiloContainer,
  EstiloCabecalho,
  EstiloCampos,
  EstiloPagina,
  Formulario,
} from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsEstilos({ formulario }: Props) {
  const { data: estilos, isLoading } = useEstilosFormulario(formulario.id)
  const salvar = useSalvarEstilos(formulario.id)

  const [container, setContainer] = useState<EstiloContainer>(ESTILO_PADRAO.container)
  const [cabecalho, setCabecalho] = useState<EstiloCabecalho>(ESTILO_PADRAO.cabecalho)
  const [campos, setCampos] = useState<EstiloCampos>(ESTILO_PADRAO.campos)
  const [botao, setBotao] = useState(ESTILO_PADRAO.botao)
  const [pagina, setPagina] = useState<EstiloPagina>(ESTILO_PADRAO.pagina)
  const [cssCustomizado, setCssCustomizado] = useState('')

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null)
  const [showFinalPreview, setShowFinalPreview] = useState(false)
  const [showCssDrawer, setShowCssDrawer] = useState(false)

  useEffect(() => {
    if (estilos) {
      setContainer(estilos.container || ESTILO_PADRAO.container)
      setCabecalho(estilos.cabecalho || ESTILO_PADRAO.cabecalho)
      setCampos(estilos.campos || ESTILO_PADRAO.campos)
      setBotao(estilos.botao || ESTILO_PADRAO.botao)
      setPagina(estilos.pagina || ESTILO_PADRAO.pagina)
      setCssCustomizado(estilos.css_customizado || '')
    }
  }, [estilos])

  const handleSave = () => {
    salvar.mutate({
      container,
      cabecalho,
      campos,
      botao,
      pagina,
      css_customizado: cssCustomizado || null,
    })
  }

  const toggleFinalPreview = () => {
    setShowFinalPreview((v) => !v)
    setSelectedElement(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const panelTitle =
    selectedElement === 'container'
      ? 'Container'
      : selectedElement === 'campos'
      ? 'Campos'
      : selectedElement === 'botao'
      ? 'Botão'
      : ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant={showFinalPreview ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFinalPreview}
          >
            {showFinalPreview ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                Voltar ao Editor
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Visualizar Final
              </>
            )}
          </Button>

          {!showFinalPreview && (
            <Button
              variant={showCssDrawer ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowCssDrawer((v) => !v)}
            >
              <Code className="w-3.5 h-3.5 mr-1.5" />
              CSS
            </Button>
          )}
        </div>

        <Button size="sm" onClick={handleSave} disabled={salvar.isPending}>
          {salvar.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1.5" />
          )}
          Salvar
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Preview Area */}
        <div
          className="flex-1 overflow-y-auto flex items-start justify-center p-6"
          style={
            showFinalPreview
              ? {
                  backgroundColor: pagina.background_color || '#F3F4F6',
                  minHeight: '100%',
                  alignItems: 'center',
                }
              : { backgroundColor: 'hsl(var(--muted) / 0.3)' }
          }
          onClick={() => {
            if (!showFinalPreview) setSelectedElement(null)
          }}
        >
          {!showFinalPreview && !selectedElement && (
            <p className="absolute top-16 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none">
              Clique em um elemento para editar seus estilos
            </p>
          )}
          <EstiloPreviewInterativo
            container={container}
            cabecalho={cabecalho}
            campos={campos}
            botao={botao}
            titulo={formulario.nome}
            descricao={formulario.descricao || undefined}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            isPreviewMode={showFinalPreview}
          />
        </div>

        {/* Side Panel for editing */}
        {!showFinalPreview && selectedElement && (
          <EstiloPopover
            open={!!selectedElement}
            onClose={() => setSelectedElement(null)}
            titulo={panelTitle}
          >
            {selectedElement === 'container' && (
              <EstiloContainerForm value={container} onChange={setContainer} />
            )}
            {selectedElement === 'campos' && (
              <EstiloCamposForm value={campos} onChange={setCampos} />
            )}
            {selectedElement === 'botao' && (
              <EstiloBotaoForm value={botao} onChange={setBotao} />
            )}
          </EstiloPopover>
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
  )
}
