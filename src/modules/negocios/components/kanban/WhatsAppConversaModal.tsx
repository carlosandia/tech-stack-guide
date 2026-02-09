/**
 * AIDEV-NOTE: Modal que abre uma conversa WhatsApp inline a partir do Kanban card
 * Busca conversa existente pelo telefone do contato ou mostra mensagem se não encontrada
 */

import { useState, useEffect } from 'react'
import { Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ChatWindow } from '@/modules/conversas/components/ChatWindow'
import type { Conversa } from '@/modules/conversas/services/conversas.api'

interface WhatsAppConversaModalProps {
  isOpen: boolean
  onClose: () => void
  contatoId: string
  contatoNome: string
  telefone: string
}

export function WhatsAppConversaModal({ isOpen, onClose, contatoId, contatoNome, telefone }: WhatsAppConversaModalProps) {
  const [conversa, setConversa] = useState<Conversa | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setNotFound(false)
    setConversa(null)

    const buscarConversa = async () => {
      try {
        // Build query - by contato_id or by phone number
        let query = supabase
          .from('conversas')
          .select(`
            *,
            contato:contatos!conversas_contato_id_fkey(id, nome, nome_fantasia, email, telefone)
          `)
          .eq('canal', 'whatsapp')
          .order('ultima_mensagem_em', { ascending: false })
          .limit(1)

        if (contatoId) {
          query = query.eq('contato_id', contatoId).is('deletado_em', null)
        } else if (telefone) {
          // For pre-opportunities, search by chat_id format (phone@c.us)
          // Don't filter by deletado_em since the conversation may have been soft-deleted
          const phoneClean = telefone.replace(/\D/g, '')
          query = query.eq('chat_id', `${phoneClean}@c.us`)
        }

        const { data, error } = await query.maybeSingle()

        if (error) throw error

        if (data) {
          setConversa(data as any)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error('Erro ao buscar conversa:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    buscarConversa()
  }, [isOpen, contatoId])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-foreground/30" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 lg:inset-y-8 lg:left-[15%] lg:right-[15%] z-[501] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Content - ChatWindow provides its own header */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <MessageCircle className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
              <p className="text-xs text-center max-w-xs">
                Não foi encontrada nenhuma conversa WhatsApp com {contatoNome} ({telefone}).
                Inicie uma conversa pelo módulo Conversas.
              </p>
            </div>
          ) : conversa ? (
            <ChatWindow
              conversa={conversa}
              onBack={onClose}
              onOpenDrawer={() => {}}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
