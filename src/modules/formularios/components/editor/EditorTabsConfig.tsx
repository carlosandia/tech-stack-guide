/**
 * AIDEV-NOTE: Tab de Configurações do editor
 * Exibe formulários condicionais baseados no tipo do formulário
 * Popup: config popup | Newsletter: config newsletter | Multi-step: etapas
 */

import { ConfigPopupForm } from '../config/ConfigPopupForm'
import { ConfigNewsletterForm } from '../config/ConfigNewsletterForm'
import { ConfigEtapasForm } from '../config/ConfigEtapasForm'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsConfig({ formulario }: Props) {
  const isPopup = formulario.tipo === 'popup'
  const isNewsletter = formulario.tipo === 'newsletter'
  const isMultiStep = formulario.tipo === 'multi_step'

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto">
      {/* Multi-step: sempre disponível para qualquer tipo */}
      <ConfigEtapasForm formularioId={formulario.id} />

      {isPopup && (
        <>
          <hr className="border-border" />
          <ConfigPopupForm formularioId={formulario.id} />
        </>
      )}

      {isNewsletter && (
        <>
          <hr className="border-border" />
          <ConfigNewsletterForm formularioId={formulario.id} />
        </>
      )}

      {!isPopup && !isNewsletter && !isMultiStep && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Configurações avançadas de <strong>Popup</strong> e <strong>Newsletter</strong> ficam disponíveis ao selecionar esses tipos de formulário.
          </p>
        </div>
      )}
    </div>
  )
}
