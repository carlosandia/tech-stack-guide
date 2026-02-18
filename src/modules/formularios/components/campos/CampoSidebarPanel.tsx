/**
 * AIDEV-NOTE: Wrapper com abas Configuração/Estilo para o sidebar de campo
 * Similar ao BotaoConfigPanel, unifica config e estilo em um único local
 * Inclui espaçamento individual por campo (salvo em validacoes)
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

/**
 * AIDEV-NOTE: Seção de espaçamento individual por campo
 * Os valores são salvos em campo.validacoes.spacing_*
 */
function EspacamentoCampo({ campo, onUpdate }: { campo: CampoFormulario; onUpdate: (payload: Partial<CampoFormulario>) => void }) {
  const validacoes = (campo.validacoes || {}) as Record<string, unknown>

  const getValue = (key: string, fallback: string) => String(validacoes[key] ?? fallback)

  const updateSpacing = (key: string, val: string) => {
    onUpdate({
      validacoes: { ...validacoes, [key]: val },
    })
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Espaçamento do Campo
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Topo</Label>
          <Input
            value={getValue('spacing_top', '0')}
            onChange={(e) => updateSpacing('spacing_top', e.target.value)}
            placeholder="0"
            className="h-7 text-xs px-2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Baixo</Label>
          <Input
            value={getValue('spacing_bottom', '0')}
            onChange={(e) => updateSpacing('spacing_bottom', e.target.value)}
            placeholder="0"
            className="h-7 text-xs px-2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Esquerda</Label>
          <Input
            value={getValue('spacing_left', '0')}
            onChange={(e) => updateSpacing('spacing_left', e.target.value)}
            placeholder="0"
            className="h-7 text-xs px-2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Direita</Label>
          <Input
            value={getValue('spacing_right', '0')}
            onChange={(e) => updateSpacing('spacing_right', e.target.value)}
            placeholder="0"
            className="h-7 text-xs px-2"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Valores em px</p>
    </div>
  )
}

export function CampoSidebarPanel({ campo, onUpdate, onClose, showConfig, estiloCampos, onChangeEstiloCampos, fullscreen }: Props) {
  const [tab, setTab] = useState<TabType>('config')

  const estiloContent = (
    <>
      <EstiloCamposForm value={estiloCampos} onChange={onChangeEstiloCampos} />
      <EspacamentoCampo campo={campo} onUpdate={onUpdate} />
    </>
  )

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
          {tab === 'estilo' && estiloContent}
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
        {tab === 'estilo' && estiloContent}
      </div>
    </div>
  )
}
