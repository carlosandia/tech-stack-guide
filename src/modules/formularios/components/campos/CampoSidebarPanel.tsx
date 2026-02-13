/**
 * AIDEV-NOTE: Wrapper com abas Configuração/Estilo para o sidebar de campo
 * Similar ao BotaoConfigPanel, unifica config e estilo em um único local
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CampoConfigPanel } from './CampoConfigPanel'
import { EstiloCamposForm } from '../estilos/EstiloCamposForm'
import type { CampoFormulario, EstiloCampos } from '../../services/formularios.api'

type TabType = 'config' | 'estilo'

interface Props {
  campo: CampoFormulario
  onUpdate: (payload: Partial<CampoFormulario>) => void
  onClose: () => void
  showConfig: boolean
  estiloCampos: EstiloCampos
  onChangeEstiloCampos: (v: EstiloCampos) => void
  /** Renderizar como overlay fullscreen (mobile) */
  fullscreen?: boolean
}

export function CampoSidebarPanel({ campo, onUpdate, onClose, showConfig, estiloCampos, onChangeEstiloCampos, fullscreen }: Props) {
  const [tab, setTab] = useState<TabType>('config')

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-30 bg-card flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground truncate max-w-[240px]">
              {campo.label || campo.nome}
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {([
              { key: 'config' as TabType, label: 'Configuração' },
              { key: 'estilo' as TabType, label: 'Estilo' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors',
                  tab === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'config' && (
            <CampoConfigPanel campo={campo} onUpdate={onUpdate} onClose={onClose} hideHeader />
          )}
          {tab === 'estilo' && (
            <EstiloCamposForm value={estiloCampos} onChange={onChangeEstiloCampos} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-l border-border bg-card overflow-y-auto flex-shrink-0 transition-all duration-200',
        'hidden lg:block lg:w-72',
        showConfig && 'block absolute inset-y-0 right-0 w-72 z-20 shadow-lg lg:relative lg:shadow-none'
      )}
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {campo.label || campo.nome}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          {([
            { key: 'config' as TabType, label: 'Configuração' },
            { key: 'estilo' as TabType, label: 'Estilo' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors',
                tab === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'config' && (
          <CampoConfigPanel campo={campo} onUpdate={onUpdate} onClose={onClose} hideHeader />
        )}
        {tab === 'estilo' && (
          <EstiloCamposForm value={estiloCampos} onChange={onChangeEstiloCampos} />
        )}
      </div>
    </div>
  )
}
