/**
 * AIDEV-NOTE: Item individual na lista de conversas
 * Estilo WhatsApp Web: avatar, nome, preview, horário, badge canal, badge status, badge grupo/canal
 */

import { format, isToday, isYesterday } from 'date-fns'
import {
  Camera,
  Video,
  Mic,
  FileText,
  MapPin,
  User,
  BarChart3,
  Smile,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { Conversa } from '../services/conversas.api'

interface ConversaItemProps {
  conversa: Conversa
  isActive: boolean
  onClick: () => void
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

export function ConversaItem({ conversa, isActive, onClick }: ConversaItemProps) {
  const nome = conversa.contato?.nome || conversa.contato?.nome_fantasia || conversa.nome || 'Sem nome'
  const fotoUrl = conversa.contato?.foto_url || conversa.foto_url
  const hasUnread = conversa.mensagens_nao_lidas > 0
  const preview = getMessagePreview(conversa)
  const status = statusConfig[conversa.status] || statusConfig.aberta
  const tipoBadge = getTipoBadge(conversa.tipo)

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3.5 text-left transition-all duration-200 min-h-[56px]
        border-b border-border/50
        ${isActive
          ? 'bg-primary/5 border-l-2 border-l-primary'
          : 'hover:bg-accent/50 border-l-2 border-l-transparent'
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={nome}
            className="w-12 h-12 rounded-full object-cover"
          />
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
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
              {nome}
            </span>
            {tipoBadge && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${tipoBadge.className}`}>
                {tipoBadge.label}
              </span>
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
            {/* Status badge */}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
              {status.label}
            </span>
            {/* Unread badge */}
            {hasUnread && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                {conversa.mensagens_nao_lidas > 99 ? '99+' : conversa.mensagens_nao_lidas}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
