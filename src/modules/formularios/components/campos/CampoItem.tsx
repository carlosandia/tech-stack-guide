/**
 * AIDEV-NOTE: Componente de campo individual no preview do formulário
 * Renderiza o campo com aparência real + controles de edição
 * Suporta edição inline do label via double-click
 */

import { useState, useRef, useEffect } from 'react'
import { Trash2, Settings, ChevronDown, ChevronUp, Info, MousePointerClick, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampoFormulario } from '../../services/formularios.api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'

function parseLayoutConfig(valorPadrao: string | null | undefined, tipo: string): Record<string, string> {
  if (tipo === 'titulo' || tipo === 'paragrafo') {
    const defaults = { alinhamento: 'left', cor: '#374151', tamanho: tipo === 'titulo' ? '18' : '14' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { alinhamento: p.alinhamento || defaults.alinhamento, cor: p.cor || defaults.cor, tamanho: p.tamanho || defaults.tamanho } } catch { return defaults }
  }
  if (tipo === 'divisor') {
    const defaults = { cor: '#D1D5DB', espessura: '1', estilo: 'solid' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { cor: p.cor || defaults.cor, espessura: p.espessura || defaults.espessura, estilo: p.estilo || defaults.estilo } } catch { return defaults }
  }
  if (tipo === 'espacador') {
    const defaults = { altura: '16' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { altura: p.altura || defaults.altura } } catch { return defaults }
  }
  return {}
}


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
}

export function CampoItem({
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
}: Props) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState(campo.label || campo.nome)
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLabelBlur()
    }
    if (e.key === 'Escape') {
      setLabelValue(campo.label || campo.nome)
      setEditingLabel(false)
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onClick={onSelect}
      className={cn(
        'group relative border rounded-lg p-3 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/30',
        isDragOver && 'border-primary border-dashed bg-primary/10'
      )}
    >
      {/* Controls - move arrows, gear (opens config sidebar) and delete */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveUp() }} title="Mover para cima">
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveDown() }} title="Mover para baixo">
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
        {onDuplicate && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicar campo">
            <Copy className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelect() }}>
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Field preview */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {editingLabel ? (
            <input
              ref={inputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-foreground bg-transparent border-b border-primary outline-none px-0 py-0 min-w-[60px]"
              style={{ width: `${Math.max(labelValue.length, 4)}ch` }}
            />
          ) : (
            <label
              className="text-sm font-medium text-foreground flex items-center gap-1 cursor-text hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                if (onUpdateLabel) setEditingLabel(true)
              }}
              title={onUpdateLabel ? 'Clique para editar' : undefined}
            >
              {campo.label || campo.nome}
              {campo.obrigatorio && <span className="text-destructive ml-0.5">*</span>}
              {campo.texto_ajuda && (
                <span title={campo.texto_ajuda} className="cursor-help">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
              )}
            </label>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {getLabelTipo(campo.tipo)}
          </Badge>
        </div>
        {renderFieldPreview(campo, onUpdatePlaceholder)}
      </div>
    </div>
  )
}

function getLabelTipo(tipo: string): string {
  const map: Record<string, string> = {
    texto: 'Texto', area_texto: 'Texto Longo', email: 'Email', telefone: 'Telefone',
    telefone_br: 'Tel BR', numero: 'Número', moeda: 'Moeda', url: 'URL',
    selecao: 'Select', selecao_multipla: 'Multi', radio: 'Radio', checkbox: 'Checkbox',
    data: 'Data', data_hora: 'Data/Hora', hora: 'Hora',
    cpf: 'CPF', cnpj: 'CNPJ', cep: 'CEP',
    endereco: 'Endereço', pais: 'País', estado: 'Estado', cidade: 'Cidade',
    arquivo: 'Anexo', imagem: 'Imagem', documento: 'Doc', upload_video: 'Vídeo', upload_audio: 'Áudio',
    avaliacao: 'Avaliação', nps: 'NPS', slider: 'Slider', assinatura: 'Assinatura',
    cor: 'Cor', ranking: 'Ranking', checkbox_termos: 'Termos', oculto: 'Oculto',
    titulo: 'Título', paragrafo: 'Parágrafo', divisor: 'Divisor', espacador: 'Espaçador',
    bloco_html: 'HTML',
    botao_enviar: 'Botão', botao_whatsapp: 'WhatsApp',
  }
  return map[tipo] || tipo
}

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

