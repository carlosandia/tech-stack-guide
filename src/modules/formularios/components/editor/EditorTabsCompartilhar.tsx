/**
 * AIDEV-NOTE: Tab de Compartilhamento do editor
 * Link direto, Embed code, QR Code
 */

import { LinkDiretoCard } from '../compartilhar/LinkDiretoCard'
import { EmbedCodeCard } from '../compartilhar/EmbedCodeCard'
import { QRCodeCard } from '../compartilhar/QRCodeCard'
import { SubmissoesList } from '../submissoes/SubmissoesList'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsCompartilhar({ formulario }: Props) {
  // Base URL for public form access
  const baseUrl = window.location.origin

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto">
      {/* Compartilhamento */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Compartilhar</h2>
        <div className="space-y-4">
          <LinkDiretoCard slug={formulario.slug} baseUrl={baseUrl} />
          <EmbedCodeCard slug={formulario.slug} baseUrl={baseUrl} />
          <QRCodeCard slug={formulario.slug} baseUrl={baseUrl} />
        </div>
      </div>

      {/* Submissões */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Submissões</h2>
        <SubmissoesList formularioId={formulario.id} />
      </div>
    </div>
  )
}
