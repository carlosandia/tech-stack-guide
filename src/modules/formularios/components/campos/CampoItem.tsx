/**
 * AIDEV-NOTE: Componente de campo individual no editor do formulário
 * Usa renderFinalCampo para aparência real + controles de edição (hover)
 * Suporta edição inline do label via click
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { Trash2, Settings, ChevronUp, ChevronDown, Copy, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampoFormulario, EstiloCampos } from '../../services/formularios.api'
import { Button } from '@/components/ui/button'
import { renderFinalCampo, computeFieldStyles, PAISES_COMUNS, PhoneInputWithCountry } from '../../utils/renderFinalCampo'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { getMaskForType } from '../../utils/masks'

interface Props {
  campo: CampoFormulario
  isSelected: boolean
  isDragOver?: boolean
  onSelect: () => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onUpdateLabel?: (newLabel: string) => void
  onUpdatePlaceholder?: (newPlaceholder: string) => void
  onDuplicate?: () => void
  estiloCampos?: EstiloCampos
  fontFamily?: string
}

// AIDEV-NOTE: Tipos de campo que são botões (renderizados no rodapé, não aqui)
const BUTTON_TYPES = ['botao_enviar', 'botao_whatsapp']
// AIDEV-NOTE: Tipos de layout que não têm label editável separado (o conteúdo É o campo)
const LAYOUT_TYPES = ['titulo', 'paragrafo', 'divisor', 'espacador', 'bloco_html', 'oculto', 'imagem_link']
// AIDEV-NOTE: Tipos que renderizam label inline (checkbox com texto ao lado)
const INLINE_LABEL_TYPES = ['checkbox', 'checkbox_termos']

export const CampoItem = forwardRef<HTMLDivElement, Props>(function CampoItem({
  campo,
  isSelected,
  isDragOver,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onUpdateLabel,
  onUpdatePlaceholder,
  onDuplicate,
  estiloCampos,
  fontFamily: fontFamilyProp,
}, _ref) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState(campo.label || campo.nome)
  const inputRef = useRef<HTMLInputElement>(null)
  const [valor, setValor] = useState('')
  const [paisSelecionado, setPaisSelecionado] = useState<{ code: string; ddi: string; flag: string }>(
    PAISES_COMUNS.find(p => p.code === campo.valor_padrao) || PAISES_COMUNS[0]
  )

  const fontFamily = fontFamilyProp || "'Inter', system-ui, sans-serif"

  useEffect(() => {
    setLabelValue(campo.label || campo.nome)
  }, [campo.label, campo.nome])

  useEffect(() => {
    if (editingLabel && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingLabel])

  const handleLabelBlur = () => {
    setEditingLabel(false)
    const trimmed = labelValue.trim()
    if (trimmed && trimmed !== (campo.label || campo.nome) && onUpdateLabel) {
      onUpdateLabel(trimmed)
    }
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLabelBlur() }
    if (e.key === 'Escape') { setLabelValue(campo.label || campo.nome); setEditingLabel(false) }
  }

  const handleChange = useCallback((rawValue: string) => {
    const mask = getMaskForType(campo.tipo)
    setValor(mask ? mask(rawValue) : rawValue)
  }, [campo.tipo])

  const isLayout = LAYOUT_TYPES.includes(campo.tipo)
  const isButton = BUTTON_TYPES.includes(campo.tipo)

  // AIDEV-NOTE: Para campos de layout e botões, renderizar diretamente sem label editável separado
  // Para campos normais, renderizar com label editável + renderFinalCampo (sem label duplicado)

  const renderContent = () => {
    if (isButton) {
      // Renderizar botão com aparência final
      if (campo.tipo === 'botao_whatsapp') {
        return (
          <BotaoInlineEdit
            campo={campo}
            onUpdateLabel={onUpdatePlaceholder}
            icon={<WhatsAppIcon size={16} />}
            defaultText="Enviar via WhatsApp"
            style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
          />
        )
      }
      return (
        <BotaoInlineEdit
          campo={campo}
          onUpdateLabel={onUpdatePlaceholder}
          icon={null}
          defaultText="Enviar"
          className="bg-primary text-primary-foreground"
        />
      )
    }

    if (isLayout || INLINE_LABEL_TYPES.includes(campo.tipo)) {
      // Campos de layout e checkboxes: renderizar com renderFinalCampo direto
      return renderFinalCampo(campo, estiloCampos, fontFamily, valor, handleChange)
    }

    // Campos normais: label editável + corpo do campo via renderFinalCampo
    // Usamos renderFinalCampo que já inclui o label - mas precisamos interceptar o label para torná-lo editável
    const { labelStyle } = computeFieldStyles(campo, estiloCampos, fontFamily)

    return (
      <div>
        {/* Label editável */}
        {editingLabel ? (
          <input
            ref={inputRef}
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-b border-primary outline-none px-0 py-0 min-w-[60px]"
            style={{ ...labelStyle, width: `${Math.max(labelValue.length, 4)}ch`, marginBottom: '4px' }}
          />
        ) : (
          <span
            style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px', cursor: onUpdateLabel ? 'text' : 'default' }}
            onClick={(e) => {
              e.stopPropagation()
              if (onUpdateLabel) setEditingLabel(true)
            }}
            title={onUpdateLabel ? 'Clique para editar' : undefined}
          >
            {campo.label || campo.nome}
            {campo.obrigatorio && <span style={{ color: '#EF4444' }}> *</span>}
            {campo.texto_ajuda && (
              <span title={campo.texto_ajuda} style={{ cursor: 'help', display: 'inline-flex' }}>
                <Info style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
              </span>
            )}
          </span>
        )}
        {/* Corpo do campo (sem label - renderizado separadamente acima) */}
        <FieldBodyOnly
          campo={campo}
          estiloCampos={estiloCampos}
          fontFamily={fontFamily}
          valor={valor}
          onChange={handleChange}
          paisSelecionado={paisSelecionado}
          onPaisChange={setPaisSelecionado}
        />
      </div>
    )
  }

  const campoVal = (campo.validacoes || {}) as Record<string, unknown>
  const spacingStyle: React.CSSProperties = {
    paddingTop: `${campoVal.spacing_top || '0'}px`,
    paddingBottom: `${campoVal.spacing_bottom || '0'}px`,
    paddingLeft: `${campoVal.spacing_left || '0'}px`,
    paddingRight: `${campoVal.spacing_right || '0'}px`,
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onClick={onSelect}
      style={spacingStyle}
      className={cn(
        'group relative rounded-md transition-all cursor-pointer',
        isSelected && 'outline outline-2 outline-primary outline-offset-2 bg-primary/5',
        !isSelected && 'hover:bg-muted/30',
        isDragOver && 'outline-dashed outline-primary bg-primary/10'
      )}
    >
      {/* Controls - hover overlay */}
      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onMoveUp && (
          <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onMoveUp() }} title="Mover para cima">
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onMoveDown() }} title="Mover para baixo">
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        )}
        {onDuplicate && (
          <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicar campo">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
          <Settings className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 backdrop-blur-sm shadow-sm text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {renderContent()}
    </div>
  )
})
CampoItem.displayName = 'CampoItem'

