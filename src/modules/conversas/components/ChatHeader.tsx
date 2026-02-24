/**
 * AIDEV-NOTE: Header da janela de chat
 * Avatar, nome do contato, ações (status, drawer, tarefas, criar oportunidade, buscar)
 * Menu expandido: silenciar, limpar conversa, apagar conversa
 */

import { ArrowLeft, MoreVertical, CircleDot, Search, Plus, BellOff, Bell, Trash2, Eraser, Timer, Tag } from 'lucide-react'
import { useState, useRef, useEffect, forwardRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createPortal } from 'react-dom'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { TarefasConversaPopover } from './TarefasConversaPopover'
import { LabelBadge } from './LabelBadge'
import { LabelsPopover } from './LabelsPopover'
import { useLabelsConversa } from '../hooks/useWhatsAppLabels'
import { usePresence } from '../hooks/usePresence'
import { toast } from 'sonner'
import type { Conversa } from '../services/conversas.api'
import { getValidWhatsAppUrl } from '@/shared/utils/whatsapp-url'

interface ChatHeaderProps {
  conversa: Conversa
  onBack: () => void
  onOpenDrawer: () => void
  onAlterarStatus: (status: 'aberta' | 'pendente' | 'fechada') => void
  onCriarOportunidade?: () => void
  onToggleBusca?: () => void
  onSilenciar?: (silenciar: boolean) => void
  onLimparConversa?: () => void
  onApagarConversa?: () => void
}

const statusLabels: Record<string, { label: string; className: string }> = {
  aberta: { label: 'Aberta', className: 'bg-success-muted text-success-foreground' },
  pendente: { label: 'Pendente', className: 'bg-warning-muted text-warning-foreground' },
  fechada: { label: 'Fechada', className: 'bg-muted text-muted-foreground' },
}

