/**
 * AIDEV-NOTE: Header da janela de chat
 * Avatar, nome do contato, ações (status, drawer, tarefas, criar oportunidade, buscar)
 * Menu expandido: silenciar, limpar conversa, apagar conversa
 */

import { ArrowLeft, MoreVertical, CircleDot, Search, Plus, BellOff, Bell, Trash2, Eraser, Timer, CheckCircle2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { TarefasConversaPopover } from './TarefasConversaPopover'
import { toast } from 'sonner'
import type { Conversa } from '../services/conversas.api'

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
function MenuDropdown({
  isOpen, onToggle, onClose, conversa,
  onAlterarStatus, onSilenciar, onLimpar, onApagar,
}: {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  conversa: Conversa
  onAlterarStatus: (s: 'aberta' | 'pendente' | 'fechada') => void
  onSilenciar: () => void
  onLimpar: () => void
  onApagar: () => void
}) {
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

            {conversa.status !== 'fechada' && (
              <button
                onClick={() => { onAlterarStatus('fechada'); onClose() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                Finalizar conversa
              </button>
            )}

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
}

export function ChatHeader({ conversa, onBack, onOpenDrawer, onAlterarStatus, onCriarOportunidade, onToggleBusca, onSilenciar, onLimparConversa, onApagarConversa }: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'limpar' | 'apagar' | null>(null)
  const nome = conversa.contato?.nome || conversa.nome || 'Sem nome'
  const fotoUrl = conversa.contato?.foto_url || conversa.foto_url
  const statusInfo = statusLabels[conversa.status] || statusLabels.aberta

  const handleConfirm = () => {
    if (confirmAction === 'limpar') onLimparConversa?.()
    if (confirmAction === 'apagar') onApagarConversa?.()
    setConfirmAction(null)
  }

  return (
    <>
      <div className="flex-shrink-0 h-14 bg-white/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-3 gap-2">
        {/* Left: Back + Avatar + Info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt={nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">{getInitials(nome)}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">{nome}</span>
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
                {conversa.tipo !== 'individual' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                    {conversa.tipo === 'grupo' ? 'Grupo' : 'Canal'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground text-left">Clique para info do contato</p>
            </div>
          </button>
        </div>

        {/* Right: Actions + Status + Menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBusca}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
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
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200"
              title="Nova oportunidade"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.className}`}>
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
}
