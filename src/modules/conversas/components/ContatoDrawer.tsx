/**
 * AIDEV-NOTE: Drawer lateral com informações do contato
 */

import { useState } from 'react'
import { X, Phone, Mail, ChevronDown, ChevronRight, Loader2, MessageSquare } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi, type Conversa, type NotaContato } from '../services/conversas.api'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ContatoDrawerProps {
  conversa: Conversa
  isOpen: boolean
  onClose: () => void
}

function getInitials(nome?: string | null): string {
  if (!nome) return '?'
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function SectionCollapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-all duration-200"
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

export function ContatoDrawer({ conversa, isOpen, onClose }: ContatoDrawerProps) {
  const [novaNota, setNovaNota] = useState('')
  const queryClient = useQueryClient()

  const contato = conversa.contato
  const nome = contato?.nome || conversa.nome || 'Sem nome'

  const { data: notasData, isLoading: notasLoading } = useQuery({
    queryKey: ['notas-contato', conversa.contato_id],
    queryFn: () => conversasApi.listarNotas(conversa.contato_id),
    enabled: isOpen && !!conversa.contato_id,
  })

  const criarNota = useMutation({
    mutationFn: (conteudo: string) => conversasApi.criarNota(conversa.contato_id, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-contato', conversa.contato_id] })
      setNovaNota('')
      toast.success('Nota salva')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Erro ao salvar nota')
    },
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/30 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed right-0 top-0 bottom-0 z-[301] w-[320px] bg-white border-l border-border
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Info do Contato</span>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md transition-all duration-200">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-border/50">
            {contato?.foto_url ? (
              <img src={contato.foto_url} alt={nome} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{getInitials(nome)}</span>
              </div>
            )}
            <h3 className="mt-3 text-base font-semibold text-foreground text-center">{nome}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {conversa.canal === 'whatsapp' ? (
                <WhatsAppIcon size={14} className="text-[#25D366]" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              )}
              <span className="text-xs text-muted-foreground capitalize">{conversa.canal}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-4 py-3 space-y-2 border-b border-border/50">
            {contato?.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contato.telefone}</span>
              </div>
            )}
            {contato?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground truncate">{contato.email}</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <SectionCollapsible title="Notas do Contato" defaultOpen>
            {notasLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {(notasData?.notas || []).map((nota: NotaContato) => (
                  <div key={nota.id} className="p-2 rounded-md bg-warning-muted/20 border border-warning/20">
                    <p className="text-xs text-foreground whitespace-pre-wrap">{nota.conteudo}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(nota.criado_em), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}

                {/* Add note */}
                <div className="space-y-1.5 mt-2">
                  <textarea
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    placeholder="Adicionar nota..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => novaNota.trim() && criarNota.mutate(novaNota.trim())}
                    disabled={!novaNota.trim() || criarNota.isPending}
                    className="w-full py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                  >
                    {criarNota.isPending ? 'Salvando...' : 'Salvar Nota'}
                  </button>
                </div>
              </div>
            )}
          </SectionCollapsible>

          {/* Conversation Info */}
          <SectionCollapsible title="Informações da Conversa">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal</span>
                <span className="text-foreground capitalize">{conversa.canal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground capitalize">{conversa.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de mensagens</span>
                <span className="text-foreground">{conversa.total_mensagens}</span>
              </div>
              {conversa.primeira_mensagem_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira mensagem</span>
                  <span className="text-foreground">{format(new Date(conversa.primeira_mensagem_em), 'dd/MM/yyyy')}</span>
                </div>
              )}
              {conversa.ultima_mensagem_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última mensagem</span>
                  <span className="text-foreground">{format(new Date(conversa.ultima_mensagem_em), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </SectionCollapsible>
        </div>
      </div>
    </>
  )
}