function getInitials(nome?: string | null): string {
  if (!nome) return '?'
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

/** Portal-based menu dropdown to avoid z-index issues inside modals */
const MenuDropdown = forwardRef<HTMLDivElement, {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  conversa: Conversa
  onAlterarStatus: (s: 'aberta' | 'pendente' | 'fechada') => void
  onSilenciar: () => void
  onLimpar: () => void
  onApagar: () => void
}>(function MenuDropdown({
  isOpen, onToggle, onClose, conversa,
  onAlterarStatus, onSilenciar, onLimpar, onApagar,
}, _ref) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={onToggle}
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
      >
        <MoreVertical className="w-4.5 h-4.5 text-muted-foreground" />
      </button>

      {isOpen && pos && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose} />
          <div
            ref={menuRef}
            className="fixed w-52 bg-popover border border-border rounded-md shadow-xl py-1"
            style={{ top: pos.top, right: pos.right, zIndex: 9999 }}
          >
            <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase">
              Alterar status
            </p>
            {(['aberta', 'pendente', 'fechada'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onAlterarStatus(s)}
                disabled={conversa.status === s}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-all duration-200 disabled:opacity-40 ${
                  conversa.status === s ? 'text-primary font-medium' : 'text-foreground'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" />
                {statusLabels[s].label}
              </button>
            ))}

            <div className="h-px bg-border my-1" />

            <button
              onClick={onSilenciar}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {conversa.silenciada ? <Bell className="w-4 h-4 text-muted-foreground" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              {conversa.silenciada ? 'Ativar notificações' : 'Silenciar notificações'}
            </button>

            <button
              onClick={() => { toast.info('Mensagens temporárias não disponíveis com engine NOWEB'); onClose() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <Timer className="w-4 h-4" />
              Mensagens temporárias
            </button>

            <div className="h-px bg-border my-1" />

            <button
              onClick={onLimpar}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Eraser className="w-4 h-4 text-muted-foreground" />
              Limpar conversa
            </button>

            <button
              onClick={onApagar}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Apagar conversa
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
})
MenuDropdown.displayName = 'MenuDropdown'

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(function ChatHeader({ conversa, onBack, onOpenDrawer, onAlterarStatus, onCriarOportunidade, onToggleBusca, onSilenciar, onLimparConversa, onApagarConversa }, _ref) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'limpar' | 'apagar' | null>(null)
  const [fotoError, setFotoError] = useState(false)
  const [sessionName, setSessionName] = useState('')
  // AIDEV-NOTE: Grupos/canais priorizam conversa.nome sobre contato.nome (pode ser ID numérico)
  const nome = (conversa.tipo === 'grupo' || conversa.tipo === 'canal')
    ? (conversa.nome || conversa.contato?.nome || 'Sem nome')
    : (conversa.contato?.nome || conversa.nome || 'Sem nome')
  const fotoUrl = conversa.contato?.foto_url || conversa.foto_url
  const fotoUrlValida = getValidWhatsAppUrl(fotoUrl)
  const statusInfo = statusLabels[conversa.status] || statusLabels.aberta
  const { data: conversaLabels = [] } = useLabelsConversa(conversa.id)
  const { status: presenceStatus } = usePresence(conversa.chat_id, sessionName || null, conversa.canal)

  // Fetch session_name for labels popover
  useEffect(() => {
    if (!conversa.sessao_whatsapp_id || conversa.canal !== 'whatsapp') return
    supabase
      .from('sessoes_whatsapp')
      .select('session_name')
      .eq('id', conversa.sessao_whatsapp_id)
      .maybeSingle()
      .then(({ data }: { data: { session_name: string } | null }) => {
        if (data?.session_name) setSessionName(data.session_name)
      })
  }, [conversa.sessao_whatsapp_id, conversa.canal])

  const handleConfirm = () => {
    if (confirmAction === 'limpar') onLimparConversa?.()
    if (confirmAction === 'apagar') onApagarConversa?.()
    setConfirmAction(null)
  }

  return (
    <>
      <div className="flex-shrink-0 h-14 bg-white/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-2 sm:px-3 gap-1 sm:gap-2">
        {/* Left: Back + Avatar + Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="lg:hidden p-1.5 sm:p-2 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            {fotoUrlValida && !fotoError ? (
              <img src={fotoUrlValida} alt={nome} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" onError={() => setFotoError(true)} />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-primary">{getInitials(nome)}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[80px] sm:max-w-[200px]">{nome}</span>
                {conversa.canal === 'whatsapp' ? (
                  <WhatsAppIcon size={14} className="text-[#25D366] flex-shrink-0" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="url(#ig-gradient-header)">
                    <defs>
                      <linearGradient id="ig-gradient-header" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F58529" />
                        <stop offset="50%" stopColor="#DD2A7B" />
                        <stop offset="100%" stopColor="#8134AF" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                )}
              </div>
              {/* AIDEV-NOTE: Indicador de presença — estilo WhatsApp Web: cinza no header */}
              {presenceStatus && presenceStatus !== 'unavailable' && presenceStatus !== 'paused' && (
                <span className={`text-[10px] sm:text-[11px] leading-tight ${
                  presenceStatus === 'composing' || presenceStatus === 'recording'
                    ? 'text-muted-foreground'
                    : 'text-success-foreground'
                }`}>
                  {presenceStatus === 'composing' ? 'digitando...'
                    : presenceStatus === 'recording' ? 'gravando áudio...'
                    : presenceStatus === 'available' ? 'online'
                    : null}
                </span>
              )}
            </div>
          </button>
          {/* AIDEV-NOTE: Etiquetas fora do botão para não propagar clique ao drawer */}
          <div className="hidden sm:flex items-center gap-1 min-w-0">
            {conversaLabels.length > 0 ? (
              <LabelsPopover conversaId={conversa.id} chatId={conversa.chat_id} sessionName={sessionName}>
                <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 text-[10px] sm:text-[11px]">
                  {conversaLabels.slice(0, 3).map(cl => (
                    <LabelBadge key={cl.id} nome={cl.whatsapp_labels.nome} corHex={cl.whatsapp_labels.cor_hex} />
                  ))}
                  {conversaLabels.length > 3 && <span className="text-[10px] text-muted-foreground">+{conversaLabels.length - 3}</span>}
                </span>
              </LabelsPopover>
            ) : conversa.canal === 'whatsapp' && sessionName ? (
              <LabelsPopover conversaId={conversa.id} chatId={conversa.chat_id} sessionName={sessionName}>
                <span className="flex items-center gap-0.5 cursor-pointer hover:text-primary transition-colors text-[10px] sm:text-[11px] text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  Etiquetas
                </span>
              </LabelsPopover>
            ) : null}
          </div>
        </div>

        {/* Right: Actions + Status + Menu */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <button
            onClick={onToggleBusca}
            className="p-1.5 sm:p-2 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
            title="Buscar na conversa"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>

          <TarefasConversaPopover
            contatoId={conversa.contato_id}
            contatoNome={nome}
            canal={conversa.canal as 'whatsapp' | 'instagram'}
          />

          {onCriarOportunidade && (
            <button
              onClick={onCriarOportunidade}
              className="hidden sm:flex p-2 min-w-[44px] min-h-[44px] items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
              title="Nova oportunidade"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${statusInfo.className}`}>
            {statusInfo.label}
          </span>

          {/* Menu */}
          <MenuDropdown
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(!menuOpen)}
            onClose={() => setMenuOpen(false)}
            conversa={conversa}
            onAlterarStatus={(s) => { onAlterarStatus(s); setMenuOpen(false) }}
            onSilenciar={() => { onSilenciar?.(!conversa.silenciada); setMenuOpen(false) }}
            onLimpar={() => { setMenuOpen(false); setConfirmAction('limpar') }}
            onApagar={() => { setMenuOpen(false); setConfirmAction('apagar') }}
          />
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmAction(null)}>
          <div className="bg-popover border border-border rounded-lg shadow-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {confirmAction === 'limpar' ? 'Limpar conversa?' : 'Apagar conversa?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {confirmAction === 'limpar'
                ? 'Todas as mensagens serão apagadas no CRM e no WhatsApp. Esta ação não pode ser desfeita.'
                : 'A conversa será removida do CRM e do WhatsApp. Esta ação não pode ser desfeita.'
              }
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-foreground bg-muted hover:bg-accent rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
              >
                {confirmAction === 'limpar' ? 'Limpar' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
ChatHeader.displayName = 'ChatHeader'
