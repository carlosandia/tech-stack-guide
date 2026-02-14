/**
 * AIDEV-NOTE: Paleta lateral de tipos de campo disponíveis para drag-and-drop
 * O usuário arrasta um tipo de campo da paleta e solta no preview
 */

import { cn } from '@/lib/utils'
import {
  Type, AlignLeft, Hash, Calendar, CalendarClock, Clock,
  ToggleLeft, List, ListChecks, Mail, Phone, Globe, FileText,
  CreditCard, Building2, MapPin, Paperclip, Image, Star,
  SlidersHorizontal, Minus, Space, Code, CheckSquare,
  FileAudio, FileVideo, Pen, BarChart3, MessageSquare, Search,
  Palette, Map, Columns, Plus
} from 'lucide-react'

export interface TipoCampoPaleta {
  tipo: string
  label: string
  icon: React.ElementType
  categoria: 'basico' | 'avancado' | 'layout' | 'especial'
}

export const TIPOS_CAMPO: TipoCampoPaleta[] = [
  // Básicos
  { tipo: 'texto', label: 'Texto', icon: Type, categoria: 'basico' },
  { tipo: 'area_texto', label: 'Texto Longo', icon: AlignLeft, categoria: 'basico' },
  { tipo: 'email', label: 'Email', icon: Mail, categoria: 'basico' },
  { tipo: 'telefone', label: 'Telefone', icon: Phone, categoria: 'basico' },
  { tipo: 'telefone_br', label: 'Telefone BR', icon: Phone, categoria: 'basico' },
  { tipo: 'numero', label: 'Número', icon: Hash, categoria: 'basico' },
  { tipo: 'moeda', label: 'Moeda (R$)', icon: CreditCard, categoria: 'basico' },
  { tipo: 'url', label: 'URL', icon: Globe, categoria: 'basico' },

  // Seleção
  { tipo: 'selecao', label: 'Lista Suspensa', icon: List, categoria: 'basico' },
  { tipo: 'selecao_multipla', label: 'Múltipla Escolha', icon: ListChecks, categoria: 'basico' },
  { tipo: 'radio', label: 'Opções (Radio)', icon: ToggleLeft, categoria: 'basico' },
  { tipo: 'checkbox', label: 'Checkbox', icon: CheckSquare, categoria: 'basico' },

  // Data/Hora
  { tipo: 'data', label: 'Data', icon: Calendar, categoria: 'basico' },
  { tipo: 'data_hora', label: 'Data e Hora', icon: CalendarClock, categoria: 'basico' },
  { tipo: 'hora', label: 'Hora', icon: Clock, categoria: 'basico' },

  // Documentos BR
  { tipo: 'cpf', label: 'CPF', icon: CreditCard, categoria: 'avancado' },
  { tipo: 'cnpj', label: 'CNPJ', icon: Building2, categoria: 'avancado' },
  { tipo: 'cep', label: 'CEP', icon: MapPin, categoria: 'avancado' },

  // Endereço / Maps
  { tipo: 'endereco', label: 'Endereço', icon: MapPin, categoria: 'avancado' },
  { tipo: 'pais', label: 'País', icon: Globe, categoria: 'avancado' },
  { tipo: 'estado', label: 'Estado', icon: Map, categoria: 'avancado' },
  { tipo: 'cidade', label: 'Cidade', icon: Map, categoria: 'avancado' },

  // Uploads
  { tipo: 'arquivo', label: 'Anexo/Arquivo', icon: Paperclip, categoria: 'avancado' },
  { tipo: 'imagem', label: 'Upload Imagem', icon: Image, categoria: 'avancado' },
  { tipo: 'documento', label: 'Documento', icon: FileText, categoria: 'avancado' },
  { tipo: 'upload_video', label: 'Upload Vídeo', icon: FileVideo, categoria: 'avancado' },
  { tipo: 'upload_audio', label: 'Upload Áudio', icon: FileAudio, categoria: 'avancado' },

  // Avançados
  { tipo: 'avaliacao', label: 'Avaliação (★)', icon: Star, categoria: 'especial' },
  { tipo: 'nps', label: 'NPS (0-10)', icon: BarChart3, categoria: 'especial' },
  { tipo: 'slider', label: 'Slider', icon: SlidersHorizontal, categoria: 'especial' },
  { tipo: 'assinatura', label: 'Assinatura', icon: Pen, categoria: 'especial' },
  { tipo: 'cor', label: 'Seletor de Cor', icon: Palette, categoria: 'especial' },
  { tipo: 'ranking', label: 'Ranking', icon: BarChart3, categoria: 'especial' },
  { tipo: 'checkbox_termos', label: 'Termos de Uso', icon: CheckSquare, categoria: 'especial' },
  { tipo: 'oculto', label: 'Campo Oculto', icon: Search, categoria: 'especial' },

  // Layout
  { tipo: 'titulo', label: 'Título', icon: Type, categoria: 'layout' },
  { tipo: 'paragrafo', label: 'Parágrafo', icon: MessageSquare, categoria: 'layout' },
  { tipo: 'imagem_link', label: 'Imagem c/ Link', icon: Image, categoria: 'layout' },
  { tipo: 'divisor', label: 'Divisor', icon: Minus, categoria: 'layout' },
  { tipo: 'espacador', label: 'Espaçador', icon: Space, categoria: 'layout' },
  { tipo: 'bloco_html', label: 'Bloco HTML', icon: Code, categoria: 'layout' },
  { tipo: 'bloco_colunas', label: 'Colunas', icon: Columns, categoria: 'layout' },
]

const CATEGORIAS = [
  { key: 'basico', label: 'Campos Básicos' },
  { key: 'avancado', label: 'Avançados' },
  { key: 'especial', label: 'Especiais' },
  { key: 'layout', label: 'Layout' },
] as const

interface Props {
  className?: string
  onAddCampo?: (tipo: TipoCampoPaleta) => void
}

export function CamposPaleta({ className, onAddCampo }: Props) {
  const handleDragStart = (e: React.DragEvent, tipo: TipoCampoPaleta) => {
    e.dataTransfer.setData('application/campo-tipo', JSON.stringify(tipo))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className={cn('space-y-4 overflow-y-auto', className)}>
      <h3 className="text-sm font-semibold text-foreground px-1">Campos</h3>

      {CATEGORIAS.map((cat) => {
        const campos = TIPOS_CAMPO.filter((c) => c.categoria === cat.key)
        return (
          <div key={cat.key} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-1.5 pr-1 pt-1">
              {campos.map((campo) => {
                const Icon = campo.icon
                return (
                  <div
                    key={campo.tipo}
                    draggable
                    onDragStart={(e) => handleDragStart(e, campo)}
                    onClick={() => onAddCampo?.(campo)}
                    className={cn(
                      'group relative flex items-center gap-2 px-2 py-2 rounded-md border transition-colors text-xs select-none',
                      'border-border bg-card cursor-pointer hover:border-primary/50 hover:bg-accent active:cursor-grabbing'
                    )}
                    title={campo.label}
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-foreground">{campo.label}</span>
                    <span
                      className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-primary text-primary-foreground
                                 flex items-center justify-center opacity-0 group-hover:opacity-100
                                 transition-opacity duration-150 shadow-sm pointer-events-none"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
