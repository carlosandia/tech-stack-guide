/**
 * AIDEV-NOTE: Tab de Configurações do editor
 * Consolida: Geral (Popup/Newsletter/Etapas), Lógica, Integrações, A/B Testing
 * Cada seção é colapsável com accordion
 */

import { useState } from 'react'
import { ChevronDown, Settings2, Zap, Plug, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfigPopupForm } from '../config/ConfigPopupForm'
import { ConfigNewsletterForm } from '../config/ConfigNewsletterForm'
import { ConfigEtapasForm } from '../config/ConfigEtapasForm'
import { EditorTabsLogica } from './EditorTabsLogica'
import { EditorTabsIntegracoes } from './EditorTabsIntegracoes'
import { EditorTabsAB } from './EditorTabsAB'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

interface SectionProps {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4">
          {children}
        </div>
      )}
    </div>
  )
}

export function EditorTabsConfig({ formulario }: Props) {
  const isPopup = formulario.tipo === 'popup'
  const isNewsletter = formulario.tipo === 'newsletter'

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto">
      {/* Seção: Configurações Gerais */}
      <CollapsibleSection title="Configurações Gerais" icon={Settings2} defaultOpen={true}>
        <div className="space-y-6">
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
        </div>
      </CollapsibleSection>

      {/* Seção: Lógica Condicional */}
      <CollapsibleSection title="Lógica Condicional" icon={Zap}>
        <EditorTabsLogica formulario={formulario} />
      </CollapsibleSection>

      {/* Seção: Integrações */}
      <CollapsibleSection title="Integrações" icon={Plug}>
        <EditorTabsIntegracoes formulario={formulario} />
      </CollapsibleSection>

      {/* Seção: A/B Testing */}
      <CollapsibleSection title="A/B Testing" icon={FlaskConical}>
        <EditorTabsAB formulario={formulario} />
      </CollapsibleSection>
    </div>
  )
}
