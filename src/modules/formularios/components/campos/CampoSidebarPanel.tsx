/**
 * AIDEV-NOTE: Wrapper com abas Configuração/Estilo para o sidebar de campo
 * Edita estilo INDIVIDUAL por campo (salvo em validacoes.estilo_campo)
 * Merge: global defaults (estiloCampos) + overrides individuais
 * Botão "Aplicar em todos" copia estilo do campo para todos os outros
 */

import { useState, useMemo, useCallback } from 'react'
import { X, Copy } from 'lucide-react'
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
  /** Lista de todos os campos para "Aplicar em todos" */
  allCampos?: CampoFormulario[]
  /** Callback para atualizar um campo específico por ID */
  onUpdateCampoById?: (campoId: string, payload: Partial<CampoFormulario>) => void
  /** Renderizar como overlay fullscreen (mobile) */
  fullscreen?: boolean
}

/**
 * AIDEV-NOTE: Extrai o estilo individual do campo (validacoes.estilo_campo)
 * Retorna merged: global defaults + overrides do campo
 */
function getCampoEstiloIndividual(campo: CampoFormulario): Partial<EstiloCampos> {
  const validacoes = (campo.validacoes || {}) as Record<string, unknown>
  return (validacoes.estilo_campo || {}) as Partial<EstiloCampos>
}

function mergeEstilo(global: EstiloCampos, individual: Partial<EstiloCampos>): EstiloCampos {
  const merged = { ...global }
  for (const [key, val] of Object.entries(individual)) {
    if (val !== undefined && val !== null && val !== '') {
      (merged as any)[key] = val
    }
  }
  return merged
}

/**
 * AIDEV-NOTE: Seção de espaçamento individual por campo
 */
function EspacamentoCampo({ campo, onUpdate }: { campo: CampoFormulario; onUpdate: (payload: Partial<CampoFormulario>) => void }) {
  const validacoes = (campo.validacoes || {}) as Record<string, unknown>
  const getValue = (key: string, fallback: string) => String(validacoes[key] ?? fallback)
  const updateSpacing = (key: string, val: string) => {
    onUpdate({ validacoes: { ...validacoes, [key]: val } })
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Espaçamento do Campo
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Topo</Label>
          <Input value={getValue('spacing_top', '0')} onChange={(e) => updateSpacing('spacing_top', e.target.value)} placeholder="0" className="h-7 text-xs px-2" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Baixo</Label>
          <Input value={getValue('spacing_bottom', '0')} onChange={(e) => updateSpacing('spacing_bottom', e.target.value)} placeholder="0" className="h-7 text-xs px-2" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Esquerda</Label>
          <Input value={getValue('spacing_left', '0')} onChange={(e) => updateSpacing('spacing_left', e.target.value)} placeholder="0" className="h-7 text-xs px-2" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Direita</Label>
          <Input value={getValue('spacing_right', '0')} onChange={(e) => updateSpacing('spacing_right', e.target.value)} placeholder="0" className="h-7 text-xs px-2" />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Valores em px</p>
    </div>
  )
}

export function CampoSidebarPanel({ campo, onUpdate, onClose, showConfig, estiloCampos, onChangeEstiloCampos: _onChangeEstiloCampos, allCampos, onUpdateCampoById, fullscreen }: Props) {
  const [tab, setTab] = useState<TabType>('config')

  // AIDEV-NOTE: Estilo individual do campo, merged com global
  const campoEstiloIndividual = useMemo(() => getCampoEstiloIndividual(campo), [campo])
  const mergedEstilo = useMemo(() => mergeEstilo(estiloCampos, campoEstiloIndividual), [estiloCampos, campoEstiloIndividual])

  // Quando o user edita no form de estilo, salva como override individual no campo
  const handleEstiloChange = useCallback((newEstilo: EstiloCampos) => {
    // Calcular diff entre newEstilo e o global para salvar apenas os overrides
    const overrides: Partial<EstiloCampos> = {}
    for (const [key, val] of Object.entries(newEstilo)) {
      const globalVal = (estiloCampos as any)[key]
      if (val !== globalVal) {
        (overrides as any)[key] = val
      }
    }
    const validacoes = (campo.validacoes || {}) as Record<string, unknown>
    onUpdate({
      validacoes: { ...validacoes, estilo_campo: overrides },
    })
  }, [estiloCampos, campo.validacoes, onUpdate])

  // Aplicar estilo deste campo em todos os outros
  const handleApplyToAll = useCallback(() => {
    if (!allCampos || !onUpdateCampoById) return
    const validacoes = (campo.validacoes || {}) as Record<string, unknown>
    const estiloAtual = validacoes.estilo_campo || {}
    const spacingKeys = ['spacing_top', 'spacing_bottom', 'spacing_left', 'spacing_right']
    const spacingAtual: Record<string, unknown> = {}
    for (const k of spacingKeys) {
      if (validacoes[k] !== undefined) spacingAtual[k] = validacoes[k]
    }

    for (const c of allCampos) {
      if (c.id === campo.id) continue
      const cVal = (c.validacoes || {}) as Record<string, unknown>
      onUpdateCampoById(c.id, {
        validacoes: { ...cVal, estilo_campo: estiloAtual, ...spacingAtual },
      })
    }
  }, [campo, allCampos, onUpdateCampoById])

  const estiloContent = (
    <>
      <EstiloCamposForm value={mergedEstilo} onChange={handleEstiloChange} />
      <EspacamentoCampo campo={campo} onUpdate={onUpdate} />
      {allCampos && onUpdateCampoById && (
        <div className="pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={handleApplyToAll}
          >
            <Copy className="w-3.5 h-3.5" />
            Aplicar estilo em todos os campos
          </Button>
        </div>
      )}
    </>
  )

  const tabButtons = (
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
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-30 bg-card flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground truncate max-w-[240px]">
              {campo.label || campo.nome}
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {tabButtons}
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {campo.label || campo.nome}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {tabButtons}
        {tab === 'config' && (
          <CampoConfigPanel campo={campo} onUpdate={onUpdate} onClose={onClose} hideHeader />
        )}
        {tab === 'estilo' && estiloContent}
      </div>
    </div>
  )
}
