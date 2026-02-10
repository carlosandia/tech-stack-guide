/**
 * AIDEV-NOTE: Tab de Configurações do editor
 * Layout sidebar vertical + conteúdo full-width
 * Seções condicionais baseadas no tipo do formulário
 */

import { useState } from 'react'
import { Settings2, Shield, Zap, FlaskConical, MousePointerClick, Mail, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfigPopupForm } from '../config/ConfigPopupForm'
import { ConfigNewsletterForm } from '../config/ConfigNewsletterForm'
import { ConfigEtapasForm } from '../config/ConfigEtapasForm'
import { LgpdConfigSection } from '../config/LgpdConfigSection'
import { EditorTabsLogica } from './EditorTabsLogica'
import { EditorTabsAB } from './EditorTabsAB'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

export function EditorTabsConfig({ formulario }: Props) {
  const navItems: NavItem[] = [
    { id: 'geral', label: 'Geral', icon: Settings2 },
    { id: 'lgpd', label: 'LGPD', icon: Shield },
    { id: 'logica', label: 'Lógica', icon: Zap },
    { id: 'ab', label: 'A/B Testing', icon: FlaskConical },
    // Condicionais
    ...(formulario.tipo === 'popup' ? [{ id: 'popup', label: 'Popup', icon: MousePointerClick }] : []),
    ...(formulario.tipo === 'newsletter' ? [{ id: 'newsletter', label: 'Newsletter', icon: Mail }] : []),
    ...(formulario.tipo === 'multi_step' ? [{ id: 'etapas', label: 'Etapas', icon: Layers }] : []),
  ]

  const [activeSection, setActiveSection] = useState('geral')

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Mobile: tabs horizontais */}
      <div className="lg:hidden flex border-b border-border overflow-x-auto shrink-0 bg-muted/30">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors',
              activeSection === item.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Desktop: sidebar vertical */}
      <div className="hidden lg:flex flex-col w-48 shrink-0 border-r border-border bg-muted/30 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left',
              activeSection === item.id
                ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {activeSection === 'geral' && (
            <div className="space-y-6">
              <ConfigEtapasForm formularioId={formulario.id} />
            </div>
          )}

          {activeSection === 'lgpd' && (
            <LgpdConfigSection formulario={formulario} />
          )}

          {activeSection === 'logica' && (
            <EditorTabsLogica formulario={formulario} />
          )}

          {activeSection === 'ab' && (
            <EditorTabsAB formulario={formulario} />
          )}

          {activeSection === 'popup' && formulario.tipo === 'popup' && (
            <ConfigPopupForm formularioId={formulario.id} />
          )}

          {activeSection === 'newsletter' && formulario.tipo === 'newsletter' && (
            <ConfigNewsletterForm formularioId={formulario.id} />
          )}

          {activeSection === 'etapas' && formulario.tipo === 'multi_step' && (
            <ConfigEtapasForm formularioId={formulario.id} />
          )}
        </div>
      </div>
    </div>
  )
}
