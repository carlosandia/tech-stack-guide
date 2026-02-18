/**
 * AIDEV-NOTE: Card compacto do contato CRM vinculado ao email (RF-007)
 * Busca contato por contato_id ou de_email
 * Ao clicar "Criar", abre o modal ContatoFormModal inline (mesmo modal de /contatos)
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User, Building2, Plus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ContatoFormModal } from '@/modules/contatos/components/ContatoFormModal'
import { useCriarContato } from '@/modules/contatos/hooks/useContatos'
import { toast } from 'sonner'

interface ContatoCardProps {
  contatoId: string | null
  email: string
  nome?: string | null
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

export function ContatoCard({ contatoId, email, nome }: ContatoCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const criarContato = useCriarContato()

  const { data: contato } = useQuery({
    queryKey: ['contato-email', contatoId, email],
    queryFn: () => buscarContato(contatoId, email, nome),
    enabled: !!email,
    staleTime: 60000,
  })

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

  // Preparar initialValues a partir do nome do remetente
  const initialValues: { email?: string; nome?: string } = { email }
  if (nome) {
    const partes = nome.trim().split(/\s+/)
    initialValues.nome = partes[0]
  }

  if (!contato) {
    return (
      <>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20">
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
