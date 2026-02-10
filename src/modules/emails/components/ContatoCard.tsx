/**
 * AIDEV-NOTE: Card compacto do contato CRM vinculado ao email (RF-007)
 * Busca contato por contato_id ou de_email
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User, Building2, Plus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ContatoCardProps {
  contatoId: string | null
  email: string
  nome?: string | null
}

async function buscarContato(contatoId: string | null, email: string) {
  if (contatoId) {
    const { data } = await supabase
      .from('contatos')
      .select('id, nome, sobrenome, email, cargo, tipo')
      .eq('id', contatoId)
      .is('deletado_em', null)
      .maybeSingle()
    if (data) return data
  }

  const { data } = await supabase
    .from('contatos')
    .select('id, nome, sobrenome, email, cargo, tipo')
    .eq('email', email)
    .is('deletado_em', null)
    .maybeSingle()
  return data
}

export function ContatoCard({ contatoId, email, nome }: ContatoCardProps) {
  const navigate = useNavigate()

  const { data: contato } = useQuery({
    queryKey: ['contato-email', contatoId, email],
    queryFn: () => buscarContato(contatoId, email),
    enabled: !!email,
    staleTime: 60000,
  })

  if (contato === undefined) return null

  const handleCriarContato = () => {
    const params = new URLSearchParams({ criar: 'pessoa', email })
    if (nome) params.set('nome', nome)
    navigate(`/app/contatos/pessoas?${params.toString()}`)
  }

  if (!contato) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20">
        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground truncate">
          Contato não encontrado no CRM
        </span>
        <button
          onClick={handleCriarContato}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
        >
          <Plus className="w-3 h-3" />
          Criar
        </button>
      </div>
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
