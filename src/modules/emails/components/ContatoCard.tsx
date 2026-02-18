/**
 * AIDEV-NOTE: Card compacto do contato CRM vinculado ao email (RF-007)
 * Busca contato por contato_id ou de_email
 * Ao clicar "Criar", abre o modal ContatoFormModal inline (mesmo modal de /contatos)
 * Ao clicar "Vincular", abre popover de busca para vincular contato existente
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User, Building2, Plus, ExternalLink, Link2, Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ContatoFormModal } from '@/modules/contatos/components/ContatoFormModal'
import { useCriarContato } from '@/modules/contatos/hooks/useContatos'
import { toast } from 'sonner'

interface ContatoCardProps {
  contatoId: string | null
  email: string
  nome?: string | null
  emailId?: string | null
}

async function buscarContato(contatoId: string | null, email: string, nome?: string | null) {
  // 1. Busca por contato_id direto
  if (contatoId) {
    const { data } = await supabase
      .from('contatos')
      .select('id, nome, sobrenome, email, cargo, tipo')
      .eq('id', contatoId)
      .is('deletado_em', null)
      .maybeSingle()
    if (data) return data
  }

  // 2. Busca por email exato
  const { data: porEmail } = await supabase
    .from('contatos')
    .select('id, nome, sobrenome, email, cargo, tipo')
    .eq('email', email)
    .is('deletado_em', null)
    .maybeSingle()
  if (porEmail) return porEmail

  // 3. Fallback: busca por nome (de_nome do email contra nome do contato)
  if (nome && nome.trim().length >= 3) {
    const partes = nome.trim().split(/\s+/)
    const primeiroNome = partes[0]
    if (primeiroNome.length >= 3) {
      const { data: porNome } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, cargo, tipo')
        .ilike('nome', `${primeiroNome}%`)
        .is('deletado_em', null)
        .limit(1)
        .maybeSingle()
      if (porNome) return porNome
    }
  }

  return null
}

export function ContatoCard({ contatoId, email, nome, emailId }: ContatoCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [vincularOpen, setVincularOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [vinculando, setVinculando] = useState(false)
  const vincularRef = useRef<HTMLDivElement>(null)
  const criarContato = useCriarContato()

  const { data: contato } = useQuery({
    queryKey: ['contato-email', contatoId, email],
    queryFn: () => buscarContato(contatoId, email, nome),
    enabled: !!email,
    staleTime: 60000,
  })

  // Busca contatos para vincular
  const { data: contatosBusca, isFetching: buscando } = useQuery({
    queryKey: ['contatos-vincular', search],
    queryFn: async () => {
      let query = supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, tipo')
        .eq('tipo', 'pessoa')
        .is('deletado_em', null)
        .limit(8)

      if (search.trim().length > 0) {
        query = query.or(`nome.ilike.%${search}%,sobrenome.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data } = await query.order('nome')
      return data || []
    },
    enabled: vincularOpen,
    staleTime: 10000,
  })

  // Fechar popover ao clicar fora
  useEffect(() => {
    if (!vincularOpen) return
    function handleClick(e: MouseEvent) {
      if (vincularRef.current && !vincularRef.current.contains(e.target as Node)) {
        setVincularOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [vincularOpen])

  if (contato === undefined) return null

  const handleFormSubmit = (data: Record<string, unknown>) => {
    criarContato.mutate(data as any, {
      onSuccess: () => {
        toast.success('Contato criado com sucesso!')
        setModalOpen(false)
        queryClient.invalidateQueries({ queryKey: ['contato-email', contatoId, email] })
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Erro ao criar contato')
      },
    })
  }

  const handleVincular = async (contatoSelecionadoId: string) => {
    if (!emailId) {
      toast.error('Não foi possível vincular: email sem ID')
      return
    }
    setVinculando(true)
    try {
      const { error } = await supabase
        .from('emails_recebidos')
        .update({ contato_id: contatoSelecionadoId })
        .eq('id', emailId)

      if (error) throw error

      toast.success('Contato vinculado com sucesso!')
      setVincularOpen(false)
      setSearch('')
      queryClient.invalidateQueries({ queryKey: ['contato-email', contatoId, email] })
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao vincular contato')
    } finally {
      setVinculando(false)
    }
  }

  // Preparar initialValues a partir do nome do remetente
  const initialValues: { email?: string; nome?: string } = { email }
  if (nome) {
    const partes = nome.trim().split(/\s+/)
    initialValues.nome = partes[0]
  }

  if (!contato) {
    return (
      <>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20 relative">
          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            Contato não encontrado no CRM
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0 cursor-pointer relative z-10"
          >
            <Plus className="w-3 h-3" />
            Criar
          </button>

          {/* Vincular contato existente */}
          <div className="relative" ref={vincularRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setVincularOpen(!vincularOpen)
              }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0 cursor-pointer relative z-10"
              title="Vincular contato existente"
            >
              <Link2 className="w-3 h-3" />
              Vincular
            </button>

            {vincularOpen && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-background border border-border rounded-lg shadow-lg z-[500] py-1">
                <div className="px-2 py-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar contato por nome ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto">
                  {buscando && (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!buscando && contatosBusca && contatosBusca.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                      Nenhum contato encontrado
                    </p>
                  )}

                  {!buscando && contatosBusca?.map((c) => {
                    const nomeDisplay = [c.nome, c.sobrenome].filter(Boolean).join(' ') || '(sem nome)'
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={vinculando}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVincular(c.id)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
                      >
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{nomeDisplay}</p>
                          {c.email && (
                            <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {modalOpen && createPortal(
          <ContatoFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleFormSubmit}
            tipo="pessoa"
            loading={criarContato.isPending}
            initialValues={initialValues}
          />,
          document.body
        )}
      </>
    )
  }

  const nomeCompleto = [contato.nome, contato.sobrenome].filter(Boolean).join(' ') || email

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/20">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {contato.tipo === 'empresa' ? (
          <Building2 className="w-3.5 h-3.5 text-primary" />
        ) : (
          <User className="w-3.5 h-3.5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{nomeCompleto}</p>
        {contato.cargo && (
          <p className="text-[11px] text-muted-foreground truncate">{contato.cargo}</p>
        )}
      </div>
      <button
        onClick={() => navigate(`/app/contatos/${contato.id}`)}
        className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        title="Ver contato"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}