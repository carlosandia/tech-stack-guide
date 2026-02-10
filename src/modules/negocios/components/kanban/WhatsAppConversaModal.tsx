/**
 * AIDEV-NOTE: Modal que abre uma conversa WhatsApp inline a partir do Kanban card
 * Busca conversa existente pelo telefone do contato ou mostra mensagem se não encontrada
 */

import { useState, useEffect } from 'react'
import { Loader2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ChatWindow } from '@/modules/conversas/components/ChatWindow'
import { useCriarConversa } from '@/modules/conversas/hooks/useConversas'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
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
  const [mensagem, setMensagem] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const criarConversa = useCriarConversa()

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
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground px-6">
              <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <WhatsAppIcon size={32} className="text-[#25D366] opacity-60" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhuma conversa encontrada</p>
              <p className="text-xs text-center max-w-xs">
                Envie uma mensagem para iniciar uma conversa com {contatoNome} via WhatsApp.
              </p>
              <div className="w-full max-w-sm space-y-3">
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite a primeira mensagem..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
                <button
                  onClick={async () => {
                    if (!mensagem.trim()) return
                    setIniciando(true)
                    try {
                      const dados: any = {
                        canal: 'whatsapp' as const,
                        mensagem_inicial: mensagem.trim(),
                      }
                      if (contatoId) {
                        dados.contato_id = contatoId
                      } else if (telefone) {
                        const phoneClean = telefone.replace(/\D/g, '')
                        dados.telefone = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`
                      }
                      criarConversa.mutate(dados, {
                        onSuccess: (data) => {
                          setMensagem('')
                          setNotFound(false)
                          // Re-fetch conversa
                          setLoading(true)
                          setTimeout(async () => {
                            const { data: conv } = await supabase
                              .from('conversas')
                              .select('*, contato:contatos!conversas_contato_id_fkey(id, nome, nome_fantasia, email, telefone)')
                              .eq('id', data.id)
                              .maybeSingle()
                            if (conv) setConversa(conv as any)
                            setLoading(false)
                          }, 1000)
                        },
                        onError: () => setIniciando(false),
                      })
                    } catch {
                      setIniciando(false)
                    }
                  }}
                  disabled={!mensagem.trim() || iniciando}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-[#25D366] text-white hover:bg-[#25D366]/90 disabled:opacity-50 transition-colors"
                >
                  {iniciando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {iniciando ? 'Enviando...' : 'Iniciar Conversa'}
                </button>
              </div>
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
