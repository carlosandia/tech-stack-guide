/**
 * AIDEV-NOTE: Item individual na lista de conversas
 * Estilo WhatsApp Web: avatar, nome, preview, horário, badge canal, badge status, badge grupo/canal
 * Inclui menu de contexto (chevron hover) com arquivar, fixar, marcar não lida, apagar
 */

import { useState, useEffect, useRef, forwardRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import {
  Camera, Video, Mic, FileText, MapPin, User, BarChart3, Smile,
  ChevronDown, Archive, ArchiveRestore, Pin, PinOff, Eye, Trash2, BellOff,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { LabelBadge } from './LabelBadge'
import type { Conversa } from '../services/conversas.api'

interface ConversaItemProps {
  conversa: Conversa
  isActive: boolean
  onClick: () => void
  onArquivar?: (id: string) => void
  onFixar?: (id: string, fixar: boolean) => void
  onMarcarNaoLida?: (id: string) => void
  onApagar?: (id: string) => void
}

function formatTimestamp(dateStr?: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Ontem'
  return format(date, 'dd/MM')
}

function getMessagePreview(conversa: Conversa): { icon?: React.ReactNode; text: string } {
  const msg = conversa.ultima_mensagem
  if (!msg) return { text: 'Nenhuma mensagem' }

  const prefix = msg.from_me ? 'Você: ' : ''

  switch (msg.tipo) {
    case 'image':
      return { icon: <Camera className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Foto` }
    case 'video':
      return { icon: <Video className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Vídeo` }
    case 'audio':
      return { icon: <Mic className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Áudio` }
    case 'document':
      return { icon: <FileText className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Documento` }
    case 'location':
      return { icon: <MapPin className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Localização` }
    case 'contact':
      return { icon: <User className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Contato` }
    case 'poll':
      return { icon: <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Enquete` }
    case 'sticker':
      return { icon: <Smile className="w-3.5 h-3.5 flex-shrink-0" />, text: `${prefix}Sticker` }
    default:
      return { text: `${prefix}${(msg.body || '').slice(0, 50)}` }
  }
}

function getInitials(nome?: string | null): string {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return avatarColors[hash % avatarColors.length]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  aberta: { label: 'Aberta', className: 'bg-success-muted text-success-foreground' },
  pendente: { label: 'Pendente', className: 'bg-warning-muted text-warning-foreground' },
  fechada: { label: 'Fechada', className: 'bg-muted text-muted-foreground' },
}

function getTipoBadge(tipo: string): { label: string; className: string } | null {
  if (tipo === 'grupo') return { label: 'Grupo', className: 'bg-blue-100 text-blue-700' }
  if (tipo === 'canal') return { label: 'Canal', className: 'bg-purple-100 text-purple-700' }
  return null
}

export const ConversaItem = forwardRef<HTMLDivElement, ConversaItemProps>(function ConversaItem({ conversa, isActive, onClick, onArquivar, onFixar, onMarcarNaoLida, onApagar }, _ref) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  // AIDEV-NOTE: Grupos/canais priorizam conversa.nome (nome real do grupo) sobre contato.nome (ID numérico)
  const nome = (conversa.tipo === 'grupo' || conversa.tipo === 'canal')
    ? (conversa.nome || conversa.contato?.nome || 'Sem nome')
    : (conversa.contato?.nome || conversa.contato?.nome_fantasia || conversa.nome || 'Sem nome')
  const fotoUrl = conversa.contato?.foto_url || conversa.foto_url
  const hasUnread = conversa.mensagens_nao_lidas > 0
  const preview = getMessagePreview(conversa)
  const status = statusConfig[conversa.status] || statusConfig.aberta
  const tipoBadge = getTipoBadge(conversa.tipo)
  const labels = conversa.labels || []
  const visibleLabels = labels.slice(0, 1)
  const extraLabelsCount = labels.length - visibleLabels.length

  // AIDEV-NOTE: Fecha o menu ao clicar fora - usa document listener como backup do backdrop
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="relative group">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        className={`
          w-full flex items-center gap-3 px-3 py-3.5 text-left transition-all duration-200 min-h-[56px]
          border-b border-border/50 cursor-pointer
          ${isActive
            ? 'bg-primary/5 border-l-2 border-l-primary'
            : 'hover:bg-accent/50 border-l-2 border-l-transparent'
          }
        `}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {fotoUrl ? (
            <img src={fotoUrl} alt={nome} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(conversa.id)}`}>
              {getInitials(nome)}
            </div>
          )}
          {/* Canal badge */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {conversa.canal === 'whatsapp' ? (
              <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
                <WhatsAppIcon size={11} className="text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            )}
          </div>
          {/* Pin indicator */}
          {conversa.fixada && (
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Pin className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className={`text-sm flex-shrink-0 max-w-[45%] truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                {nome}
              </span>
              {conversa.silenciada && <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              {tipoBadge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${tipoBadge.className}`}>
                  {tipoBadge.label}
                </span>
              )}
              {visibleLabels.map(cl => (
                <LabelBadge
                  key={cl.id}
                  nome={cl.whatsapp_labels.nome}
                  corHex={cl.whatsapp_labels.cor_hex}
                  compact
                  maxWidth="90px"
                />
              ))}
              {extraLabelsCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="px-1 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted flex-shrink-0 hover:bg-accent transition-colors cursor-pointer"
                    >
                      +{extraLabelsCount}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    className="w-auto max-w-[250px] p-2 flex flex-wrap gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {labels.slice(1).map(cl => (
                      <LabelBadge
                        key={cl.id}
                        nome={cl.whatsapp_labels.nome}
                        corHex={cl.whatsapp_labels.cor_hex}
                        size="md"
                      />
                    ))}
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatTimestamp(conversa.ultima_mensagem_em)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className={`flex items-center gap-1 text-xs truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {preview.icon}
              <span className="truncate">{preview.text}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
                {status.label}
              </span>
              {hasUnread && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                  {conversa.mensagens_nao_lidas > 99 ? '99+' : conversa.mensagens_nao_lidas}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu trigger + popover */}
      <div ref={menuRef} className="absolute right-2 top-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className={`p-1 rounded bg-background/90 border border-border/50 shadow-sm hover:bg-accent transition-all ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Context menu popover */}
        {menuOpen && (
          <div className="absolute right-0 top-8 w-48 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onArquivar?.(conversa.id) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {conversa.arquivada ? (
                <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Archive className="w-4 h-4 text-muted-foreground" />
              )}
              {conversa.arquivada ? 'Desarquivar conversa' : 'Arquivar conversa'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onFixar?.(conversa.id, !conversa.fixada) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {conversa.fixada ? <PinOff className="w-4 h-4 text-muted-foreground" /> : <Pin className="w-4 h-4 text-muted-foreground" />}
              {conversa.fixada ? 'Desafixar conversa' : 'Fixar conversa'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMarcarNaoLida?.(conversa.id) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
              Marcar como não lida
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onApagar?.(conversa.id) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Apagar conversa
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
ConversaItem.displayName = 'ConversaItem'
