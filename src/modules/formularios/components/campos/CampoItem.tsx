/**
 * AIDEV-NOTE: Componente de campo individual no preview do formulário
 * Renderiza o campo com aparência real + controles de edição
 * Suporta edição inline do label via double-click
 */

import { useState, useRef, useEffect } from 'react'
import { GripVertical, Trash2, Settings, ChevronUp, ChevronDown, Paintbrush, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampoFormulario } from '../../services/formularios.api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  onStyleEdit?: () => void
  onUpdateLabel?: (newLabel: string) => void
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
  onStyleEdit,
  onUpdateLabel,
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
      {/* Drag handle + Controls */}
      <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveUp() }}>
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveDown() }}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelect() }}>
          <Settings className="w-4 h-4" />
        </Button>
        {onStyleEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onStyleEdit() }} title="Editar estilos dos campos">
            <Paintbrush className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Field preview */}
      <div className="space-y-1.5 pl-4">
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
        {renderFieldPreview(campo)}
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
  }
  return map[tipo] || tipo
}

function renderFieldPreview(campo: CampoFormulario) {
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

    case 'titulo':
      return <p className="text-lg font-semibold text-foreground">{placeholder || 'Título da seção'}</p>

    case 'paragrafo':
      return <p className="text-sm text-muted-foreground">{placeholder || 'Texto descritivo do parágrafo.'}</p>

    case 'divisor':
      return <hr className="border-border" />

    case 'espacador':
      return <div className="h-6" />

    case 'bloco_html':
      return (
        <div className={cn(baseInputClass, 'font-mono text-xs bg-muted/30')}>
          {placeholder || '<p>Conteúdo HTML</p>'}
        </div>
      )

    case 'oculto':
      return <p className="text-xs text-muted-foreground italic">Campo oculto (não visível para o usuário)</p>

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
          <div className={baseInputClass}>{placeholder || 'Rua, número...'}</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className={baseInputClass}>Cidade</div>
            <div className={baseInputClass}>Estado</div>
          </div>
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
