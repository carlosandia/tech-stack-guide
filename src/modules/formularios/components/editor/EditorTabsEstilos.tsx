/**
 * AIDEV-NOTE: Tab de Estilos no editor de formulário
 * Layout: Configurações (esquerda) | Preview em tempo real (direita)
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useEstilosFormulario, useSalvarEstilos } from '../../hooks/useFormularioEstilos'
import { EstiloContainerForm } from '../estilos/EstiloContainerForm'
import { EstiloCamposForm } from '../estilos/EstiloCamposForm'
import { EstiloBotaoForm } from '../estilos/EstiloBotaoForm'
import { EstiloPreview } from '../estilos/EstiloPreview'
import { ESTILO_PADRAO } from '../../services/formularios.api'
import type {
  EstiloContainer,
  EstiloCabecalho,
  EstiloCampos,
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
  const [cssCustomizado, setCssCustomizado] = useState('')

  useEffect(() => {
    if (estilos) {
      setContainer(estilos.container || ESTILO_PADRAO.container)
      setCabecalho(estilos.cabecalho || ESTILO_PADRAO.cabecalho)
      setCampos(estilos.campos || ESTILO_PADRAO.campos)
      setBotao(estilos.botao || ESTILO_PADRAO.botao)
      setCssCustomizado(estilos.css_customizado || '')
    }
  }, [estilos])

  const handleSave = () => {
    salvar.mutate({
      container,
      cabecalho,
      campos,
      botao,
      css_customizado: cssCustomizado || null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Config Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 border-r border-border">
        <EstiloContainerForm value={container} onChange={setContainer} />

        <hr className="border-border" />

        <EstiloCamposForm value={campos} onChange={setCampos} />

        <hr className="border-border" />

        <EstiloBotaoForm value={botao} onChange={setBotao} />

        <hr className="border-border" />

        {/* CSS Customizado */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">CSS Customizado</h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Estilos adicionais (avançado)</Label>
            <Textarea
              value={cssCustomizado}
              onChange={(e) => setCssCustomizado(e.target.value)}
              rows={5}
              placeholder=".form-container { /* seus estilos */ }"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={salvar.isPending} className="w-full">
          {salvar.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Estilos'
          )}
        </Button>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
        <EstiloPreview
          container={container}
          cabecalho={cabecalho}
          campos={campos}
          botao={botao}
          titulo={formulario.nome}
          descricao={formulario.descricao || undefined}
        />
      </div>
    </div>
  )
}