/**
 * AIDEV-NOTE: Renderiza apenas o corpo do campo (sem label), para uso quando
 * o label é renderizado separadamente com edição inline
 */

function FieldBodyOnly({
  campo,
  estiloCampos,
  fontFamily,
  valor,
  onChange,
  paisSelecionado,
  onPaisChange,
}: {
  campo: CampoFormulario
  estiloCampos?: EstiloCampos
  fontFamily: string
  valor: string
  onChange: (v: string) => void
  paisSelecionado?: { code: string; ddi: string; flag: string }
  onPaisChange?: (p: { code: string; ddi: string; flag: string }) => void
}) {
  const { inputStyle } = computeFieldStyles(campo, estiloCampos, fontFamily)
  const placeholder = campo.placeholder || ''
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  switch (campo.tipo) {
    case 'area_texto':
      return <textarea style={{ ...inputStyle, height: '64px', resize: 'vertical' }} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={handleInput} />
    case 'checkbox':
      return null // checkbox renders label inline, handled by parent
    case 'checkbox_termos':
      return null
    case 'selecao':
    case 'selecao_multipla':
    case 'pais':
    case 'estado':
    case 'cidade':
      return (
        <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={handleInput}>
          <option value="">{placeholder || (campo.tipo === 'selecao_multipla' ? 'Selecione uma ou mais...' : 'Selecione...')}</option>
          {(campo.opcoes as string[] || []).map((op, i) => (
            <option key={i} value={op}>{typeof op === 'string' ? op : `Opção ${i + 1}`}</option>
          ))}
        </select>
      )
    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(campo.opcoes as string[] || ['Opção 1', 'Opção 2']).slice(0, 4).map((op, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: estiloCampos?.input_texto_cor || '#1F2937', fontFamily, cursor: 'pointer' }}>
              <input type="radio" name={campo.id} checked={valor === op} onChange={() => onChange(typeof op === 'string' ? op : `Opção ${i + 1}`)} />
              {typeof op === 'string' ? op : `Opção ${i + 1}`}
            </label>
          ))}
        </div>
      )
    case 'data':
      return <input type="date" style={inputStyle} value={valor} onChange={handleInput} />
    case 'data_hora':
      return <input type="datetime-local" style={inputStyle} value={valor} onChange={handleInput} />
    case 'hora':
      return <input type="time" style={inputStyle} value={valor} onChange={handleInput} />
    case 'moeda':
    case 'cpf':
    case 'cnpj':
    case 'cep':
      return <input style={inputStyle} placeholder={placeholder || ''} value={valor} onChange={handleInput} />
    case 'telefone':
    case 'telefone_br':
      return (
        <PhoneInputWithCountry
          inputStyle={inputStyle}
          placeholder={placeholder}
          valor={valor}
          onChange={onChange}
          paisSelecionado={paisSelecionado}
          onPaisChange={onPaisChange}
        />
      )
    case 'numero':
      return <input type="number" style={inputStyle} placeholder={placeholder || '0'} value={valor} onChange={handleInput} />
    case 'url':
      return <input type="url" style={inputStyle} placeholder={placeholder || 'https://'} value={valor} onChange={handleInput} />
    case 'email':
      return <input type="email" style={inputStyle} placeholder={placeholder || 'email@exemplo.com'} value={valor} onChange={handleInput} />
    case 'endereco':
      return (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder={placeholder || 'Rua / Logradouro'} value={valor} onChange={handleInput} />
            <input style={{ ...inputStyle, flex: 0, width: '80px', minWidth: '70px' }} placeholder="Nº" />
          </div>
          <input style={inputStyle} placeholder="Complemento" />
        </div>
      )
    case 'avaliacao':
      return (
        <div style={{ display: 'flex', gap: '4px', fontSize: '20px', color: '#FBBF24', cursor: 'pointer' }}>
          {'★★★★★'.split('').map((s, i) => <span key={i} onClick={() => onChange(String(i + 1))}>{s}</span>)}
        </div>
      )
    case 'nps':
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} onClick={() => onChange(String(i))} style={{ ...inputStyle, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '12px', textAlign: 'center' as const, cursor: 'pointer', backgroundColor: valor === String(i) ? '#3B82F6' : inputStyle.backgroundColor, color: valor === String(i) ? '#FFFFFF' : inputStyle.color }}>{i}</span>
          ))}
        </div>
      )
    case 'slider':
      return <input type="range" style={{ width: '100%' }} value={valor || '50'} onChange={handleInput} />
    case 'assinatura':
      return (
        <div style={{ ...inputStyle, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: estiloCampos?.input_texto_cor || '#9CA3AF' }}>
          Área de assinatura
        </div>
      )
    case 'cor':
      return <input type="color" style={{ width: '48px', height: '32px', border: 'none', cursor: 'pointer' }} value={valor || '#000000'} onChange={handleInput} />
    case 'ranking':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(campo.opcoes as string[] || ['Item 1', 'Item 2', 'Item 3']).map((item, i) => (
            <div key={i} style={{ ...inputStyle, padding: '6px 12px' }}>{i + 1}. {typeof item === 'string' ? item : `Item ${i + 1}`}</div>
          ))}
        </div>
      )
    case 'arquivo':
    case 'imagem':
    case 'documento':
    case 'upload_video':
    case 'upload_audio':
      return (
        <div style={{ ...inputStyle, padding: '12px', textAlign: 'center' as const, color: estiloCampos?.input_texto_cor || '#9CA3AF', borderStyle: 'dashed', cursor: 'pointer' }}>
          Clique ou arraste para enviar
        </div>
      )
    default:
      return <input style={inputStyle} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={handleInput} />
  }
}

/** Inline edit for button text */
function BotaoInlineEdit({ campo, onUpdateLabel, icon, defaultText, className, style }: {
  campo: CampoFormulario
  onUpdateLabel?: (v: string) => void
  icon: React.ReactNode
  defaultText: string
  className?: string
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(campo.placeholder || defaultText)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setText(campo.placeholder || defaultText) }, [campo.placeholder, defaultText])
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = text.trim()
    if (trimmed && trimmed !== (campo.placeholder || defaultText) && onUpdateLabel) {
      onUpdateLabel(trimmed)
    }
  }

  if (editing) {
    return (
      <div className={cn('w-full rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2', className)} style={style}>
        {icon}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') { setText(campo.placeholder || defaultText); setEditing(false) } }}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-b border-current outline-none text-center min-w-[60px]"
          style={{ width: `${Math.max(text.length, 4)}ch`, color: 'inherit' }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      className={cn('w-full rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-text', className)}
      style={style}
      onClick={(e) => { e.stopPropagation(); if (onUpdateLabel) setEditing(true) }}
      title="Clique para editar o texto"
    >
      {icon}
      {campo.placeholder || defaultText}
    </button>
  )
}