function renderFieldPreview(campo: CampoFormulario, onUpdateLabel?: (v: string) => void) {
  const placeholder = campo.placeholder || ''
  const baseInputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground pointer-events-none'

  switch (campo.tipo) {
    case 'area_texto':
      return <div className={cn(baseInputClass, 'h-16 resize-none')}>{placeholder || 'Digite aqui...'}</div>

    case 'selecao':
    case 'pais':
    case 'estado':
    case 'cidade':
      return (
        <div className={cn(baseInputClass, 'flex items-center justify-between')}>
          <span>{placeholder || 'Selecione...'}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      )

    case 'selecao_multipla':
      return (
        <div className={cn(baseInputClass, 'flex items-center justify-between')}>
          <span>{placeholder || 'Selecione uma ou mais...'}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      )

    case 'checkbox':
    case 'checkbox_termos':
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-input bg-background" />
          <span className="text-sm text-muted-foreground">{placeholder || (campo.tipo === 'checkbox_termos' ? 'Aceito os termos' : 'Opção')}</span>
        </div>
      )

    case 'radio':
      return (
        <div className="space-y-1">
          {(campo.opcoes as string[] || ['Opção 1', 'Opção 2']).slice(0, 3).map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-input bg-background" />
              <span className="text-sm text-muted-foreground">{typeof op === 'string' ? op : `Opção ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )

    case 'avaliacao':
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="text-lg text-muted-foreground/40">★</span>
          ))}
        </div>
      )

    case 'nps':
      return (
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className="w-7 h-7 rounded border border-input bg-background flex items-center justify-center text-xs text-muted-foreground">
              {i}
            </div>
          ))}
        </div>
      )

    case 'slider':
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">0</span>
          <div className="flex-1 h-2 rounded-full bg-muted">
            <div className="h-2 w-1/2 rounded-full bg-primary" />
          </div>
          <span className="text-xs text-muted-foreground">100</span>
        </div>
      )

    case 'arquivo':
    case 'imagem':
    case 'documento':
    case 'upload_video':
    case 'upload_audio':
      return (
        <div className="border-2 border-dashed border-input rounded-md p-4 text-center">
          <p className="text-xs text-muted-foreground">Arraste ou clique para enviar</p>
        </div>
      )

    case 'assinatura':
      return (
        <div className="border border-input rounded-md h-20 bg-background flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Área de assinatura</span>
        </div>
      )

    case 'cor':
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-input bg-primary" />
          <span className="text-sm text-muted-foreground">#3B82F6</span>
        </div>
      )

    case 'ranking':
      return (
        <div className="space-y-1">
          {(campo.opcoes as string[] || ['Item 1', 'Item 2', 'Item 3']).slice(0, 3).map((op, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 rounded border border-input bg-background">
              <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}.</span>
              <span className="text-sm text-muted-foreground">{typeof op === 'string' ? op : `Item ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )

    case 'titulo': {
      const tc = parseLayoutConfig(campo.valor_padrao, 'titulo')
      return <p className="font-semibold text-foreground" style={{ fontSize: `${tc.tamanho}px`, textAlign: tc.alinhamento as any, color: tc.cor }}>{placeholder || 'Título da seção'}</p>
    }

    case 'paragrafo': {
      const pc = parseLayoutConfig(campo.valor_padrao, 'paragrafo')
      return <p className="text-muted-foreground" style={{ fontSize: `${pc.tamanho}px`, textAlign: pc.alinhamento as any, color: pc.cor }}>{placeholder || 'Texto descritivo do parágrafo.'}</p>
    }

    case 'divisor': {
      const dc = parseLayoutConfig(campo.valor_padrao, 'divisor')
      return <hr style={{ border: 'none', borderTop: `${dc.espessura}px ${dc.estilo} ${dc.cor}` }} />
    }

    case 'espacador': {
      const ec = parseLayoutConfig(campo.valor_padrao, 'espacador')
      return <div style={{ height: `${ec.altura}px` }} />
    }

    case 'bloco_html':
      return (
        <div className={cn(baseInputClass, 'font-mono text-xs bg-muted/30')}>
          {placeholder || '<p>Conteúdo HTML</p>'}
        </div>
      )

    case 'oculto':
      return <p className="text-xs text-muted-foreground italic">Campo oculto (não visível para o usuário)</p>

    case 'botao_enviar':
      return <BotaoInlineEdit campo={campo} onUpdateLabel={onUpdateLabel} icon={<MousePointerClick className="w-4 h-4" />} defaultText="Enviar" className="bg-primary text-primary-foreground" />

    case 'botao_whatsapp':
      return <BotaoInlineEdit campo={campo} onUpdateLabel={onUpdateLabel} icon={<WhatsAppIcon size={16} />} defaultText="Enviar via WhatsApp" style={{ backgroundColor: '#25D366', color: '#FFFFFF' }} />

    case 'cpf':
      return <div className={baseInputClass}>{placeholder || '000.000.000-00'}</div>

    case 'cnpj':
      return <div className={baseInputClass}>{placeholder || '00.000.000/0000-00'}</div>

    case 'cep':
      return <div className={baseInputClass}>{placeholder || '00000-000'}</div>

    case 'moeda':
      return <div className={baseInputClass}>{placeholder || 'R$ 0,00'}</div>

    case 'telefone_br':
      return <div className={baseInputClass}>{placeholder || '(00) 00000-0000'}</div>

    case 'endereco':
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_80px] gap-1.5">
            <div className={baseInputClass}>{placeholder || 'Rua / Logradouro'}</div>
            <div className={baseInputClass}>Nº</div>
          </div>
          <div className={baseInputClass}>Complemento</div>
        </div>
      )

    case 'data':
      return <div className={cn(baseInputClass, 'flex items-center')}>{placeholder || 'dd/mm/aaaa'}</div>

    case 'data_hora':
      return <div className={cn(baseInputClass, 'flex items-center')}>{placeholder || 'dd/mm/aaaa hh:mm'}</div>

    case 'hora':
      return <div className={cn(baseInputClass, 'flex items-center')}>{placeholder || 'hh:mm'}</div>

    default:
      return <div className={baseInputClass}>{placeholder || 'Digite aqui...'}</div>
  }
}
