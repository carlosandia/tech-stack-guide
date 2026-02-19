/**
 * AIDEV-NOTE: Wrapper com abas Configuração/Estilo para o sidebar de campo
 * Edita estilo INDIVIDUAL por campo (salvo em validacoes.estilo_campo)
 * Merge: global defaults (estiloCampos) + overrides individuais
 * Botão "Aplicar em todos" copia estilo do campo para todos os outros
 * 
 * AIDEV-NOTE: Usa estado local (localCampo) para evitar delay de digitação.
 * O onUpdate para o servidor é debounced (800ms após parar de digitar).
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { X, Copy, Info, Files, Trash2 } from 'lucide-react'
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
  /** Callback para duplicar o campo */
  onDuplicate?: () => void
  /** Callback para excluir o campo */
  onRemove?: () => void
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
 * Usa estado local + onBlur para evitar requisições a cada keystroke
 */
function EspacamentoCampo({ campo, onUpdate }: { campo: CampoFormulario; onUpdate: (payload: Partial<CampoFormulario>) => void }) {
  const validacoes = (campo.validacoes || {}) as Record<string, unknown>
  const getValue = (key: string, fallback: string) => String(validacoes[key] ?? fallback)

  // Estado local para digitação fluída
  const [localValues, setLocalValues] = useState({
    spacing_top: getValue('spacing_top', '0'),
    spacing_bottom: getValue('spacing_bottom', '0'),
    spacing_left: getValue('spacing_left', '0'),
    spacing_right: getValue('spacing_right', '0'),
  })

  // Sync quando o campo muda (seleção de outro campo)
  useEffect(() => {
    setLocalValues({
      spacing_top: getValue('spacing_top', '0'),
      spacing_bottom: getValue('spacing_bottom', '0'),
      spacing_left: getValue('spacing_left', '0'),
      spacing_right: getValue('spacing_right', '0'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo.id])

  const handleLocalChange = (key: string, val: string) => {
    setLocalValues(prev => ({ ...prev, [key]: val }))
  }

  const handleBlur = (key: string) => {
    onUpdate({ validacoes: { ...validacoes, [key]: localValues[key as keyof typeof localValues] } })
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Espaçamento do Campo
      </p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: 'spacing_top', label: 'Topo' },
          { key: 'spacing_bottom', label: 'Baixo' },
          { key: 'spacing_left', label: 'Esquerda' },
          { key: 'spacing_right', label: 'Direita' },
        ] as const).map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{label}</Label>
            <Input
              value={localValues[key]}
              onChange={(e) => handleLocalChange(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              placeholder="0"
              className="h-7 text-xs px-2"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Valores em px</p>
    </div>
  )
}

export function CampoSidebarPanel({ campo, onUpdate, onClose, showConfig, estiloCampos, onChangeEstiloCampos: _onChangeEstiloCampos, allCampos, onUpdateCampoById, fullscreen, onDuplicate, onRemove }: Props) {
  const [tab, setTab] = useState<TabType>('config')

  // AIDEV-NOTE: Estado local do campo para digitação fluída sem delay
  const [localCampo, setLocalCampo] = useState<CampoFormulario>(campo)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync quando o campo selecionado muda (outro campo clicado)
  useEffect(() => {
    setLocalCampo(campo)
  }, [campo.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // AIDEV-NOTE: onUpdate local: atualiza estado imediatamente, debounce a mutation
  const handleLocalUpdate = useCallback((payload: Partial<CampoFormulario>) => {
    setLocalCampo(prev => {
      const next = { ...prev, ...payload }
      // Merge validacoes deeply
      if (payload.validacoes) {
        next.validacoes = {
          ...((prev.validacoes || {}) as Record<string, unknown>),
          ...((payload.validacoes || {}) as Record<string, unknown>),
        }
      }
      return next
    })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdate(payload)
    }, 800)
  }, [onUpdate])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // AIDEV-NOTE: Estilo individual do campo, merged com global — usa localCampo
  const campoEstiloIndividual = useMemo(() => getCampoEstiloIndividual(localCampo), [localCampo])
  const mergedEstilo = useMemo(() => mergeEstilo(estiloCampos, campoEstiloIndividual), [estiloCampos, campoEstiloIndividual])

  // Quando o user edita no form de estilo, salva como override individual no campo
  const handleEstiloChange = useCallback((newEstilo: EstiloCampos) => {
    const overrides: Partial<EstiloCampos> = {}
    for (const [key, val] of Object.entries(newEstilo)) {
      const globalVal = (estiloCampos as any)[key]
      if (val !== globalVal) {
        (overrides as any)[key] = val
      }
    }
    const validacoes = (localCampo.validacoes || {}) as Record<string, unknown>
    handleLocalUpdate({
      validacoes: { ...validacoes, estilo_campo: overrides },
    })
  }, [estiloCampos, localCampo.validacoes, handleLocalUpdate])

  // Aplicar estilo deste campo em todos os outros
  const handleApplyToAll = useCallback(() => {
    if (!allCampos || !onUpdateCampoById) return
    const validacoes = (localCampo.validacoes || {}) as Record<string, unknown>

    const estiloCompleto = { ...mergedEstilo }

    const spacingKeys = ['spacing_top', 'spacing_bottom', 'spacing_left', 'spacing_right']
    const spacingAtual: Record<string, unknown> = {}
    for (const k of spacingKeys) {
      if (validacoes[k] !== undefined) spacingAtual[k] = validacoes[k]
    }

    for (const c of allCampos) {
      if (c.id === localCampo.id) continue
      const cVal = (c.validacoes || {}) as Record<string, unknown>
      onUpdateCampoById(c.id, {
        validacoes: { ...cVal, estilo_campo: estiloCompleto, ...spacingAtual },
      })
    }
  }, [localCampo, allCampos, onUpdateCampoById, mergedEstilo])

  const configFooter = (onDuplicate || onRemove) ? (
    <div className="sticky bottom-0 border-t border-border bg-card p-3 mt-auto">
      <div className="flex gap-2">
        {onDuplicate && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1.5"
            onClick={onDuplicate}
          >
            <Files className="w-3.5 h-3.5" />
            Duplicar
          </Button>
        )}
        {onRemove && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  ) : null

  const estiloContent = (
    <>
      <EstiloCamposForm value={mergedEstilo} onChange={handleEstiloChange} />
      <EspacamentoCampo campo={localCampo} onUpdate={handleLocalUpdate} />
    </>
  )

  const applyAllFooter = allCampos && onUpdateCampoById ? (
    <div className="sticky bottom-0 border-t border-border bg-card p-3 mt-auto space-y-1.5">
      <Button
        size="sm"
        className="w-full text-xs gap-1.5 bg-success hover:bg-success/90"
        style={{ color: 'rgba(255,255,255,0.9)' }}
        onClick={handleApplyToAll}
      >
        <Copy className="w-3.5 h-3.5" />
        Aplicar estilo em todos os campos
      </Button>
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Info className="w-3 h-3 shrink-0" />
        Copia o estilo e espaçamento deste campo para todos os outros campos do formulário.
      </p>
    </div>
  ) : null

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
              {localCampo.label || localCampo.nome}
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {tabButtons}
          {tab === 'config' && (
            <CampoConfigPanel campo={localCampo} onUpdate={handleLocalUpdate} onClose={onClose} hideHeader />
          )}
          {tab === 'estilo' && estiloContent}
        </div>
        {tab === 'config' && configFooter}
        {tab === 'estilo' && applyAllFooter}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-l border-border bg-card flex-shrink-0 transition-all duration-200 flex flex-col',
        'hidden lg:flex lg:w-72',
        showConfig && 'flex absolute inset-y-0 right-0 w-72 z-20 shadow-lg lg:relative lg:shadow-none'
      )}
    >
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {localCampo.label || localCampo.nome}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {tabButtons}
        {tab === 'config' && (
          <CampoConfigPanel campo={localCampo} onUpdate={handleLocalUpdate} onClose={onClose} hideHeader />
        )}
        {tab === 'estilo' && estiloContent}
      </div>
      {tab === 'config' && configFooter}
      {tab === 'estilo' && applyAllFooter}
    </div>
  )
}
